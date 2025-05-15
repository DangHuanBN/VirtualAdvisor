using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Repositories
{
    public class SubjectCourseRepository : ISubjectCourseRepository
    {
        private readonly AppDbContext _context;

        public SubjectCourseRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách các môn học phổ biến nhất cùng với các khóa học tương ứng
        /// </summary>
        /// <param name="limit">Số lượng môn học tối đa cần lấy</param>
        /// <returns>Danh sách môn học và khóa học tương ứng</returns>
        public async Task<List<SubjectCourseDTO>> GetPopularSubjectsWithCoursesAsync(int limit = 5)
        {
            // Sử dụng left join để lấy tất cả môn học và các khóa học tương ứng
            var subjectsWithEnrollments = await _context.Subjects
                .Include(s => s.Courses)
                .ThenInclude(c => c.Lectures)
                .Select(s => new
                {
                    Subject = s,
                    CourseCount = s.Courses.Count,
                    // Tính tổng số sinh viên đã đăng ký các khóa học của môn học này
                    TotalStudents = _context.StudentEnrollments
                        .Count(se => s.Courses.Select(c => c.CourseId).Contains(se.CourseId))
                })
                .OrderByDescending(s => s.TotalStudents) // Sắp xếp theo số lượng sinh viên giảm dần
                .ThenByDescending(s => s.CourseCount) // Nếu cùng số sinh viên thì sắp xếp theo số lượng khóa học
                .Take(limit)
                .ToListAsync();

            // Chuyển đổi kết quả thành DTO để trả về
            var result = new List<SubjectCourseDTO>();

            foreach (var item in subjectsWithEnrollments)
            {
                var subjectDto = new SubjectCourseDTO
                {
                    SubjectId = item.Subject.SubjectId,
                    SubjectName = item.Subject.SubjectName,
                    Courses = new List<CourseItemDTO>()
                };

                // Lấy danh sách khóa học cho mỗi môn học
                foreach (var course in item.Subject.Courses)
                {
                    var studentCount = await _context.StudentEnrollments
                        .CountAsync(se => se.CourseId == course.CourseId);

                    subjectDto.Courses.Add(new CourseItemDTO
                    {
                        CourseId = course.CourseId,
                        CourseName = course.CourseName,
                        StudentCount = studentCount,
                        LectureCount = course.Lectures.Count
                    });
                }

                result.Add(subjectDto);
            }

            return result;
        }
    }
} 