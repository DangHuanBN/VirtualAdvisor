using System;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Repositories;

namespace VirtualAdvisorAPI.Services
{
    public class SubjectCourseService : ISubjectCourseService
    {
        private readonly ISubjectCourseRepository _subjectCourseRepository;

        public SubjectCourseService(ISubjectCourseRepository subjectCourseRepository)
        {
            _subjectCourseRepository = subjectCourseRepository;
        }

        /// <summary>
        /// Lấy danh sách các môn học phổ biến nhất cùng với các khóa học tương ứng
        /// </summary>
        /// <param name="limit">Số lượng môn học tối đa cần lấy</param>
        /// <returns>SubjectCoursesResponse chứa danh sách môn học và khóa học</returns>
        public async Task<SubjectCoursesResponse> GetPopularSubjectsWithCoursesAsync(int limit = 5)
        {
            try
            {
                var subjectsWithCourses = await _subjectCourseRepository.GetPopularSubjectsWithCoursesAsync(limit);
                
                return new SubjectCoursesResponse
                {
                    Success = true,
                    Message = "Lấy danh sách môn học và khóa học thành công",
                    Data = subjectsWithCourses
                };
            }
            catch (Exception ex)
            {
                return new SubjectCoursesResponse
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách môn học và khóa học: {ex.Message}"
                };
            }
        }
    }
} 