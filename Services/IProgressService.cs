using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface IProgressService
    {
        Task<IEnumerable<Subject>> GetAllSubjectsAsync();
        Task<IEnumerable<Course>> GetCoursesBySubjectAsync(int subjectId);
        Task<IEnumerable<StudentBasicDto>> GetStudentsByCourseAsync(int courseId);
        Task<StudentProgressDto> GetStudentProgressAsync(int courseId, int studentId);
        Task<IEnumerable<ProgressDetailDto>> GetProgressDetailsAsync(int courseId, int studentId);
        Task<IEnumerable<StudentCourseDto>> GetStudentCoursesAsync(int studentId);
        Task<StudentResultsDto> GetStudentResultsAsync(int studentId, int courseId);
    }
} 