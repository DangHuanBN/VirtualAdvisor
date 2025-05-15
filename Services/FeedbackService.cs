using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<FeedbackService> _logger;
        private readonly INotificationService _notificationService;

        public FeedbackService(AppDbContext context, ILogger<FeedbackService> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<ApiResponse<FeedbackHistory>> CreateFeedbackAsync(FeedbackCreateDto feedbackDto, int teacherId)
        {
            try
            {
                _logger.LogInformation($"Đang tạo đánh giá từ giảng viên ID: {teacherId} cho sinh viên ID: {feedbackDto.StudentId}");
                _logger.LogInformation($"Thông tin chi tiết đánh giá - StudentId: {feedbackDto.StudentId}, CourseId: {feedbackDto.CourseId}, SubjectId: {feedbackDto.SubjectId}, SoSao: {feedbackDto.SoSao}");
                
                // Kiểm tra vai trò giảng viên
                var teacher = await _context.Users.FirstOrDefaultAsync(u => u.UserId == teacherId);
                if (teacher == null)
                {
                    _logger.LogWarning($"Không tìm thấy giảng viên với ID: {teacherId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Chỉ giảng viên mới có quyền đánh giá sinh viên" 
                    };
                }
                
                // Kiểm tra sinh viên có tồn tại
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == feedbackDto.StudentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {feedbackDto.StudentId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Không tìm thấy sinh viên" 
                    };
                }
                
                // Kiểm tra xem khóa học có thuộc môn học không
                var course = await _context.Courses.FirstOrDefaultAsync(c => 
                    c.CourseId == feedbackDto.CourseId && c.SubjectId == feedbackDto.SubjectId);
                if (course == null)
                {
                    _logger.LogWarning($"Khóa học ID: {feedbackDto.CourseId} không thuộc môn học ID: {feedbackDto.SubjectId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Khóa học không thuộc môn học này" 
                    };
                }
                
                // Kiểm tra sinh viên có đăng ký khóa học không
                var enrollment = await _context.StudentEnrollments.FirstOrDefaultAsync(e => 
                    e.UserId == feedbackDto.StudentId && e.CourseId == feedbackDto.CourseId);
                if (enrollment == null)
                {
                    _logger.LogWarning($"Sinh viên ID: {feedbackDto.StudentId} không đăng ký khóa học ID: {feedbackDto.CourseId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Sinh viên không đăng ký khóa học này" 
                    };
                }
                
                // Kiểm tra nội dung
                if (string.IsNullOrWhiteSpace(feedbackDto.NoiDung))
                {
                    _logger.LogWarning("Nội dung đánh giá trống");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Nội dung đánh giá không được để trống" 
                    };
                }
                
                // Tính điểm dựa trên số sao
                decimal diem = feedbackDto.SoSao * 2;
                
                // Tạo nội dung đánh giá
                string content = $"Đánh giá sinh viên [{feedbackDto.StudentId}]: {feedbackDto.NoiDung}";
                
                // Tạo feedback mới
                var feedback = new FeedbackHistory
                {
                    UserId = teacherId,
                    Content = content,
                    Timestamp = DateTime.Now.Date,
                    Diem = diem
                };
                
                _logger.LogInformation($"Chuẩn bị lưu feedback vào DB - UserId: {feedback.UserId}, TeacherId: {teacherId}");
                
                // Thêm vào database
                _context.FeedbackHistories.Add(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã tạo đánh giá thành công, ID: {feedback.FeedbackId}, UserId (sinh viên): {feedback.UserId}");
                
                // Tạo thông báo cho sinh viên
                await _notificationService.CreateEvaluationNotificationAsync(
                    feedbackDto.StudentId, 
                    teacherId, 
                    feedbackDto.NoiDung);
                
                return new ApiResponse<FeedbackHistory>
                {
                    Success = true,
                    Message = "Đánh giá sinh viên thành công",
                    Data = feedback
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo đánh giá: {ex.Message}");
                return new ApiResponse<FeedbackHistory>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<List<UserDTO>>> GetStudentsByCourseIdAsync(int courseId)
        {
            try
            {
                _logger.LogInformation($"Đang lấy danh sách sinh viên cho khóa học ID: {courseId}");
                
                // Kiểm tra xem khóa học có tồn tại không
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    _logger.LogWarning($"Không tìm thấy khóa học với ID: {courseId}");
                    return new ApiResponse<List<UserDTO>>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học"
                    };
                }
                
                // Lấy danh sách sinh viên đã đăng ký khóa học
                var students = await _context.StudentEnrollments
                    .Where(e => e.CourseId == courseId)
                    .Join(
                        _context.Users,
                        enrollment => enrollment.UserId,
                        user => user.UserId,
                        (enrollment, user) => new UserDTO
                        {
                            Id = user.UserId,
                            FullName = user.FullName,
                            Role = user.Role
                        })
                    .ToListAsync();
                
                _logger.LogInformation($"Đã tìm thấy {students.Count} sinh viên cho khóa học ID: {courseId}");
                
                return new ApiResponse<List<UserDTO>>
                {
                    Success = true,
                    Data = students
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy danh sách sinh viên: {ex.Message}");
                return new ApiResponse<List<UserDTO>>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<List<FeedbackHistoryDTO>>> GetFeedbackHistoryAsync(
            int teacherId, 
            int? subjectId = null, 
            int? courseId = null, 
            int? studentId = null,
            string? type = null,
            string? status = null)
        {
            try
            {
                _logger.LogInformation($"Đang lấy lịch sử đánh giá từ giảng viên ID: {teacherId}");
                
                // Kiểm tra vai trò giảng viên
                var teacher = await _context.Users.FirstOrDefaultAsync(u => u.UserId == teacherId);
                if (teacher == null)
                {
                    _logger.LogWarning($"Không tìm thấy giảng viên với ID: {teacherId}");
                    return new ApiResponse<List<FeedbackHistoryDTO>> 
                    { 
                        Success = false, 
                        Message = "Chỉ giảng viên mới có quyền xem lịch sử đánh giá" 
                    };
                }
                
                // Truy vấn cơ bản
                var query = from feedback in _context.FeedbackHistories
                            join student in _context.Users
                                on feedback.UserId equals student.UserId
                            join enrollment in _context.StudentEnrollments
                                on new { UserId = student.UserId, CourseId = courseId ?? 0 } 
                                equals new { UserId = enrollment.UserId, CourseId = enrollment.CourseId }
                                into enrollments
                            from enrollment in enrollments.DefaultIfEmpty()
                            join course in _context.Courses
                                on enrollment != null ? enrollment.CourseId : 0 equals course.CourseId
                                into courses
                            from course in courses.DefaultIfEmpty()
                            join subject in _context.Subjects
                                on course != null ? course.SubjectId : 0 equals subject.SubjectId
                                into subjects
                            from subject in subjects.DefaultIfEmpty()
                            select new FeedbackHistoryDTO
                            {
                                FeedbackId = feedback.FeedbackId,
                                StudentId = student.UserId,
                                StudentName = student.FullName,
                                CourseId = course != null ? course.CourseId : 0,
                                CourseName = course != null ? course.CourseName : "N/A",
                                SubjectId = subject != null ? subject.SubjectId : 0,
                                SubjectName = subject != null ? subject.SubjectName : "N/A",
                                Content = feedback.Content,
                                Diem = feedback.Diem,
                                Timestamp = feedback.Timestamp,
                                // Các trường bổ sung có thể null trong database
                                Type = "Đánh giá chung", // Mặc định
                                Progress = null, // Có thể tính toán từ dữ liệu khác
                                Status = feedback.Diem >= 5 // Giả sử điểm từ 5 trở lên là hoàn thành
                            };
                
                // Áp dụng các bộ lọc
                if (subjectId.HasValue && subjectId > 0)
                {
                    query = query.Where(f => f.SubjectId == subjectId.Value);
                }
                
                if (courseId.HasValue && courseId > 0)
                {
                    query = query.Where(f => f.CourseId == courseId.Value);
                }
                
                if (studentId.HasValue && studentId > 0)
                {
                    query = query.Where(f => f.StudentId == studentId.Value);
                }
                
                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(f => f.Type == type);
                }
                
                if (!string.IsNullOrEmpty(status))
                {
                    bool isCompleted = status.ToLower() == "hoanthanh";
                    query = query.Where(f => f.Status == isCompleted);
                }
                
                // Thực hiện truy vấn và lấy kết quả
                var result = await query.ToListAsync();
                
                _logger.LogInformation($"Đã tìm thấy {result.Count} bản ghi đánh giá");
                
                return new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = true,
                    Data = result
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy lịch sử đánh giá: {ex.Message}");
                return new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
        
        // Phương thức tạo feedback cho bài giảng của sinh viên
        public async Task<ApiResponse<FeedbackHistory>> CreateStudentLectureFeedbackAsync(StudentLectureFeedbackDto feedbackDto, int studentId)
        {
            try
            {
                _logger.LogInformation($"Đang tạo đánh giá bài giảng từ sinh viên ID: {studentId} cho bài giảng ID: {feedbackDto.LectureId}");
                
                // Kiểm tra sinh viên có tồn tại
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == studentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Không tìm thấy thông tin sinh viên" 
                    };
                }
                
                // Kiểm tra bài giảng có tồn tại
                var lecture = await _context.Lectures.Include(l => l.Course)
                    .FirstOrDefaultAsync(l => l.LectureId == feedbackDto.LectureId);
                if (lecture == null)
                {
                    _logger.LogWarning($"Không tìm thấy bài giảng với ID: {feedbackDto.LectureId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Không tìm thấy bài giảng" 
                    };
                }
                
                // Kiểm tra sinh viên có đăng ký khóa học không
                var enrollment = await _context.StudentEnrollments.FirstOrDefaultAsync(e => 
                    e.UserId == studentId && e.CourseId == lecture.CourseId);
                if (enrollment == null)
                {
                    _logger.LogWarning($"Sinh viên ID: {studentId} không đăng ký khóa học ID: {lecture.CourseId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Bạn chưa đăng ký khóa học này" 
                    };
                }
                
                // Kiểm tra sinh viên đã hoàn thành bài giảng chưa
                var tracking = await _context.StudyTrackings.FirstOrDefaultAsync(t => 
                    t.UserId == studentId && t.LectureId == feedbackDto.LectureId);
                if (tracking == null || tracking.Status != "hoanthanh")
                {
                    _logger.LogWarning($"Sinh viên ID: {studentId} chưa hoàn thành bài giảng ID: {feedbackDto.LectureId}");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Bạn cần hoàn thành bài giảng trước khi đánh giá" 
                    };
                }
                
                // Kiểm tra nội dung
                if (string.IsNullOrWhiteSpace(feedbackDto.NoiDung))
                {
                    _logger.LogWarning("Nội dung đánh giá trống");
                    return new ApiResponse<FeedbackHistory> 
                    { 
                        Success = false, 
                        Message = "Nội dung đánh giá không được để trống" 
                    };
                }
                
                // Tính điểm dựa trên số sao
                decimal diem = feedbackDto.SoSao * 2;
                
                // Tạo nội dung đánh giá theo format yêu cầu
                string content = $"Đánh giá bài giảng {feedbackDto.LectureId}: {feedbackDto.NoiDung}";
                
                // Tạo feedback mới
                var feedback = new FeedbackHistory
                {
                    UserId = studentId,
                    Content = content,
                    Timestamp = DateTime.Now,
                    Diem = diem
                };
                
                // Thêm vào database
                _context.FeedbackHistories.Add(feedback);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã tạo đánh giá bài giảng thành công, ID: {feedback.FeedbackId}");
                
                return new ApiResponse<FeedbackHistory>
                {
                    Success = true,
                    Message = "Đánh giá bài giảng thành công",
                    Data = feedback
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo đánh giá bài giảng: {ex.Message}");
                return new ApiResponse<FeedbackHistory>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
        
        // Phương thức lấy lịch sử feedback của sinh viên
        public async Task<ApiResponse<List<FeedbackHistoryDTO>>> GetStudentFeedbackHistoryAsync(
            int studentId,
            int? lectureId = null,
            int? courseId = null)
        {
            try
            {
                _logger.LogInformation($"Đang lấy lịch sử đánh giá từ sinh viên ID: {studentId}");
                
                // Kiểm tra sinh viên có tồn tại
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == studentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                    return new ApiResponse<List<FeedbackHistoryDTO>> 
                    { 
                        Success = false, 
                        Message = "Không tìm thấy thông tin sinh viên" 
                    };
                }
                
                // Lấy trực tiếp từ bảng FeedbackHistories để tránh trùng lặp
                var query = _context.FeedbackHistories
                    .Where(f => f.UserId == studentId && f.Content.StartsWith("Đánh giá bài giảng"))
                    .Select(f => new
                    {
                        FeedbackId = f.FeedbackId,
                        Content = f.Content,
                        Diem = f.Diem,
                        Timestamp = f.Timestamp
                    })
                    .Distinct();
                
                var feedbackData = await query.ToListAsync();
                
                // Phân tích ID bài giảng từ nội dung và lấy thông tin bổ sung
                var result = new List<FeedbackHistoryDTO>();
                
                foreach (var item in feedbackData)
                {
                    // Trích xuất ID bài giảng từ nội dung
                    var lectureIdMatch = System.Text.RegularExpressions.Regex.Match(item.Content, @"Đánh giá bài giảng (\d+):");
                    if (!lectureIdMatch.Success)
                        continue;
                        
                    var extractedLectureId = int.Parse(lectureIdMatch.Groups[1].Value);
                    
                    // Nếu đang lọc theo lectureId và không khớp với bài giảng cần tìm
                    if (lectureId.HasValue && lectureId.Value > 0 && extractedLectureId != lectureId.Value)
                        continue;
                        
                    // Lấy thông tin bài giảng và khóa học
                    var lecture = await _context.Lectures
                        .Include(l => l.Course)
                        .FirstOrDefaultAsync(l => l.LectureId == extractedLectureId);
                        
                    // Nếu không tìm thấy bài giảng hoặc đang lọc theo courseId và không khớp
                    if (lecture == null || (courseId.HasValue && courseId.Value > 0 && lecture.CourseId != courseId.Value))
                        continue;
                        
                    result.Add(new FeedbackHistoryDTO
                    {
                        FeedbackId = item.FeedbackId,
                        StudentId = studentId,
                        StudentName = student.FullName,
                        CourseId = lecture.CourseId,
                        CourseName = lecture.Course?.CourseName ?? "N/A",
                        SubjectId = lecture.Course?.SubjectId ?? 0,
                        Content = item.Content,
                        Diem = item.Diem,
                        Timestamp = item.Timestamp,
                        Type = "Đánh giá bài giảng"
                    });
                }
                
                _logger.LogInformation($"Đã tìm thấy {result.Count} bản ghi đánh giá bài giảng");
                
                return new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = true,
                    Data = result
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy lịch sử đánh giá bài giảng: {ex.Message}");
                return new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
    }
} 