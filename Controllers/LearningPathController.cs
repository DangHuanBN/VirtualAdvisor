using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/learning-path")]
    public class LearningPathController : ControllerBase
    {
        private readonly ILearningPathService _learningPathService;
        private readonly ILogger<LearningPathController> _logger;
        
        public LearningPathController(ILearningPathService learningPathService, ILogger<LearningPathController> logger)
        {
            _learningPathService = learningPathService;
            _logger = logger;
        }
        
        // GET: /api/learning-path/student
        [HttpGet("student")]
        public async Task<ActionResult<IEnumerable<StudentLearningPathDTO>>> GetStudentLearningPaths()
        {
            try
            {
                int studentId = GetCurrentUserId();
                if (studentId <= 0)
                {
                    return Unauthorized("Bạn cần đăng nhập để xem lộ trình học tập");
                }
                
                var learningPaths = await _learningPathService.GetStudentLearningPathsAsync(studentId);
                return Ok(learningPaths);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lộ trình học tập");
                return StatusCode(500, $"Lỗi khi lấy lộ trình học tập: {ex.Message}");
            }
        }
        
        // GET: /api/learning-path/detail/{pathId}
        [HttpGet("detail/{pathId}")]
        public async Task<ActionResult<StudentLearningPathDetailDTO>> GetStudentLearningPathDetail(int pathId)
        {
            try
            {
                int studentId = GetCurrentUserId();
                if (studentId <= 0)
                {
                    return Unauthorized("Bạn cần đăng nhập để xem chi tiết lộ trình học tập");
                }
                
                var pathDetail = await _learningPathService.GetStudentLearningPathDetailAsync(pathId, studentId);
                return Ok(pathDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy chi tiết lộ trình học tập (ID: {pathId})");
                return StatusCode(500, $"Lỗi khi lấy chi tiết lộ trình học tập: {ex.Message}");
            }
        }
        
        // GET: /api/learning-path/recommendations
        [HttpGet("recommendations")]
        public async Task<ActionResult<IEnumerable<CourseRecommendationDTO>>> GetRecommendedCourses()
        {
            try
            {
                int studentId = GetCurrentUserId();
                if (studentId <= 0)
                {
                    return Unauthorized("Bạn cần đăng nhập để xem khóa học đề xuất");
                }
                
                var recommendations = await _learningPathService.GetRecommendedCoursesAsync(studentId);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy khóa học đề xuất");
                return StatusCode(500, $"Lỗi khi lấy khóa học đề xuất: {ex.Message}");
            }
        }
        
        // Phương thức hỗ trợ để lấy ID người dùng hiện tại
        private int GetCurrentUserId()
        {
            try
            {
                // Log tất cả các header để debug
                _logger.LogInformation("DEBUG: Tất cả các header trong request:");
                foreach (var header in Request.Headers)
                {
                    _logger.LogInformation($"  - {header.Key}: {header.Value}");
                }
                
                // Kiểm tra query string
                if (Request.Query.TryGetValue("userId", out var queryUserId))
                {
                    _logger.LogInformation($"Tìm thấy userId trong query string: {queryUserId}");
                    
                    if (int.TryParse(queryUserId, out int userId) && userId > 0)
                    {
                        _logger.LogInformation($"Sử dụng userId từ query string: {userId}");
                        return userId;
                    }
                    else
                    {
                        _logger.LogWarning($"userId trong query string không hợp lệ: '{queryUserId}'");
                    }
                }
                else
                {
                    _logger.LogWarning("Không tìm thấy userId trong query string");
                }
                
                // Thử lấy ID từ header đặc biệt (chỉ dùng trong quá trình phát triển)
                if (Request.Headers.TryGetValue("X-User-Id", out var userIdHeader))
                {
                    if (int.TryParse(userIdHeader, out int userId) && userId > 0)
                    {
                        _logger.LogInformation($"Lấy ID người dùng từ header X-User-Id: {userId}");
                        return userId;
                    }
                    else
                    {
                        _logger.LogWarning($"X-User-Id header tồn tại nhưng không hợp lệ: '{userIdHeader}'");
                    }
                }
                else
                {
                    _logger.LogWarning("Không tìm thấy header X-User-Id");
                }
                
                // Nếu không có header, lấy từ claims trong token JWT
                if (User.Identity?.IsAuthenticated == true)
                {
                    _logger.LogInformation("User đã xác thực qua JWT");
                    
                    // Log tất cả các claims để debug
                    _logger.LogInformation("Tất cả claims trong token:");
                    foreach (var claim in User.Claims)
                    {
                        _logger.LogInformation($"  - {claim.Type}: {claim.Value}");
                    }
                    
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                    
                    if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                    {
                        _logger.LogInformation($"Lấy ID người dùng từ JWT claims: {userId}");
                        return userId;
                    }
                    else if (userIdClaim != null)
                    {
                        _logger.LogWarning($"Claim NameIdentifier tồn tại nhưng không phải số nguyên hợp lệ: '{userIdClaim.Value}'");
                    }
                    else
                    {
                        _logger.LogWarning("Không tìm thấy claim NameIdentifier trong JWT token");
                    }
                }
                else
                {
                    _logger.LogWarning("User chưa xác thực: User.Identity.IsAuthenticated = false");
                }
                
                // Fallback: Thử lấy từ query string (không khuyến khích dùng trong production)
                var queryUserIdFallback = Request.Query["userId"].FirstOrDefault();
                if (!string.IsNullOrEmpty(queryUserIdFallback) && int.TryParse(queryUserIdFallback, out int queryIdFallback) && queryIdFallback > 0)
                {
                    _logger.LogWarning($"Sử dụng userId từ query string fallback: {queryIdFallback} - CHỈ NÊN DÙNG CHO DEVELOPMENT");
                    return queryIdFallback;
                }
                
                _logger.LogWarning("Không tìm thấy ID người dùng trong request");
                return -1;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy ID người dùng");
                return -1;
            }
        }
        
        // Giữ lại các API cũ để đảm bảo khả năng tương thích
        // GET: /api/learning-path/student/{studentId}
        [HttpGet("student/{studentId}")]
        public async Task<ActionResult<IEnumerable<StudentLearningPathDTO>>> GetStudentLearningPathsByStudentId(int studentId)
        {
            try
            {
                var learningPaths = await _learningPathService.GetStudentLearningPathsAsync(studentId);
                return Ok(learningPaths);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy lộ trình học tập: {ex.Message}");
            }
        }
        
        // GET: /api/learning-path/detail/{pathId}/{studentId}
        [HttpGet("detail/{pathId}/{studentId}")]
        public async Task<ActionResult<StudentLearningPathDetailDTO>> GetStudentLearningPathDetailByStudentId(int pathId, int studentId)
        {
            try
            {
                var pathDetail = await _learningPathService.GetStudentLearningPathDetailAsync(pathId, studentId);
                return Ok(pathDetail);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy chi tiết lộ trình học tập: {ex.Message}");
            }
        }
        
        // GET: /api/learning-path/recommendations/{studentId}
        [HttpGet("recommendations/{studentId}")]
        public async Task<ActionResult<IEnumerable<CourseRecommendationDTO>>> GetRecommendedCoursesByStudentId(int studentId)
        {
            try
            {
                var recommendations = await _learningPathService.GetRecommendedCoursesAsync(studentId);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy khóa học đề xuất: {ex.Message}");
            }
        }
    }
} 