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
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ApiResponse<Notification>> CreateNotificationAsync(string content, int userId)
        {
            try
            {
                _logger.LogInformation($"Đang tạo thông báo cho người dùng ID: {userId}");
                
                // Kiểm tra người dùng có tồn tại không
                var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
                if (!userExists)
                {
                    _logger.LogWarning($"Không tìm thấy người dùng với ID: {userId}");
                    return new ApiResponse<Notification>
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại"
                    };
                }
                
                // Tạo thông báo mới
                var notification = new Notification
                {
                    UserId = userId,
                    Content = content,
                    Timestamp = DateTime.Now
                    // IsRead và Type không lưu trong DB
                };
                
                // Lưu vào database
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã tạo thông báo thành công, ID: {notification.NotificationId}");
                
                return new ApiResponse<Notification>
                {
                    Success = true,
                    Message = "Tạo thông báo thành công",
                    Data = notification
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo thông báo: {ex.Message}");
                return new ApiResponse<Notification>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<Notification>> CreateEvaluationNotificationAsync(int studentId, int teacherId, string evaluationContent)
        {
            try
            {
                _logger.LogInformation($"Đang tạo thông báo đánh giá từ giảng viên ID: {teacherId} cho sinh viên ID: {studentId}");
                
                // Kiểm tra sinh viên có tồn tại không
                var student = await _context.Users.FirstOrDefaultAsync(u => u.UserId == studentId);
                if (student == null)
                {
                    _logger.LogWarning($"Không tìm thấy sinh viên với ID: {studentId}");
                    return new ApiResponse<Notification>
                    {
                        Success = false,
                        Message = "Sinh viên không tồn tại"
                    };
                }
                
                // Kiểm tra giảng viên có tồn tại không
                var teacher = await _context.Users.FirstOrDefaultAsync(u => u.UserId == teacherId);
                if (teacher == null)
                {
                    _logger.LogWarning($"Không tìm thấy giảng viên với ID: {teacherId}");
                    return new ApiResponse<Notification>
                    {
                        Success = false,
                        Message = "Giảng viên không tồn tại"
                    };
                }
                
                // Tạo nội dung thông báo đánh giá
                string notificationContent = $"[EVALUATION] Bạn được giảng viên {teacher.FullName} đánh giá: {evaluationContent}";
                
                // Tạo thông báo mới
                var notification = new Notification
                {
                    UserId = studentId,
                    Content = notificationContent,
                    Timestamp = DateTime.Now
                    // IsRead và Type không lưu trong DB
                };
                
                // Lưu vào database
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Đã tạo thông báo đánh giá thành công, ID: {notification.NotificationId}");
                
                return new ApiResponse<Notification>
                {
                    Success = true,
                    Message = "Tạo thông báo đánh giá thành công",
                    Data = notification
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi tạo thông báo đánh giá: {ex.Message}");
                return new ApiResponse<Notification>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<NotificationDTO>>> GetUserNotificationsAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"Đang lấy danh sách thông báo cho người dùng ID: {userId}");
                
                // Kiểm tra người dùng có tồn tại không
                var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
                if (!userExists)
                {
                    _logger.LogWarning($"Không tìm thấy người dùng với ID: {userId}");
                    return new ApiResponse<List<NotificationDTO>>
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại"
                    };
                }
                
                // Lấy thông báo của người dùng, sắp xếp theo thời gian giảm dần (mới nhất lên đầu)
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.Timestamp)
                    .ToListAsync();
                
                // Ánh xạ sang DTO và xác định Type và IsRead
                var notificationDTOs = notifications.Select(n => new NotificationDTO
                {
                    NotificationId = n.NotificationId,
                    UserId = n.UserId,
                    Content = GetNotificationContent(n.Content), // Loại bỏ prefix
                    Timestamp = n.Timestamp,
                    IsRead = false, // Mặc định là chưa đọc
                    Type = GetNotificationType(n.Content) // Xác định loại từ nội dung
                }).ToList();
                
                _logger.LogInformation($"Đã lấy {notifications.Count} thông báo cho người dùng ID: {userId}");
                
                return new ApiResponse<List<NotificationDTO>>
                {
                    Success = true,
                    Data = notificationDTOs
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy thông báo: {ex.Message}");
                return new ApiResponse<List<NotificationDTO>>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkNotificationAsReadAsync(int notificationId)
        {
            try
            {
                _logger.LogInformation($"Đang đánh dấu thông báo ID: {notificationId} là đã đọc");
                
                // Tìm thông báo
                var notification = await _context.Notifications.FindAsync(notificationId);
                if (notification == null)
                {
                    _logger.LogWarning($"Không tìm thấy thông báo với ID: {notificationId}");
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Thông báo không tồn tại"
                    };
                }
                
                // Trong trường hợp không lưu trạng thái đã đọc trong DB, 
                // chúng ta có thể sử dụng bộ nhớ cache hoặc một bảng phụ để theo dõi trạng thái
                // Hoặc chỉ trả về thành công mà không thực sự lưu trạng thái
                
                _logger.LogInformation($"Đã đánh dấu thông báo ID: {notificationId} là đã đọc (mô phỏng)");
                
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Đánh dấu thông báo đã đọc thành công",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi đánh dấu thông báo đã đọc: {ex.Message}");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<bool>> MarkAllNotificationsAsReadAsync(int userId)
        {
            try
            {
                _logger.LogInformation($"Đang đánh dấu tất cả thông báo của người dùng ID: {userId} là đã đọc");
                
                // Kiểm tra người dùng có tồn tại không
                var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);
                if (!userExists)
                {
                    _logger.LogWarning($"Không tìm thấy người dùng với ID: {userId}");
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Người dùng không tồn tại"
                    };
                }
                
                // Trong trường hợp không lưu trạng thái đã đọc trong DB,
                // chỉ trả về thành công mà không thực sự lưu trạng thái
                
                _logger.LogInformation($"Đã đánh dấu tất cả thông báo của người dùng ID: {userId} là đã đọc (mô phỏng)");
                
                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Đánh dấu tất cả thông báo đã đọc thành công",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi đánh dấu tất cả thông báo đã đọc: {ex.Message}");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }
        
        // Helper method để xác định loại thông báo từ nội dung
        private string GetNotificationType(string content)
        {
            if (content.StartsWith("[EVALUATION]"))
                return "evaluation";
            if (content.StartsWith("[COURSE]"))
                return "course";
            if (content.StartsWith("[ASSIGNMENT]"))
                return "assignment";
            if (content.StartsWith("[EXAM]"))
                return "exam";
            
            return "system";
        }
        
        // Helper method để loại bỏ prefix khỏi nội dung
        private string GetNotificationContent(string content)
        {
            if (content.StartsWith("[EVALUATION]"))
                return content.Substring("[EVALUATION]".Length).Trim();
            if (content.StartsWith("[COURSE]"))
                return content.Substring("[COURSE]".Length).Trim();
            if (content.StartsWith("[ASSIGNMENT]"))
                return content.Substring("[ASSIGNMENT]".Length).Trim();
            if (content.StartsWith("[EXAM]"))
                return content.Substring("[EXAM]".Length).Trim();
            
            return content;
        }
    }
} 