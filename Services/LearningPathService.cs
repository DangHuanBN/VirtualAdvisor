using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public class LearningPathService : ILearningPathService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<LearningPathService> _logger;

        public LearningPathService(AppDbContext context, ILogger<LearningPathService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Phương thức tạo learningpath khi admin tạo khóa học mới
        public async Task<LearningPath> CreateLearningPathWhenCourseCreated(int courseId)
        {
            try
            {
                _logger.LogInformation($"Bắt đầu tạo learning path cho course ID: {courseId}");
                
                // Kiểm tra course có tồn tại không
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    _logger.LogWarning($"Không tìm thấy course với ID: {courseId}");
                    throw new Exception($"Không tìm thấy khóa học với ID: {courseId}");
                }

                // Kiểm tra xem đã có learning path cho course này chưa
                var existingPath = await _context.LearningPaths
                    .FirstOrDefaultAsync(lp => lp.CourseId == courseId);
                    
                if (existingPath != null)
                {
                    _logger.LogInformation($"Đã tồn tại learning path cho course ID: {courseId}");
                    return existingPath;
                }

                // Tạo learning path mới
                var learningPath = new LearningPath
                {
                    CourseId = courseId,
                    PathName = course.CourseName // Sử dụng tên khóa học làm tên learning path
                };

                _context.LearningPaths.Add(learningPath);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã tạo learning path thành công với ID: {learningPath.PathId}");
                
                return learningPath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo learning path cho course ID: {courseId}");
                throw;
            }
        }

        // Phương thức thêm bài giảng vào learning path
        public async Task<LearningPathDetail> AddLectureToLearningPath(int lectureId)
        {
            try
            {
                _logger.LogInformation($"===== BẮT ĐẦU: AddLectureToLearningPath(lectureId: {lectureId}) =====");
                
                // Kiểm tra lecture có tồn tại không
                var lecture = await _context.Lectures
                    .Include(l => l.Course)
                    .FirstOrDefaultAsync(l => l.LectureId == lectureId);
                    
                if (lecture == null)
                {
                    _logger.LogWarning($"Không tìm thấy bài giảng với ID: {lectureId}");
                    throw new Exception($"Không tìm thấy bài giảng với ID: {lectureId}");
                }

                _logger.LogInformation($"Tìm thấy bài giảng: ID={lectureId}, CourseId={lecture.CourseId}, Title={lecture.Title}");

                // Kiểm tra và lấy course.type
                if (lecture.Course == null)
                {
                    _logger.LogWarning($"Bài giảng (ID: {lectureId}) không liên kết với khóa học nào");
                    throw new Exception($"Bài giảng không liên kết với khóa học nào");
                }
                
                _logger.LogInformation($"Khóa học của bài giảng: ID={lecture.CourseId}, Type={lecture.Course.Type}");
                
                // Lấy learning path dựa trên course_id
                var learningPath = await _context.LearningPaths
                    .FirstOrDefaultAsync(lp => lp.CourseId == lecture.CourseId);
                    
                if (learningPath == null)
                {
                    _logger.LogInformation($"Chưa có learning path cho course ID: {lecture.CourseId}, tiến hành tạo mới");
                    learningPath = await CreateLearningPathWhenCourseCreated(lecture.CourseId);
                    _logger.LogInformation($"Đã tạo mới learning path ID: {learningPath.PathId}");
                }
                else
                {
                    _logger.LogInformation($"Tìm thấy learning path: ID={learningPath.PathId}, Name={learningPath.PathName}");
                }

                // Kiểm tra xem lecture đã tồn tại trong learning path chưa
                var existingDetail = await _context.LearningPathDetails
                    .FirstOrDefaultAsync(lpd => lpd.PathId == learningPath.PathId && lpd.LectureId == lectureId);
                    
                if (existingDetail != null)
                {
                    _logger.LogInformation($"Bài giảng (ID: {lectureId}) đã tồn tại trong learning path (ID: {learningPath.PathId})");
                    return existingDetail;
                }

                // Tính toán order_number cho bài giảng mới
                int nextOrderNumber = 1; // Mặc định là 1 nếu chưa có bài giảng nào
                
                if (lecture.Course.Type == "tuantu") // Nếu là khóa học tuần tự
                {
                    // Lấy order_number lớn nhất hiện tại
                    var maxOrderNumber = await _context.LearningPathDetails
                        .Where(lpd => lpd.PathId == learningPath.PathId)
                        .Select(lpd => (int?)lpd.OrderNumber)
                        .MaxAsync() ?? 0;
                        
                    nextOrderNumber = maxOrderNumber + 1;
                    _logger.LogInformation($"Khóa học tuần tự: nextOrderNumber = {nextOrderNumber}");
                }
                else // Khóa học tự do
                {
                    // Trong khóa học tự do, đơn giản là thêm vào với order_number = 1
                    _logger.LogInformation("Khóa học tự do: nextOrderNumber = 1");
                }
                
                // Tạo chi tiết learning path mới
                var learningPathDetail = new LearningPathDetail
                {
                    PathId = learningPath.PathId,
                    LectureId = lectureId,
                    OrderNumber = nextOrderNumber
                };
                
                _context.LearningPathDetails.Add(learningPathDetail);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã thêm bài giảng (ID: {lectureId}) vào learning path (ID: {learningPath.PathId}) với order_number = {nextOrderNumber}");
                
                return learningPathDetail;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"LỖI khi thêm bài giảng (ID: {lectureId}) vào learning path: {ex.Message}");
                throw;
            }
        }

        // Phương thức lấy loại khóa học (tuantu/tudo) dựa trên course_id
        public async Task<string> GetCourseTypeById(int courseId)
        {
            try
            {
                var course = await _context.Courses.FindAsync(courseId);
                if (course == null)
                {
                    throw new Exception($"Không tìm thấy khóa học với ID: {courseId}");
                }
                
                return course.Type;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy loại khóa học cho ID: {courseId}");
                throw;
            }
        }
        
        // Phương thức lấy lộ trình học tập của sinh viên
        public async Task<IEnumerable<StudentLearningPathDTO>> GetStudentLearningPathsAsync(int studentId)
        {
            try
            {
                // Kiểm tra sinh viên tồn tại
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == studentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                    throw new Exception($"Không tìm thấy sinh viên với ID: {studentId}");
                }
                
                // Lấy danh sách các khóa học mà sinh viên đã đăng ký
                var enrolledCourses = await _context.StudentEnrollments
                    .Where(se => se.UserId == studentId)
                    .Select(se => se.CourseId)
                    .ToListAsync();
                
                if (!enrolledCourses.Any())
                {
                    _logger.LogInformation($"Sinh viên (ID: {studentId}) chưa đăng ký khóa học nào");
                    return new List<StudentLearningPathDTO>();
                }
                
                // Lấy các learning path tương ứng với các khóa học đã đăng ký
                var learningPaths = await _context.LearningPaths
                    .Include(lp => lp.Course)
                    .Where(lp => enrolledCourses.Contains(lp.CourseId))
                    .ToListAsync();
                
                var result = new List<StudentLearningPathDTO>();
                
                foreach (var path in learningPaths)
                {
                    // Tính toán tiến độ cho từng learning path
                    var pathDetails = await _context.LearningPathDetails
                        .Where(lpd => lpd.PathId == path.PathId)
                        .Select(lpd => lpd.LectureId)
                        .ToListAsync();
                    
                    if (!pathDetails.Any())
                    {
                        continue; // Bỏ qua nếu learning path không có bài giảng nào
                    }
                    
                    // Lấy dữ liệu tracking của sinh viên cho các bài giảng trong path
                    var trackingData = await _context.Set<StudyTracking>()
                        .Where(st => st.UserId == studentId && pathDetails.Contains(st.LectureId))
                        .ToListAsync();
                    
                    // Tính toán tiến độ
                    int totalLectures = pathDetails.Count;
                    int completedLectures = trackingData.Count(t => t.Status == "hoanthanh");
                    decimal progress = totalLectures > 0 ? Math.Round((decimal)completedLectures / totalLectures * 100, 1) : 0;
                    
                    // Xác định trạng thái
                    string status = "chưa học";
                    if (completedLectures == totalLectures && totalLectures > 0)
                    {
                        status = "hoàn thành";
                    }
                    else if (trackingData.Any())
                    {
                        status = "đang học";
                    }
                    
                    result.Add(new StudentLearningPathDTO
                    {
                        PathId = path.PathId,
                        CourseId = path.CourseId,
                        PathName = path.PathName,
                        CourseName = path.Course?.CourseName ?? $"Khóa học ID: {path.CourseId}",
                        TotalProgress = progress,
                        Status = status
                    });
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lộ trình học tập của sinh viên (ID: {studentId}): {ex.Message}");
                throw;
            }
        }
        
        // Phương thức lấy chi tiết lộ trình học tập theo path_id
        public async Task<StudentLearningPathDetailDTO> GetStudentLearningPathDetailAsync(int pathId, int studentId)
        {
            try
            {
                // Kiểm tra learning path tồn tại
                var learningPath = await _context.LearningPaths
                    .Include(lp => lp.Course)
                    .FirstOrDefaultAsync(lp => lp.PathId == pathId);
                
                if (learningPath == null)
                {
                    _logger.LogWarning($"Không tìm thấy learning path với ID: {pathId}");
                    throw new Exception($"Không tìm thấy learning path với ID: {pathId}");
                }
                
                // Kiểm tra sinh viên đã đăng ký khóa học này chưa
                var enrolled = await _context.StudentEnrollments
                    .AnyAsync(se => se.UserId == studentId && se.CourseId == learningPath.CourseId);
                
                if (!enrolled)
                {
                    _logger.LogWarning($"Sinh viên (ID: {studentId}) chưa đăng ký khóa học (ID: {learningPath.CourseId})");
                    throw new Exception($"Sinh viên chưa đăng ký khóa học này");
                }
                
                // Lấy chi tiết learning path và bài giảng liên quan
                var pathDetails = await _context.LearningPathDetails
                    .Include(lpd => lpd.Lecture)
                    .Where(lpd => lpd.PathId == pathId)
                    .OrderBy(lpd => lpd.OrderNumber)
                    .ToListAsync();
                
                if (!pathDetails.Any())
                {
                    // Trả về learning path trống nếu không có bài giảng nào
                    return new StudentLearningPathDetailDTO
                    {
                        PathId = pathId,
                        PathName = learningPath.PathName,
                        CourseId = learningPath.CourseId,
                        CourseName = learningPath.Course?.CourseName ?? $"Khóa học ID: {learningPath.CourseId}",
                        TotalProgress = 0,
                        Status = "chưa học",
                        Modules = new List<LearningPathModuleDTO>()
                    };
                }
                
                // Lấy dữ liệu tracking của sinh viên cho các bài giảng trong path
                var lectureIds = pathDetails.Select(lpd => lpd.LectureId).ToList();
                var trackingData = await _context.Set<StudyTracking>()
                    .Where(st => st.UserId == studentId && lectureIds.Contains(st.LectureId))
                    .ToListAsync();
                
                // Tính toán tiến độ tổng thể
                int totalLectures = pathDetails.Count;
                int completedLectures = trackingData.Count(t => t.Status == "hoanthanh");
                decimal totalProgress = totalLectures > 0 ? Math.Round((decimal)completedLectures / totalLectures * 100, 1) : 0;
                
                // Xác định trạng thái tổng thể
                string overallStatus = "chưa học";
                if (completedLectures == totalLectures && totalLectures > 0)
                {
                    overallStatus = "hoàn thành";
                }
                else if (trackingData.Any())
                {
                    overallStatus = "đang học";
                }
                
                // Nhóm bài giảng theo module (tạm thời sử dụng một module mặc định)
                var moduleGrouping = pathDetails
                    .GroupBy(lpd => "Phần " + Math.Ceiling((double)lpd.OrderNumber / 5))
                    .ToDictionary(g => g.Key, g => g.ToList());
                
                var modules = new List<LearningPathModuleDTO>();
                
                foreach (var module in moduleGrouping)
                {
                    var lectures = new List<LectureProgressDTO>();
                    var lastCompletedOrder = 0;
                    
                    // Tìm bài giảng cuối cùng đã hoàn thành để xác định trạng thái của các bài tiếp theo
                    if (learningPath.Course?.Type == "tuantu") // Chỉ áp dụng cho khóa học tuần tự
                    {
                        var completedLectureIds = trackingData
                            .Where(t => t.Status == "hoanthanh")
                            .Select(t => t.LectureId)
                            .ToList();
                            
                        var lastCompletedLecture = module.Value
                            .Where(lpd => completedLectureIds.Contains(lpd.LectureId))
                            .OrderByDescending(lpd => lpd.OrderNumber)
                            .FirstOrDefault();
                            
                        if (lastCompletedLecture != null)
                        {
                            lastCompletedOrder = lastCompletedLecture.OrderNumber;
                        }
                    }
                    
                    foreach (var detail in module.Value.OrderBy(d => d.OrderNumber))
                    {
                        var tracking = trackingData.FirstOrDefault(t => t.LectureId == detail.LectureId);
                        var lecture = detail.Lecture;
                        
                        if (lecture == null) continue;
                        
                        // Xác định trạng thái của bài giảng
                        string lectureStatus;
                        
                        if (tracking?.Status == "hoanthanh")
                        {
                            lectureStatus = "hoanthanh";
                        }
                        else if (tracking != null)
                        {
                            lectureStatus = "danghoc";
                        }
                        else if (learningPath.Course?.Type == "tuantu" && detail.OrderNumber > lastCompletedOrder + 1)
                        {
                            // Khóa bài giảng nếu là khóa học tuần tự và chưa hoàn thành bài trước đó
                            lectureStatus = "khoa";
                        }
                        else
                        {
                            lectureStatus = "chuahoc";
                        }
                        
                        lectures.Add(new LectureProgressDTO
                        {
                            LectureId = detail.LectureId,
                            Title = lecture.Title ?? string.Empty,
                            Type = lecture.Type ?? "baigiang",
                            OrderNumber = detail.OrderNumber,
                            Progress = tracking?.Progress ?? 0,
                            Status = lectureStatus,
                            StartDate = tracking?.StartDate,
                            EndDate = tracking?.EndDate
                        });
                    }
                    
                    modules.Add(new LearningPathModuleDTO
                    {
                        ModuleName = module.Key,
                        Lectures = lectures
                    });
                }
                
                return new StudentLearningPathDetailDTO
                {
                    PathId = pathId,
                    PathName = learningPath.PathName,
                    CourseId = learningPath.CourseId,
                    CourseName = learningPath.Course?.CourseName ?? $"Khóa học ID: {learningPath.CourseId}",
                    TotalProgress = totalProgress,
                    Status = overallStatus,
                    Modules = modules
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy chi tiết lộ trình học tập (ID: {pathId}) cho sinh viên (ID: {studentId}): {ex.Message}");
                throw;
            }
        }
        
        // Phương thức gợi ý các khóa học tiếp theo
        public async Task<IEnumerable<CourseRecommendationDTO>> GetRecommendedCoursesAsync(int studentId)
        {
            try
            {
                // Kiểm tra sinh viên tồn tại
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == studentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                    throw new Exception($"Không tìm thấy sinh viên với ID: {studentId}");
                }
                
                // Lấy danh sách các khóa học mà sinh viên đã đăng ký
                var enrolledCourseIds = await _context.StudentEnrollments
                    .Where(se => se.UserId == studentId)
                    .Select(se => se.CourseId)
                    .ToListAsync();
                
                // Lấy danh sách các môn học của các khóa học đã đăng ký
                var enrolledSubjectIds = await _context.Courses
                    .Where(c => enrolledCourseIds.Contains(c.CourseId) && c.SubjectId > 0)
                    .Select(c => c.SubjectId)
                    .Distinct()
                    .ToListAsync();
                
                // Lấy các khóa học cùng môn học mà sinh viên chưa đăng ký
                var recommendedCourses = await _context.Courses
                    .Where(c => !enrolledCourseIds.Contains(c.CourseId) && enrolledSubjectIds.Contains(c.SubjectId))
                    .Take(5) // Giới hạn 5 khóa học
                    .ToListAsync();
                
                // Nếu không đủ 5 khóa học, bổ sung thêm các khóa học khác
                if (recommendedCourses.Count < 5)
                {
                    var additionalCourses = await _context.Courses
                        .Where(c => !enrolledCourseIds.Contains(c.CourseId) && !enrolledSubjectIds.Contains(c.SubjectId))
                        .Take(5 - recommendedCourses.Count)
                        .ToListAsync();
                    
                    recommendedCourses.AddRange(additionalCourses);
                }
                
                var result = new List<CourseRecommendationDTO>();
                
                // Mapping từ Course sang CourseRecommendationDTO
                foreach (var course in recommendedCourses)
                {
                    // Đếm số bài giảng để ước tính số tuần học
                    var lectureCount = await _context.Lectures.CountAsync(l => l.CourseId == course.CourseId);
                    int estimatedWeeks = (int)Math.Ceiling(lectureCount / 5.0);
                    if (estimatedWeeks < 1) estimatedWeeks = 1;
                    
                    // Lấy icon phù hợp dựa vào tên khóa học
                    string icon = "fas fa-book"; // Mặc định
                    string courseName = course.CourseName.ToLowerInvariant();
                    
                    if (courseName.Contains("python"))
                    {
                        icon = "fab fa-python";
                    }
                    else if (courseName.Contains("java"))
                    {
                        icon = "fab fa-java";
                    }
                    else if (courseName.Contains("web") || courseName.Contains("html") || courseName.Contains("css"))
                    {
                        icon = "fas fa-globe";
                    }
                    else if (courseName.Contains("database") || courseName.Contains("sql") || courseName.Contains("mysql") || courseName.Contains("postgresql"))
                    {
                        icon = "fas fa-database";
                    }
                    else if (courseName.Contains("ai") || courseName.Contains("machine") || courseName.Contains("learning"))
                    {
                        icon = "fas fa-brain";
                    }
                    
                    result.Add(new CourseRecommendationDTO
                    {
                        CourseId = course.CourseId,
                        CourseName = course.CourseName,
                        Description = $"Học về {course.CourseName}",
                        EstimatedWeeks = estimatedWeeks,
                        Rating = 4.5m + (decimal)new Random().NextDouble() * 0.5m, // Random rating từ 4.5 đến 5.0
                        Icon = icon
                    });
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy khóa học đề xuất cho sinh viên (ID: {studentId}): {ex.Message}");
                throw;
            }
        }
    }
} 