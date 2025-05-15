using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface ISubjectCourseService
    {
        Task<SubjectCoursesResponse> GetPopularSubjectsWithCoursesAsync(int limit = 5);
    }
} 