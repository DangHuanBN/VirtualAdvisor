using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Repositories
{
    public interface ISubjectCourseRepository
    {
        Task<List<SubjectCourseDTO>> GetPopularSubjectsWithCoursesAsync(int limit = 5);
    }
} 