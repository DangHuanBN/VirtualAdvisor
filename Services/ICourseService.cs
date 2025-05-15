using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface ICourseService
    {
        Task<ApiResponse<List<CourseDTO>>> GetAllCoursesAsync();
        Task<ApiResponse<List<CourseDTO>>> GetCoursesBySubjectIdAsync(int subjectId);
        Task<ApiResponse<CourseDetailDTO>> GetCourseByIdAsync(int courseId);
        Task<ApiResponse<List<CourseDTO>>> SearchCoursesByNameAsync(string name);
        Task<ApiResponse<List<CourseDTO>>> SearchCoursesByNameAndSubjectAsync(string name, int subjectId);
        Task<ApiResponse<CourseDTO>> CreateCourseAsync(CourseCreateDTO model);
        Task<ApiResponse<CourseDTO>> UpdateCourseAsync(CourseUpdateDTO model);
        Task<ApiResponse<bool>> DeleteCourseAsync(int courseId);
        Task<ApiResponse<int>> GetCoursesCountAsync();
    }
} 