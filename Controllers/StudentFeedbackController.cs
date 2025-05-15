using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/student-feedback")]
    [ApiController]
    public class StudentFeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;
        private readonly ILogger<StudentFeedbackController> _logger;
        private readonly AppDbContext _context;

        public StudentFeedbackController(IFeedbackService feedbackService, ILogger<StudentFeedbackController> logger, AppDbContext context)
        {
            _feedbackService = feedbackService;
            _logger = logger;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] StudentLectureFeedbackDto feedbackDto)
        {
            try
            {
                _logger.LogInformation("API gọi tạo đánh giá bài giảng mới từ sinh viên");
                
                // Kiểm tra dữ liệu đầu vào
                if (feedbackDto == null)
                {
                    return BadRequest(new ApiResponse<FeedbackHistory>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ"
                    });
                }
                
                // Lấy ID của sinh viên
                int studentId = GetCurrentUserId();
                
                _logger.LogInformation($"StudentId từ phương thức GetCurrentUserId: {studentId}");
                
                if (studentId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID sinh viên hợp lệ");
                    return Unauthorized(new ApiResponse<FeedbackHistory>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập để thực hiện chức năng này"
                    });
                }
                
                // Gọi service để tạo đánh giá
                var result = await _feedbackService.CreateStudentLectureFeedbackAsync(feedbackDto, studentId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo đánh giá bài giảng: {ex.Message}");
                return StatusCode(500, new ApiResponse<FeedbackHistory>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetFeedbackHistory(
            [FromQuery] int? lectureId = null,
            [FromQuery] int? courseId = null)
        {
            try
            {
                _logger.LogInformation("API gọi lấy lịch sử đánh giá bài giảng của sinh viên");
                
                // Lấy ID của sinh viên
                int studentId = GetCurrentUserId();
                
                if (studentId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID sinh viên hợp lệ");
                    return Unauthorized(new ApiResponse<List<FeedbackHistoryDTO>>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập để xem lịch sử đánh giá"
                    });
                }
                
                // Gọi service để lấy lịch sử đánh giá
                var result = await _feedbackService.GetStudentFeedbackHistoryAsync(
                    studentId, lectureId, courseId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy lịch sử đánh giá bài giảng: {ex.Message}");
                return StatusCode(500, new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }
        
        [HttpGet("completed-lectures")]
        public async Task<IActionResult> GetCompletedLectures([FromQuery] int? courseId = null)
        {
            try
            {
                _logger.LogInformation("API gọi lấy danh sách bài giảng đã hoàn thành của sinh viên");
                
                // Lấy ID của sinh viên - Sử dụng ID sinh viên từ localStorage nếu không có xác thực
                int studentId = GetCurrentUserId();
                
                // Kiểm tra ID có hợp lệ không
                if (studentId <= 0)
                {
                    // Thử lấy ID từ query string nếu không có trong xác thực
                    if (Request.Query.TryGetValue("studentId", out var studentIdParam) && 
                        int.TryParse(studentIdParam, out int studentIdFromQuery) && 
                        studentIdFromQuery > 0)
                    {
                        studentId = studentIdFromQuery;
                        _logger.LogInformation($"Sử dụng studentId từ query string: {studentId}");
                    }
                    else
                    {
                        // Trả về lỗi thay vì sử dụng giá trị mặc định
                        _logger.LogWarning("Không tìm thấy ID sinh viên hợp lệ");
                        return BadRequest(new ApiResponse<List<CompletedLectureDto>>
                        {
                            Success = false,
                            Message = "Không tìm thấy ID sinh viên hợp lệ"
                        });
                    }
                }
                
                // Ghi log ID sinh viên
                _logger.LogInformation($"Lấy bài giảng đã hoàn thành cho sinh viên ID: {studentId}");
                
                try
                {
                    // Kiểm tra xem sinh viên có tồn tại không
                    var studentExists = await _context.Users.AnyAsync(u => u.UserId == studentId);
                    if (!studentExists)
                    {
                        _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                        return NotFound(new ApiResponse<List<CompletedLectureDto>>
                        {
                            Success = false,
                            Message = $"Không tìm thấy sinh viên với ID: {studentId}"
                        });
                    }

                    // Lấy danh sách bài giảng đã hoàn thành
                    var query = from tracking in _context.StudyTrackings
                               where tracking.UserId == studentId && 
                                     tracking.Status == "hoanthanh"
                               join lecture in _context.Lectures
                                   on tracking.LectureId equals lecture.LectureId
                               join course in _context.Courses
                                   on lecture.CourseId equals course.CourseId
                               join teacher in _context.Users
                                   on lecture.TeacherId equals teacher.UserId
                               where courseId == null || lecture.CourseId == courseId.Value
                               select new 
                               {
                                   LectureId = lecture.LectureId,
                                   Title = lecture.Title,
                                   CourseId = course.CourseId,
                                   CourseName = course.CourseName,
                                   TeacherName = teacher.FullName,
                                   CompletionDate = tracking.EndDate
                               };
                    
                    // Thực hiện truy vấn và chuyển đổi dữ liệu
                    var completedLectureData = await query.ToListAsync();
                    
                    // Lấy tất cả feedback từ sinh viên này
                    var feedbacks = await _context.FeedbackHistories
                        .Where(f => f.UserId == studentId)
                        .ToListAsync();
                    
                    // Tạo danh sách DTO hoàn chỉnh với phần xử lý HasFeedback ở phía client
                    var completedLectures = completedLectureData.Select(l => new CompletedLectureDto {
                        LectureId = l.LectureId,
                        Title = l.Title,
                        CourseId = l.CourseId,
                        CourseName = l.CourseName,
                        TeacherName = l.TeacherName,
                        CompletionDate = l.CompletionDate,
                        HasFeedback = feedbacks.Any(f => f.Content.Contains($"Đánh giá bài giảng {l.LectureId}:"))
                    }).ToList();
                    
                    _logger.LogInformation($"Tìm thấy {completedLectures.Count} bài giảng đã hoàn thành cho sinh viên ID: {studentId}");
                    
                    return Ok(new ApiResponse<List<CompletedLectureDto>>
                    {
                        Success = true,
                        Data = completedLectures,
                        Message = completedLectures.Any() ? null : "Bạn chưa hoàn thành bài giảng nào"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Lỗi khi truy vấn bài giảng đã hoàn thành: {ex.Message}");
                    throw; // Ném lại ngoại lệ để xử lý ở catch bên ngoài
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy danh sách bài giảng đã hoàn thành: {ex.Message}");
                return StatusCode(500, new ApiResponse<List<CompletedLectureDto>>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi khi xử lý yêu cầu: {ex.Message}"
                });
            }
        }
        
        // Phương thức lấy userId hiện tại
        private int GetCurrentUserId()
        {
            try
            {
                // Thử lấy ID từ header đặc biệt (được gửi từ frontend)
                if (Request.Headers.TryGetValue("X-Student-Id", out var studentIdHeader))
                {
                    if (int.TryParse(studentIdHeader, out int studentId) && studentId > 0)
                    {
                        _logger.LogInformation($"Lấy ID sinh viên từ header: {studentId}");
                        return studentId;
                    }
                }
                
                // Thử lấy ID từ localStorage được gửi trong custom header
                if (Request.Headers.TryGetValue("Authorization", out var authHeader) && 
                    authHeader.ToString().StartsWith("Bearer "))
                {
                    // Token được gửi, nhưng có thể chưa được xác thực đúng
                    _logger.LogInformation("Token có trong request nhưng không lấy được userId từ claims");
                }
                
                // Nếu không có header đặc biệt, thử lấy từ claims trong token JWT
                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                    
                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                    {
                        _logger.LogInformation($"Lấy ID sinh viên từ JWT claims: {userId}");
                        return userId;
                    }
                }
                
                // Không tìm thấy ID người dùng
                _logger.LogWarning("Không tìm thấy ID người dùng trong request");
                return -1; // Trả về -1 để biểu thị lỗi
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy ID sinh viên: {ex.Message}");
                return -1;
            }
        }
    }
    
    // DTO cho bài giảng đã hoàn thành
    public class CompletedLectureDto
    {
        public int LectureId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
        public bool HasFeedback { get; set; }
    }
} 