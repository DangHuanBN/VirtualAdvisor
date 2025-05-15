using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using System.IO;

namespace VirtualAdvisorAPI.Services
{
    public class CourseStudentService : ICourseStudentService
    {
        private readonly AppDbContext _dbContext;

        public CourseStudentService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse<List<AvailableCourseDto>>> GetAvailableCoursesAsync(int studentId)
        {
            try
            {
                // Lấy danh sách ID khóa học mà sinh viên đã đăng ký
                var enrolledCourseIds = await _dbContext.StudentEnrollments
                    .Where(se => se.UserId == studentId)
                    .Select(se => se.CourseId)
                    .ToListAsync();

                // Lấy danh sách khóa học mà sinh viên chưa đăng ký
                var availableCourses = await _dbContext.Courses
                    .Where(c => !enrolledCourseIds.Contains(c.CourseId))
                    .Include(c => c.Subject)
                    .Include(c => c.Lectures)
                    .Select(c => new AvailableCourseDto
                    {
                        CourseId = c.CourseId,
                        CourseName = c.CourseName,
                        SubjectId = c.SubjectId,
                        SubjectName = c.Subject != null ? c.Subject.SubjectName : string.Empty,
                        Type = c.Type,
                        LectureCount = c.Lectures.Count,
                        StudentCount = _dbContext.StudentEnrollments.Count(se => se.CourseId == c.CourseId)
                    })
                    .ToListAsync();

                return new ApiResponse<List<AvailableCourseDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách khóa học khả dụng thành công",
                    Data = availableCourses
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<AvailableCourseDto>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách khóa học khả dụng: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> RegisterCourseAsync(CourseStudentRegisterModel model)
        {
            try
            {
                // Kiểm tra sinh viên có tồn tại không
                var student = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.UserId == model.UserId);
                
                if (student == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy sinh viên",
                        Data = false
                    };
                }

                // Kiểm tra khóa học có tồn tại không
                var course = await _dbContext.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == model.CourseId);

                if (course == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học",
                        Data = false
                    };
                }

                // Kiểm tra sinh viên đã đăng ký khóa học này chưa
                var existingEnrollment = await _dbContext.StudentEnrollments
                    .FirstOrDefaultAsync(se => se.UserId == model.UserId && se.CourseId == model.CourseId);

                if (existingEnrollment != null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sinh viên đã đăng ký khóa học này",
                        Data = false
                    };
                }

                // Tạo bản ghi mới trong StudentEnrollment
                var enrollment = new StudentEnrollment
                {
                    UserId = model.UserId,
                    CourseId = model.CourseId
                };

