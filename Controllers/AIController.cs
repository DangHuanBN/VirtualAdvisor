using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using System.Text;

// DTO classes - di chuyển ra không gian tên chung
namespace VirtualAdvisorAPI.Models.DTOs
{
    public class TrainingResult
    {
        public string Message { get; set; }
        public string VectorPath { get; set; }
    }

    public class ErrorResponse
    {
        public string Error { get; set; }
    }

    public class QuestionRequest
    {
        public string Question { get; set; }
        public int? CourseId { get; set; }
    }

    public class AnswerResponse
    {
        public string Answer { get; set; }
    }
}

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/ai")]
    // Tạm thời bỏ [Authorize] để kiểm tra lỗi
    //[Authorize(Roles = "Admin,admin,Teacher,teacher")]
    public class AIController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AIController(
            IHttpClientFactory httpClientFactory, 
            IConfiguration configuration,
            AppDbContext context)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("train/{lectureId}")]
        public async Task<IActionResult> TrainLecture(int lectureId)
        {
            try
            {
                var lecture = await _context.Lectures.FindAsync(lectureId);
                if (lecture == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"Không tìm thấy bài giảng có ID: {lectureId}"
                    });
                }

                var aiTraining = await _context.AITrainings
                    .FirstOrDefaultAsync(a => a.LectureId == lectureId);
                
                if (aiTraining == null)
                {
                    aiTraining = new AITraining
                    {
                        LectureId = lectureId,
                        VectorStorePath = lecture.VectorPath,
                        Status = "processing"
                    };
                    _context.AITrainings.Add(aiTraining);
                }
                else
                {
                    aiTraining.Status = "processing";
                }
                
                await _context.SaveChangesAsync();

                var client = _httpClientFactory.CreateClient();
                
                string flaskApiUrl = _configuration["FlaskAPI:BaseUrl"] ?? "http://localhost:5000";
                
                var response = await client.PostAsync($"{flaskApiUrl}/train/{lectureId}", null);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<Models.DTOs.TrainingResult>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    lecture.Status = "dahuanluyen";
                    lecture.TrainingDate = DateTime.Now;
                    
                    aiTraining.Status = "completed";
                    aiTraining.TrainingTime = DateTime.Now;
                    
                    await _context.SaveChangesAsync();
                    
                    return Ok(new 
                    { 
                        success = true,
                        message = "Huấn luyện AI thành công",
                        data = result
                    });
                }
                else
                {
                    aiTraining.Status = "failed";
                    await _context.SaveChangesAsync();

                    var errorContent = await response.Content.ReadAsStringAsync();
                    var errorObj = JsonSerializer.Deserialize<Models.DTOs.ErrorResponse>(errorContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return StatusCode((int)response.StatusCode, new 
                    { 
                        success = false,
                        message = $"Lỗi huấn luyện AI: {errorObj?.Error ?? "Không xác định"}"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false,
                    message = $"Lỗi xử lý: {ex.Message}"
                });
            }
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskQuestion([FromBody] Models.DTOs.QuestionRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Question))
                {
                    return BadRequest(new 
                    { 
                        success = false,
                        message = "Câu hỏi không được để trống"
                    });
                }

                var client = _httpClientFactory.CreateClient();
                string flaskApiUrl = _configuration["FlaskAPI:BaseUrl"] ?? "http://localhost:5000";
                
                var requestContent = new StringContent(
                    JsonSerializer.Serialize(new 
                    { 
                        question = request.Question,
                        course_id = request.CourseId
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await client.PostAsync($"{flaskApiUrl}/ask", requestContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<Models.DTOs.AnswerResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return Ok(new 
                    { 
                        success = true,
                        answer = result.Answer
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    var errorObj = JsonSerializer.Deserialize<Models.DTOs.ErrorResponse>(errorContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    return StatusCode((int)response.StatusCode, new 
                    { 
                        success = false,
                        message = $"Lỗi từ AI service: {errorObj?.Error ?? "Không xác định"}"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false,
                    message = $"Lỗi xử lý: {ex.Message}"
                });
            }
        }
    }
}

namespace VirtualAdvisorAPI.Controllers 
{
    [ApiController]
    [Route("")]
    public class ChatController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public ChatController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] Models.DTOs.QuestionRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Question))
                {
                    return BadRequest(new 
                    { 
                        error = "Câu hỏi không được để trống"
                    });
                }

                var client = _httpClientFactory.CreateClient();
                string flaskApiUrl = _configuration["FlaskAPI:BaseUrl"] ?? "http://localhost:5000";
                
                var requestContent = new StringContent(
                    JsonSerializer.Serialize(new 
                    { 
                        question = request.Question,
                        course_id = request.CourseId
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await client.PostAsync($"{flaskApiUrl}/ask", requestContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<Models.DTOs.AnswerResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    // Trả về cùng định dạng với Flask API
                    return Ok(new 
                    { 
                        answer = result.Answer
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, errorContent);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    error = $"Lỗi xử lý: {ex.Message}"
                });
            }
        }
    }
} 