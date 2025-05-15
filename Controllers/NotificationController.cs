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
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserNotifications()
        {
            try
            {
                _logger.LogInformation("API gọi lấy danh sách thông báo của người dùng");
                
                // Lấy ID người dùng hiện tại
                int userId = GetCurrentUserId();
                
                if (userId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID người dùng hợp lệ");
                    return Unauthorized(new ApiResponse<List<NotificationDTO>>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập để xem thông báo"
                    });
                }
                
                // Gọi service để lấy thông báo
                var result = await _notificationService.GetUserNotificationsAsync(userId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy thông báo: {ex.Message}");
                return StatusCode(500, new ApiResponse<List<NotificationDTO>>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }

        [HttpPost("mark-read/{notificationId}")]
        public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
        {
            try
            {
                _logger.LogInformation($"API gọi đánh dấu thông báo ID: {notificationId} là đã đọc");
                
                // Gọi service để đánh dấu thông báo đã đọc
                var result = await _notificationService.MarkNotificationAsReadAsync(notificationId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi đánh dấu thông báo đã đọc: {ex.Message}");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu"
                });
            }
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllNotificationsAsRead()
        {
            try
            {
                _logger.LogInformation("API gọi đánh dấu tất cả thông báo là đã đọc");
                
                // Lấy ID người dùng hiện tại
                int userId = GetCurrentUserId();
                
                if (userId <= 0)
                {
                    _logger.LogWarning("Không tìm thấy ID người dùng hợp lệ");
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Bạn cần đăng nhập để thực hiện thao tác này"
                    });
                }
                
                // Gọi service để đánh dấu tất cả thông báo đã đọc
                var result = await _notificationService.MarkAllNotificationsAsReadAsync(userId);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi đánh dấu tất cả thông báo đã đọc: {ex.Message}");
                return StatusCode(500, new ApiResponse<bool>
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
                if (Request.Headers.TryGetValue("X-User-Id", out var userIdHeader))
                {
                    if (int.TryParse(userIdHeader, out int userId) && userId > 0)
                    {
                        _logger.LogInformation($"Lấy ID người dùng từ header: {userId}");
                        return userId;
                    }
                }
                
                // Nếu không có header đặc biệt, thử lấy từ claims trong token JWT
                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                    
                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                    {
                        _logger.LogInformation($"Lấy ID người dùng từ JWT claims: {userId}");
                        return userId;
                    }
                }
                
                // Không tìm thấy ID người dùng
                _logger.LogWarning("Không tìm thấy ID người dùng trong request");
                return -1; // Trả về -1 để biểu thị lỗi
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy ID người dùng: {ex.Message}");
                return -1;
            }
        }
    }
} 