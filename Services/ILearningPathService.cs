using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface ILearningPathService
    {
        Task<LearningPath> CreateLearningPathWhenCourseCreated(int courseId);
        Task<LearningPathDetail> AddLectureToLearningPath(int lectureId);
        Task<string> GetCourseTypeById(int courseId);
        
        // Phương thức lấy lộ trình học tập của sinh viên
        Task<IEnumerable<StudentLearningPathDTO>> GetStudentLearningPathsAsync(int studentId);
        
        // Phương thức lấy chi tiết lộ trình học tập theo path_id
        Task<StudentLearningPathDetailDTO> GetStudentLearningPathDetailAsync(int pathId, int studentId);
        
        // Phương thức gợi ý các khóa học tiếp theo
        Task<IEnumerable<CourseRecommendationDTO>> GetRecommendedCoursesAsync(int studentId);
    }
} 