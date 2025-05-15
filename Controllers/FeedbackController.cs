using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;
        private readonly ILogger<FeedbackController> _logger;

        public FeedbackController(IFeedbackService feedbackService, ILogger<FeedbackController> logger)
        {
            _feedbackService = feedbackService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] FeedbackCreateDto feedbackDto)
        {
            try
            {
                _logger.LogInformation("API gọi tạo đánh giá mới");
                
                // Kiểm tra dữ liệu đầu vào
                if (feedbackDto == null)
                {
                    return BadRequest(new ApiResponse<FeedbackHistory>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ"
                    });
                }
                
                // Lấy ID của giảng viên
                int teacherId = GetCurrentUserId();
                
                _logger.LogInformation($"TeacherId từ phương thức GetCurrentUserId: {teacherId}");
                
                if (teacherId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID giảng viên hợp lệ");
                    return Unauthorized(new ApiResponse<FeedbackHistory>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập với tư cách giảng viên để thực hiện chức năng này"
                    });
                }
                
                // Gọi service để tạo đánh giá
                var result = await _feedbackService.CreateFeedbackAsync(feedbackDto, teacherId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo đánh giá: {ex.Message}");
                return StatusCode(500, new ApiResponse<FeedbackHistory>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }

        [HttpGet("students/{courseId}")]
        public async Task<IActionResult> GetStudentsByCourse(int courseId)
        {
            try
            {
                _logger.LogInformation($"API gọi lấy danh sách sinh viên cho khóa học ID: {courseId}");
                
                var result = await _feedbackService.GetStudentsByCourseIdAsync(courseId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy danh sách sinh viên: {ex.Message}");
                return StatusCode(500, new ApiResponse<List<UserDTO>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }
        
        [HttpGet("history")]
        public async Task<IActionResult> GetFeedbackHistory(
            [FromQuery] int? subjectId = null, 
            [FromQuery] int? courseId = null, 
            [FromQuery] int? studentId = null,
            [FromQuery] string? type = null,
            [FromQuery] string? status = null)
        {
            try
            {
                _logger.LogInformation("API gọi lấy lịch sử đánh giá với các bộ lọc");
                
                // Lấy ID của giảng viên
                int teacherId = GetCurrentUserId();
                
                if (teacherId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID giảng viên hợp lệ");
                    return Unauthorized(new ApiResponse<List<FeedbackHistoryDTO>>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập với tư cách giảng viên để thực hiện chức năng này"
                    });
                }
                
                // Gọi service để lấy lịch sử đánh giá
                var result = await _feedbackService.GetFeedbackHistoryAsync(
                    teacherId, subjectId, courseId, studentId, type, status);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy lịch sử đánh giá: {ex.Message}");
                return StatusCode(500, new ApiResponse<List<FeedbackHistoryDTO>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }
        
        // Phương thức lấy userId hiện tại
        private int GetCurrentUserId()
        {
            try
            {
                // Thử lấy ID từ header đặc biệt (được gửi từ frontend)
                if (Request.Headers.TryGetValue("X-Teacher-Id", out var teacherIdHeader))
                {
                    if (int.TryParse(teacherIdHeader, out int teacherId) && teacherId > 0)
                    {
                        _logger.LogInformation($"Lấy ID giảng viên từ header: {teacherId}");
                        return teacherId;
                    }
                }
                
                // Nếu không có header đặc biệt, thử lấy từ claims trong token JWT
                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                    
                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                    {
                        _logger.LogInformation($"Lấy ID giảng viên từ JWT claims: {userId}");
                        return userId;
                    }
                }
                
                // Không tìm thấy ID người dùng
                _logger.LogWarning("Không tìm thấy ID người dùng trong request");
                return -1; // Trả về -1 để biểu thị lỗi
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy ID giảng viên: {ex.Message}");
                return -1;
            }
        }
    }
} 