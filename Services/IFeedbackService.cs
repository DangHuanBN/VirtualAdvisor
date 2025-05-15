using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface IFeedbackService
    {
        Task<ApiResponse<FeedbackHistory>> CreateFeedbackAsync(FeedbackCreateDto feedbackDto, int teacherId);
        Task<ApiResponse<List<UserDTO>>> GetStudentsByCourseIdAsync(int courseId);
        Task<ApiResponse<List<FeedbackHistoryDTO>>> GetFeedbackHistoryAsync(
            int teacherId, 
            int? subjectId = null, 
            int? courseId = null, 
            int? studentId = null,
            string? type = null,
            string? status = null);
            
        // Phương thức tạo feedback cho bài giảng của sinh viên
        Task<ApiResponse<FeedbackHistory>> CreateStudentLectureFeedbackAsync(StudentLectureFeedbackDto feedbackDto, int studentId);
        
        // Phương thức lấy lịch sử feedback của sinh viên
        Task<ApiResponse<List<FeedbackHistoryDTO>>> GetStudentFeedbackHistoryAsync(
            int studentId,
            int? lectureId = null,
            int? courseId = null);
    }
} 