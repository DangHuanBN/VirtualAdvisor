using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public class SubjectRepository : GenericRepository<Subject>, ISubjectRepository
    {
        public SubjectRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Subject>> GetSubjectsWithCoursesAsync()
        {
            return await _context.Subjects
                .Include(s => s.Courses)
                .ToListAsync();
        }

        public async Task<Subject?> GetSubjectWithCoursesAsync(int subjectId)
        {
            return await _context.Subjects
                .Include(s => s.Courses)
                .FirstOrDefaultAsync(s => s.SubjectId == subjectId);
        }
        
        public async Task<IEnumerable<Subject>> SearchByNameAsync(string name)
        {
            return await _context.Subjects
                .Include(s => s.Courses)
                .Where(s => s.SubjectName.Contains(name))
                .ToListAsync();
        }
        
        public async Task<int> GetCountAsync()
        {
            return await _context.Subjects.CountAsync();
        }

        // Triển khai các phương thức đặc thù cho Subject (nếu có)
    }
} 