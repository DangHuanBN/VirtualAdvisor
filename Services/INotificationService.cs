using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface INotificationService
    {
        /// <summary>
        /// Tạo thông báo mới
        /// </summary>
        Task<ApiResponse<Notification>> CreateNotificationAsync(string content, int userId);
        
        /// <summary>
        /// Tạo thông báo đánh giá cho sinh viên
        /// </summary>
        Task<ApiResponse<Notification>> CreateEvaluationNotificationAsync(int studentId, int teacherId, string evaluationContent);
        
        /// <summary>
        /// Lấy danh sách thông báo của người dùng
        /// </summary>
        Task<ApiResponse<List<NotificationDTO>>> GetUserNotificationsAsync(int userId);
        
        /// <summary>
        /// Đánh dấu thông báo đã đọc
        /// </summary>
        Task<ApiResponse<bool>> MarkNotificationAsReadAsync(int notificationId);
        
        /// <summary>
        /// Đánh dấu tất cả thông báo của người dùng đã đọc
        /// </summary>
        Task<ApiResponse<bool>> MarkAllNotificationsAsReadAsync(int userId);
    }
} 