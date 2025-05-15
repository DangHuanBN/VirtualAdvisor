using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Services
{
    public interface ICourseStudentService
    {
        /// <summary>
        /// Lấy danh sách khóa học mà sinh viên chưa đăng ký
        /// </summary>
        /// <param name="studentId">ID của sinh viên</param>
        /// <returns>Danh sách khóa học khả dụng</returns>
        Task<ApiResponse<List<AvailableCourseDto>>> GetAvailableCoursesAsync(int studentId);
        
        /// <summary>
        /// Đăng ký khóa học cho sinh viên
        /// </summary>
        /// <param name="model">Thông tin đăng ký khóa học</param>
        /// <returns>Kết quả đăng ký</returns>
        Task<ApiResponse<bool>> RegisterCourseAsync(CourseStudentRegisterModel model);
        
        /// <summary>
        /// Lấy danh sách khóa học mà sinh viên đã đăng ký
        /// </summary>
        /// <param name="studentId">ID của sinh viên</param>
        /// <returns>Danh sách khóa học đã đăng ký</returns>
        Task<ApiResponse<List<AvailableCourseDto>>> GetEnrolledCoursesAsync(int studentId);
        
        /// <summary>
        /// Lấy thông tin chi tiết của một khóa học theo ID
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Thông tin khóa học</returns>
        Task<ApiResponse<CourseDto>> GetCourseByIdAsync(int courseId);
        
        /// <summary>
        /// Lấy danh sách bài giảng của một khóa học
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Danh sách bài giảng</returns>
        Task<ApiResponse<List<LectureDto>>> GetLecturesByCourseIdAsync(int courseId);
        
        /// <summary>
        /// Truy vấn trực tiếp số lượng bài giảng của một khóa học
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Số lượng bài giảng</returns>
        Task<int> GetLectureCountDirectlyAsync(int courseId);
        
        /// <summary>
        /// Hủy đăng ký khóa học cho sinh viên
        /// </summary>
        /// <param name="model">Thông tin hủy đăng ký khóa học</param>
        /// <returns>Kết quả hủy đăng ký</returns>
        Task<ApiResponse<bool>> UnregisterCourseAsync(CourseStudentRegisterModel model);
    }
} 