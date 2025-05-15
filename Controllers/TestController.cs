using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Get()
        {
            return Ok(new { message = "API công khai, không cần xác thực" });
        }

        [HttpGet("authenticated")]
        [Authorize]
        public IActionResult GetAuthenticated()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            return Ok(new { 
                message = "API đã xác thực, bạn đã đăng nhập",
                userId,
                username,
                role
            });
        }

        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public IActionResult GetAdmin()
        {
            return Ok(new { message = "API chỉ dành cho Admin" });
        }

        [HttpGet("teacher")]
        [Authorize(Roles = "Teacher")]
        public IActionResult GetTeacher()
        {
            return Ok(new { message = "API chỉ dành cho Teacher" });
        }

        [HttpGet("student")]
        [Authorize(Roles = "Student")]
        public IActionResult GetStudent()
        {
            return Ok(new { message = "API chỉ dành cho Student" });
        }
    }
} 