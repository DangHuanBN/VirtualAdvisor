using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public interface ISubjectRepository : IGenericRepository<Subject>
    {
        Task<IEnumerable<Subject>> GetSubjectsWithCoursesAsync();
        Task<Subject?> GetSubjectWithCoursesAsync(int subjectId);
        Task<IEnumerable<Subject>> SearchByNameAsync(string name);
        Task<int> GetCountAsync();
    }
} 