                await _dbContext.StudentEnrollments.AddAsync(enrollment);
                await _dbContext.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Đăng ký khóa học thành công",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Lỗi khi đăng ký khóa học: {ex.Message}",
                    Data = false
                };
            }
        }

        public async Task<ApiResponse<List<AvailableCourseDto>>> GetEnrolledCoursesAsync(int studentId)
        {
            try
            {
                // Lấy danh sách khóa học mà sinh viên đã đăng ký
                var enrolledCourses = await _dbContext.StudentEnrollments
                    .Where(se => se.UserId == studentId)
                    .Include(se => se.Course)
                    .ThenInclude(c => c.Subject)
                    .Include(se => se.Course)
                    .ThenInclude(c => c.Lectures)
                    .Select(se => new AvailableCourseDto
                    {
                        CourseId = se.Course.CourseId,
                        CourseName = se.Course.CourseName,
                        SubjectId = se.Course.SubjectId,
                        SubjectName = se.Course.Subject != null ? se.Course.Subject.SubjectName : string.Empty,
                        Type = se.Course.Type,
                        LectureCount = se.Course.Lectures.Count,
                        StudentCount = _dbContext.StudentEnrollments.Count(s => s.CourseId == se.CourseId)
                    })
                    .ToListAsync();

                return new ApiResponse<List<AvailableCourseDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách khóa học đã đăng ký thành công",
                    Data = enrolledCourses
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<AvailableCourseDto>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách khóa học đã đăng ký: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một khóa học theo ID
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Thông tin khóa học</returns>
        public async Task<ApiResponse<CourseDto>> GetCourseByIdAsync(int courseId)
        {
            try
            {
                var course = await _dbContext.Courses
                    .Include(c => c.Subject)
                    .Include(c => c.Lectures)
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null)
                {
                    return new ApiResponse<CourseDto>
                    {
                        Success = false,
                        Message = $"Không tìm thấy khóa học có ID={courseId}",
                        Data = null
                    };
                }

                var courseDto = new CourseDto
                {
                    CourseId = course.CourseId,
                    CourseName = course.CourseName,
                    Description = "Khóa học " + course.CourseName,
                    Type = course.Type,
                    SubjectId = course.SubjectId,
                    SubjectName = course.Subject?.SubjectName,
                    LectureCount = course.Lectures.Count,
                    StudentCount = _dbContext.StudentEnrollments.Count(se => se.CourseId == courseId)
                };

                return new ApiResponse<CourseDto>
                {
                    Success = true,
                    Message = "Lấy thông tin khóa học thành công",
                    Data = courseDto
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CourseDto>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy thông tin khóa học: {ex.Message}",
                    Data = null
                };
            }
        }

        /// <summary>
        /// Lấy danh sách bài giảng của một khóa học
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Danh sách bài giảng</returns>
        public async Task<ApiResponse<List<LectureDto>>> GetLecturesByCourseIdAsync(int courseId)
        {
            try
            {
                // Kiểm tra khóa học có tồn tại
                var course = await _dbContext.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null)
                {
                    return new ApiResponse<List<LectureDto>>
                    {
                        Success = false,
                        Message = $"Không tìm thấy khóa học có ID={courseId}",
                        Data = null
                    };
                }

                System.Console.WriteLine($"DEBUG: Truy vấn bài giảng cho khóa học {courseId} - Tên bảng: {nameof(_dbContext.Lectures)}");
                
                // Lấy danh sách bài giảng - sử dụng cả hai cách để debug
                var lectures = new List<LectureDto>();
                
                try {
                    // Cách 1: Sửa lại truy vấn EF để không sinh ra lỗi SQL
                    lectures = await _dbContext.Lectures
                        .Where(l => l.CourseId == courseId)
                        .OrderBy(l => l.LectureId)
                        .Select(l => new LectureDto
                        {
                            LectureId = l.LectureId,
                            LectureName = l.Title,
                            Description = l.Content,
                            LectureOrder = l.LectureId,
                            // Không sử dụng các biểu thức phức tạp trong truy vấn LINQ to SQL
                            FilePath = l.Attachment,
                            FileType = string.Empty, // Sẽ được cập nhật sau
                            Type = l.Type, // Lưu trực tiếp type từ CSDL
                            Duration = l.MaxHours.HasValue ? (int)(l.MaxHours.Value * 3600) : 3600,
                            CourseId = l.CourseId,
                            CourseName = course.CourseName
                        })
                        .ToListAsync();
                        
                    // Sau khi truy vấn, xử lý các trường dữ liệu phức tạp ở phía client
                    for (int i = 0; i < lectures.Count; i++)
                    {
                        var lecture = lectures[i];
                        if (!string.IsNullOrEmpty(lecture.FilePath))
                        {
                            lecture.FilePath = $"/api/FileConverter/serve?filePath={lecture.FilePath.Replace("\\", "/")}";
                        }
                        
                        // Thiết lập FileType dựa trên phần mở rộng của tệp
                        lecture.FileType = GetFileTypeFromAttachment(lecture.FilePath);
                        
                        // Log chi tiết về loại bài học
                        System.Console.WriteLine($"DEBUG: Bài giảng ID={lecture.LectureId}, Type={lecture.Type}, MimeType={lecture.FileType}");
                    }
                    
                    if (lectures.Count > 0) {
                        System.Console.WriteLine($"DEBUG: Tìm thấy {lectures.Count} bài giảng từ EF standard");
                        
                        // Log chi tiết từng bài giảng và đường dẫn tệp
                        foreach (var lecture in lectures) {
                            System.Console.WriteLine($"DEBUG: Bài giảng ID={lecture.LectureId}, Tên={lecture.LectureName}, FileName={lecture.FilePath}");
                            
                            // Kiểm tra tệp tồn tại
                            string fullPath = System.IO.Path.Combine(
                                Directory.GetCurrentDirectory(),
                                "AI_Training",
                                "uploads",
                                System.IO.Path.GetFileName(lecture.FilePath.Replace("/AI_Training/uploads/", "")));
                                
                            bool fileExists = System.IO.File.Exists(fullPath);
                            System.Console.WriteLine($"DEBUG: Đường dẫn đầy đủ={fullPath}, Tệp tồn tại={fileExists}");
                        }
                    } else {
                        System.Console.WriteLine("DEBUG: Không tìm thấy bài giảng nào từ EF standard");
                    }
                } catch (Exception ex) {
                    System.Console.WriteLine($"DEBUG: Lỗi truy vấn EF standard: {ex.Message}");
                }
                
                if (lectures.Count == 0)
                {
                    // Cách 2: Thử truy vấn trực tiếp SQL
                    try {
                        var lectureIds = await GetLectureIdsDirectlyAsync(courseId);
                        System.Console.WriteLine($"DEBUG: Tìm thấy {lectureIds.Count} bài giảng từ truy vấn SQL trực tiếp");
                        
                        // Tạo các bài giảng từ IDs tìm được
                        foreach (var id in lectureIds)
                        {
                            var lecture = await _dbContext.Lectures.FindAsync(id);
                            if (lecture != null)
                            {
                                lectures.Add(new LectureDto
                                {
                                    LectureId = lecture.LectureId,
                                    LectureName = lecture.Title,
                                    Description = lecture.Content,
                                    LectureOrder = lecture.LectureId,
                                    FilePath = string.IsNullOrEmpty(lecture.Attachment) ? "" : $"/api/FileConverter/serve?filePath={lecture.Attachment.Replace("\\", "/")}",
                                    FileType = GetFileTypeFromAttachment(lecture.Attachment),
                                    Type = lecture.Type,
                                    Duration = lecture.MaxHours.HasValue ? (int)(lecture.MaxHours.Value * 3600) : 3600,
                                    CourseId = lecture.CourseId,
                                    CourseName = course.CourseName
                                });
                            }
                        }
                    } catch (Exception ex) {
                        System.Console.WriteLine($"DEBUG: Lỗi truy vấn SQL trực tiếp: {ex.Message}");
                    }
                }

                // Thêm vào một hàm debug ở phía sau khi tạo DTO để kiểm tra dữ liệu
                // Đặt hàm này ngay trước khi return new ApiResponse<...>
                DebugLectures(lectures);

                return new ApiResponse<List<LectureDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách bài giảng thành công",
                    Data = lectures
                };
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Lỗi trong GetLecturesByCourseIdAsync: {ex.Message}");
                System.Console.WriteLine($"StackTrace: {ex.StackTrace}");
                
                return new ApiResponse<List<LectureDto>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách bài giảng: {ex.Message}",
                    Data = null
                };
            }
        }
        
        // Phương thức phụ trợ để lấy IDs của bài giảng
        private async Task<List<int>> GetLectureIdsDirectlyAsync(int courseId)
        {
            string sql = $"SELECT lecture_id FROM Lecture WHERE course_id = {courseId}";
            var connection = _dbContext.Database.GetDbConnection();
            
            try
            {
                await connection.OpenAsync();
                using var command = connection.CreateCommand();
                command.CommandText = sql;
                
                using var result = await command.ExecuteReaderAsync();
                var ids = new List<int>();
                
                while (await result.ReadAsync())
                {
                    ids.Add(result.GetInt32(0));
                }
                
                return ids;
            }
            finally
            {
                if (connection.State == System.Data.ConnectionState.Open)
                {
                    await connection.CloseAsync();
                }
            }
        }

        // Hàm phụ trợ để xác định loại file từ tên file
        private static string GetFileTypeFromAttachment(string attachment)
        {
            if (string.IsNullOrEmpty(attachment))
                return "other";
                
            string extension = System.IO.Path.GetExtension(attachment).ToLower();
            
            if (extension == ".pdf")
                return "application/pdf";
            else if (extension == ".doc" || extension == ".docx")
                return "application/msword";
            else if (extension == ".ppt" || extension == ".pptx")
                return "application/vnd.ms-powerpoint";
            else if (extension == ".xls" || extension == ".xlsx")
                return "application/vnd.ms-excel";
            else if (extension == ".jpg" || extension == ".jpeg" || extension == ".png" || extension == ".gif")
                return "image/" + extension.Substring(1);
            else if (extension == ".mp4" || extension == ".mov" || extension == ".avi")
                return "video/" + extension.Substring(1);
            else if (extension == ".mp3" || extension == ".wav")
                return "audio/" + extension.Substring(1);
            else
                return "application/octet-stream";
        }
        
        /// <summary>
        /// Truy vấn trực tiếp số lượng bài giảng của một khóa học
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Số lượng bài giảng</returns>
        public async Task<int> GetLectureCountDirectlyAsync(int courseId)
        {
            // Log để debug
            System.Console.WriteLine($"Truy vấn trực tiếp số lượng bài giảng cho courseId={courseId}");
            
            try
            {
                // Truy vấn không sử dụng Include để tránh các vấn đề liên quan đến mapping
                var count = await _dbContext.Lectures.CountAsync(l => l.CourseId == courseId);
                
                // Truy vấn danh sách ID của các bài giảng để debug
                var lectureIds = await _dbContext.Lectures
                    .Where(l => l.CourseId == courseId)
                    .Select(l => l.LectureId)
                    .ToListAsync();
                    
                // Log danh sách IDs để debug
                if (lectureIds.Any())
                {
                    System.Console.WriteLine($"Các bài giảng tìm thấy: {string.Join(", ", lectureIds)}");
                }
                else
                {
                    System.Console.WriteLine("Không tìm thấy bài giảng nào");
                }
                
                return count;
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Lỗi khi truy vấn trực tiếp: {ex.Message}");
                throw;
            }
        }

        // Thêm vào một hàm debug ở phía sau khi tạo DTO để kiểm tra dữ liệu
        // Đặt hàm này ngay trước khi return new ApiResponse<...>
        private void DebugLectures(List<LectureDto> lectures)
        {
            if (lectures == null || lectures.Count == 0)
            {
                System.Console.WriteLine("DEBUG: Không có bài giảng nào để gửi về client");
                return;
            }

            System.Console.WriteLine($"DEBUG: Gửi về client {lectures.Count} bài giảng");
            foreach (var lecture in lectures)
            {
                System.Console.WriteLine($"DEBUG: Bài giảng: ID={lecture.LectureId}, Tên={lecture.LectureName}, " +
                                      $"Type={lecture.Type}, FileType={lecture.FileType}");
            }
        }

        /// <summary>
        /// Hủy đăng ký khóa học cho sinh viên
        /// </summary>
        /// <param name="model">Thông tin hủy đăng ký khóa học</param>
        /// <returns>Kết quả hủy đăng ký</returns>
        public async Task<ApiResponse<bool>> UnregisterCourseAsync(CourseStudentRegisterModel model)
        {
            try
            {
                // Kiểm tra sinh viên có tồn tại không
                var student = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.UserId == model.UserId);
                
                if (student == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy sinh viên",
                        Data = false
                    };
                }

                // Kiểm tra khóa học có tồn tại không
                var course = await _dbContext.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == model.CourseId);

                if (course == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học",
                        Data = false
                    };
                }

                // Kiểm tra sinh viên đã đăng ký khóa học này chưa
                var enrollment = await _dbContext.StudentEnrollments
                    .FirstOrDefaultAsync(se => se.UserId == model.UserId && se.CourseId == model.CourseId);

                if (enrollment == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Sinh viên chưa đăng ký khóa học này",
                        Data = false
                    };
                }

                // Xóa tất cả các dữ liệu theo dõi học tập của sinh viên cho khóa học này
                var studyTrackings = await _dbContext.StudyTrackings
                    .Where(st => st.UserId == model.UserId && st.Lecture.CourseId == model.CourseId)
                    .ToListAsync();
                
                if (studyTrackings.Any())
                {
                    _dbContext.StudyTrackings.RemoveRange(studyTrackings);
                }

                // Xóa bản ghi đăng ký khóa học
                _dbContext.StudentEnrollments.Remove(enrollment);
                await _dbContext.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Hủy đăng ký khóa học thành công",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Lỗi khi hủy đăng ký khóa học: {ex.Message}",
                    Data = false
                };
            }
        }
    }
} 