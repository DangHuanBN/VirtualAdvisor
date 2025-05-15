using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Services;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubjectsController : ControllerBase
    {
        private readonly ISubjectService _subjectService;

        public SubjectsController(ISubjectService subjectService)
        {
            _subjectService = subjectService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSubjects()
        {
            var response = await _subjectService.GetAllSubjectsAsync();
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("count")]
        public async Task<IActionResult> GetSubjectsCount()
        {
            var response = await _subjectService.GetSubjectsCountAsync();
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("search")]
        public async Task<IActionResult> SearchSubjects([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return await GetAllSubjects();
                
            var response = await _subjectService.GetSubjectsByNameAsync(name);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSubjectById(int id)
        {
            var response = await _subjectService.GetSubjectByIdAsync(id);
            
            if (!response.Success)
                return NotFound(response);
                
            return Ok(response);
        }
        
        [HttpPost]
        public async Task<IActionResult> CreateSubject([FromBody] SubjectCreateDTO model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var response = await _subjectService.CreateSubjectAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return CreatedAtAction(nameof(GetSubjectById), new { id = response.Data!.Id }, response);
        }
        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubject(int id, [FromBody] SubjectUpdateDTO model)
        {
            if (id != model.Id)
                return BadRequest(new { Success = false, Message = "ID không khớp" });
                
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var response = await _subjectService.UpdateSubjectAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }
        
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubject(int id)
        {
            var response = await _subjectService.DeleteSubjectAsync(id);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }
    }
} 