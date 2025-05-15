using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectCoursesController : ControllerBase
    {
        private readonly ISubjectCourseService _subjectCourseService;

        public SubjectCoursesController(ISubjectCourseService subjectCourseService)
        {
            _subjectCourseService = subjectCourseService;
        }

        /// <summary>
        /// API lấy danh sách các môn học phổ biến nhất cùng với các khóa học tương ứng
        /// </summary>
        /// <returns>Danh sách môn học và khóa học</returns>
        [HttpGet]
        public async Task<IActionResult> GetPopularSubjectsWithCourses([FromQuery] int limit = 5)
        {
            var response = await _subjectCourseService.GetPopularSubjectsWithCoursesAsync(limit);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
    }
} 