using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using System.Text;
using VirtualAdvisorAPI.Services;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("chatbot")]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IChatbotService _chatbotService;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IChatbotService chatbotService,
            ILogger<ChatbotController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _chatbotService = chatbotService;
            _logger = logger;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] QuestionRequest request)
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

                // Kiểm tra xác thực
                _logger.LogInformation($"Trạng thái xác thực: {User.Identity.IsAuthenticated}");
                
                // Lấy user ID nếu có
                int? userId = null;
                if (User.Identity.IsAuthenticated)
                {
                    var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                    _logger.LogInformation($"NameIdentifier claim: {nameIdentifierClaim?.Value ?? "không tìm thấy"}");
                    
                    if (nameIdentifierClaim != null)
                    {
                        userId = int.Parse(nameIdentifierClaim.Value);
                        _logger.LogInformation($"User ID: {userId}");
                    }
                    else
                    {
                        _logger.LogWarning("Đã đăng nhập nhưng không tìm thấy claim NameIdentifier");
                    }
                }
                else
                {
                    _logger.LogWarning("Người dùng chưa đăng nhập, tin nhắn sẽ không được lưu");
                }

                // Không lưu câu hỏi ngay, sẽ lưu cả câu hỏi và câu trả lời sau khi nhận được phản hồi từ API

                var client = _httpClientFactory.CreateClient();
                string flaskApiUrl = _configuration["FlaskAPI:BaseUrl"] ?? "http://localhost:5000";
                _logger.LogInformation($"Gửi yêu cầu đến Flask API: {flaskApiUrl}/ask");
                
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
                    _logger.LogInformation($"Nhận phản hồi từ Flask API: {content}");
                    
                    var result = JsonSerializer.Deserialize<AnswerResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    // Lưu cả câu hỏi và câu trả lời trong một bản ghi nếu người dùng đã đăng nhập
                    if (userId.HasValue && !string.IsNullOrEmpty(result.Answer))
                    {
                        try
                        {
                            var conversationMessage = await _chatbotService.SaveConversationMessageAsync(
                                userId.Value, 
                                request.Question, 
                                result.Answer
                            );
                            _logger.LogInformation($"Đã lưu hội thoại với ID: {conversationMessage.ChatId}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"Lỗi khi lưu hội thoại: {ex.Message}");
                        }
                    }

                    // Trả về cùng định dạng với Flask API
                    return Ok(new 
                    { 
                        answer = result.Answer
                    });
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Lỗi từ Flask API: {errorContent}");
                    return StatusCode((int)response.StatusCode, errorContent);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi xử lý yêu cầu: {ex.Message}");
                return StatusCode(500, new 
                { 
                    error = $"Lỗi xử lý: {ex.Message}"
                });
            }
        }

        [HttpGet("history")]
        [Authorize]
        public async Task<IActionResult> GetChatHistory([FromQuery] int limit = 20, [FromQuery] int page = 1)
        {
            try
            {
                // Lấy user ID từ token
                var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (nameIdentifierClaim == null)
                {
                    _logger.LogWarning("Không tìm thấy claim NameIdentifier khi lấy lịch sử chat");
                    return Unauthorized(new { error = "Không thể xác định người dùng" });
                }

                if (!int.TryParse(nameIdentifierClaim.Value, out int userId))
                {
                    _logger.LogWarning($"Không thể parse userId từ claim NameIdentifier: {nameIdentifierClaim.Value}");
                    return Unauthorized(new { error = "Không thể xác định người dùng" });
                }

                _logger.LogInformation($"Lấy lịch sử chat cho userId: {userId}, limit: {limit}, page: {page}");

                // Đảm bảo các tham số phân trang hợp lệ
                limit = Math.Max(1, Math.Min(limit, 100)); // Giới hạn từ 1 đến 100 tin nhắn mỗi trang
                page = Math.Max(1, page); // Trang bắt đầu từ 1

                var chatHistory = await _chatbotService.GetChatHistoryByUserIdAsync(userId, limit, page);
                _logger.LogInformation($"Đã lấy {chatHistory.Count} tin nhắn từ lịch sử chat");
                
                return Ok(chatHistory);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi lấy lịch sử chat: {ex.Message}");
                return StatusCode(500, new { error = $"Lỗi xử lý: {ex.Message}" });
            }
        }

        [HttpDelete("history")]
        [Authorize]
        public async Task<IActionResult> DeleteChatHistory()
        {
            try
            {
                // Lấy user ID từ token
                var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (nameIdentifierClaim == null)
                {
                    _logger.LogWarning("Không tìm thấy claim NameIdentifier khi xóa lịch sử chat");
                    return Unauthorized(new { error = "Không thể xác định người dùng" });
                }

                if (!int.TryParse(nameIdentifierClaim.Value, out int userId))
                {
                    _logger.LogWarning($"Không thể parse userId từ claim NameIdentifier: {nameIdentifierClaim.Value}");
                    return Unauthorized(new { error = "Không thể xác định người dùng" });
                }

                _logger.LogInformation($"Xóa lịch sử chat cho userId: {userId}");

                var result = await _chatbotService.DeleteChatHistoryByUserIdAsync(userId);
                if (result)
                {
                    _logger.LogInformation($"Đã xóa lịch sử chat cho userId: {userId}");
                    return Ok(new { message = "Lịch sử chat đã được xóa" });
                }
                else
                {
                    _logger.LogInformation($"Không tìm thấy lịch sử chat cho userId: {userId}");
                    return NotFound(new { message = "Không tìm thấy lịch sử chat" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi xóa lịch sử chat: {ex.Message}");
                return StatusCode(500, new { error = $"Lỗi xử lý: {ex.Message}" });
            }
        }
    }
}