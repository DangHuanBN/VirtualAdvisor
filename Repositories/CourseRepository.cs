using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public class CourseRepository : GenericRepository<Course>, ICourseRepository
    {
        public CourseRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Course>> GetCoursesBySubjectIdAsync(int subjectId)
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Lectures)
                .Where(c => c.SubjectId == subjectId)
                .ToListAsync();
        }

        public async Task<Course?> GetCourseWithSubjectAsync(int courseId)
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);
        }

        public async Task<IEnumerable<Course>> GetCoursesWithSubjectsAsync()
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Lectures)
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetCoursesWithLecturesAsync()
        {
            return await _context.Courses
                .Include(c => c.Lectures)
                .ToListAsync();
        }

        public async Task<Course?> GetCourseWithLecturesAsync(int courseId)
        {
            return await _context.Courses
                .Include(c => c.Lectures)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);
        }
        
        public async Task<IEnumerable<Course>> SearchCoursesByNameAsync(string name)
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Lectures)
                .Where(c => c.CourseName.Contains(name))
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Course>> GetCoursesWithDetailsAsync()
        {
            return await _context.Courses
                .Include(c => c.Subject)
                .Include(c => c.Lectures)
                .ToListAsync();
        }
    }
} 