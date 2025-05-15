using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;
        private readonly ICourseStudentService _courseStudentService;

        public CoursesController(ICourseService courseService, ICourseStudentService courseStudentService)
        {
            _courseService = courseService;
            _courseStudentService = courseStudentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCourses()
        {
            var response = await _courseService.GetAllCoursesAsync();
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("count")]
        public async Task<IActionResult> GetCoursesCount()
        {
            var response = await _courseService.GetCoursesCountAsync();
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }

        [HttpGet("by-subject/{subjectId}")]
        public async Task<IActionResult> GetCoursesBySubject(int subjectId)
        {
            var response = await _courseService.GetCoursesBySubjectIdAsync(subjectId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("enrolled/{studentId}")]
        public async Task<IActionResult> GetEnrolledCourses(int studentId)
        {
            var response = await _courseStudentService.GetEnrolledCoursesAsync(studentId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("enrolled")]
        public async Task<IActionResult> GetEnrolledCoursesQuery([FromQuery] int studentId)
        {
            var response = await _courseStudentService.GetEnrolledCoursesAsync(studentId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("search")]
        public async Task<IActionResult> SearchCourses([FromQuery] string name, [FromQuery] int? subjectId = null)
        {
            if (string.IsNullOrWhiteSpace(name) && !subjectId.HasValue)
                return await GetAllCourses();
                
            if (string.IsNullOrWhiteSpace(name) && subjectId.HasValue)
                return await GetCoursesBySubject(subjectId.Value);
            
            if (!string.IsNullOrWhiteSpace(name) && subjectId.HasValue)
            {
                // Tìm kiếm theo cả tên và môn học
                var response = await _courseService.SearchCoursesByNameAndSubjectAsync(name, subjectId.Value);
                
                if (!response.Success)
                    return StatusCode(500, response);
                    
                return Ok(response);
            }
            
            // Tìm kiếm chỉ theo tên
            var nameResponse = await _courseService.SearchCoursesByNameAsync(name);
            
            if (!nameResponse.Success)
                return StatusCode(500, nameResponse);
                
            return Ok(nameResponse);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCourseById(int id)
        {
            var response = await _courseService.GetCourseByIdAsync(id);
            
            if (!response.Success)
                return NotFound(response);
                
            return Ok(response);
        }
        
        [HttpPost]
        public async Task<IActionResult> CreateCourse([FromBody] CourseCreateDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var response = await _courseService.CreateCourseAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return CreatedAtAction(nameof(GetCourseById), new { id = response.Data.Id }, response);
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] CourseUpdateDTO model)
        {
            if (id != model.Id)
                return BadRequest(new { Success = false, Message = "ID không khớp" });
                
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var response = await _courseService.UpdateCourseAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var response = await _courseService.DeleteCourseAsync(id);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }
    }
} 