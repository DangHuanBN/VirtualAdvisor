using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public interface ICourseRepository : IGenericRepository<Course>
    {
        Task<IEnumerable<Course>> GetCoursesBySubjectIdAsync(int subjectId);
        Task<Course?> GetCourseWithSubjectAsync(int courseId);
        Task<IEnumerable<Course>> GetCoursesWithSubjectsAsync();
        Task<IEnumerable<Course>> GetCoursesWithLecturesAsync();
        Task<Course?> GetCourseWithLecturesAsync(int courseId);
        Task<IEnumerable<Course>> SearchCoursesByNameAsync(string name);
        Task<IEnumerable<Course>> GetCoursesWithDetailsAsync();
    }
} 