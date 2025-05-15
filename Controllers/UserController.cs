using Microsoft.AspNetCore.Mvc;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Services;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;
using VirtualAdvisorAPI.Exceptions;
using System.Linq;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        // GET: api/User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all users: {ex.Message}");
                return StatusCode(500, "Lỗi khi lấy danh sách người dùng");
            }
        }

        // GET: api/User/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi lấy thông tin người dùng");
            }
        }

        // GET: api/User/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<User>>> SearchUsers([FromQuery] string term, [FromQuery] string? role = null, [FromQuery] string? status = null)
        {
            try
            {
                var users = await _userService.SearchUsersAsync(term, role, status);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching users: {ex.Message}");
                return StatusCode(500, "Lỗi khi tìm kiếm người dùng");
            }
        }

        // POST: api/User
        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] UserCreateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var user = new User
                {
                    Username = request.Username,
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = request.Role,
                    Status = request.Status ?? "active"
                };

                var createdUser = await _userService.CreateUserAsync(user, request.Password);
                return CreatedAtAction(nameof(GetUser), new { id = createdUser.UserId }, createdUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user: {ex.Message}");
                return StatusCode(500, "Lỗi khi tạo người dùng mới");
            }
        }

        // PUT: api/User/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateRequest request)
        {
            if (id != request.UserId)
            {
                return BadRequest("ID không khớp");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                // Cập nhật các trường được phép
                User userToUpdate = new User
                {
                    UserId = id,
                    Username = existingUser.Username, // Giữ nguyên username
                    FullName = request.FullName,
                    Email = request.Email,
                    Phone = request.Phone,
                    Status = request.Status,
                    Role = existingUser.Role, // Giữ nguyên role
                    Password = existingUser.Password // Giữ nguyên password
                };

                // Không cho phép sửa Role ở đây (yêu cầu của bài toán)
                
                try
                {
                    var updatedUser = await _userService.UpdateUserAsync(id, userToUpdate);
                    return Ok(updatedUser);
                }
                catch (NotFoundException ex)
                {
                    return NotFound(ex.Message);
                }
                catch (DuplicateException ex)
                {
                    return Conflict(ex.Message);
                }
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi cập nhật người dùng");
            }
        }

        // PUT: api/User/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UserStatusUpdateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                var success = await _userService.UpdateUserStatusAsync(id, request.Status);
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Cập nhật trạng thái người dùng thất bại");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user status {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi cập nhật trạng thái người dùng");
            }
        }

        // DELETE: api/User/5/soft
        [HttpDelete("{id}/soft")]
        public async Task<IActionResult> SoftDeleteUser(int id)
        {
            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                var success = await _userService.SoftDeleteUserAsync(id);
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Xóa mềm người dùng thất bại");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error soft deleting user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi xóa mềm người dùng");
            }
        }

        // DELETE: api/User/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                var success = await _userService.DeleteUserAsync(id);
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Xóa người dùng thất bại");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi xóa người dùng");
            }
        }

        // PUT: api/User/5/password
        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                var success = await _userService.ChangePasswordAsync(id, request.NewPassword);
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Đổi mật khẩu thất bại");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error changing password for user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi đổi mật khẩu");
            }
        }

        // PUT: api/User/5/role
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UserRoleUpdateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                var success = await _userService.UpdateUserRoleAsync(id, request.Role);
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, "Cập nhật quyền người dùng thất bại");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating role for user {id}: {ex.Message}");
                return StatusCode(500, "Lỗi khi cập nhật quyền người dùng");
            }
        }

        // GET: api/User/5/get-password
        [HttpGet("{id}/get-password")]
        public async Task<ActionResult<object>> GetPassword(int id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy người dùng" });
                }

                // Lấy mật khẩu từ service
                var password = await _userService.GetUserPasswordAsync(id);
                
                if (string.IsNullOrEmpty(password))
                {
                    return Ok(new { message = "Mật khẩu đã được mã hóa và không thể hiển thị" });
                }

                return Ok(new { password = password });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting user password {id}: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy mật khẩu người dùng" });
            }
        }

        // PUT: api/User/profile/update
        [HttpPut("profile/update")]
        public async Task<IActionResult> UpdateUserProfile([FromBody] ProfileUpdateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Lấy ID người dùng từ request header hoặc token
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
                int authenticatedUserId = 0;
                
                // Nếu lấy được từ claim
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out authenticatedUserId))
                {
                    // Nếu không phải admin hoặc không phải chính người dùng đó
                    if (authenticatedUserId != request.UserId && !User.IsInRole("Admin"))
                    {
                        return Forbid("Bạn không có quyền cập nhật thông tin của người dùng khác");
                    }
                }
                else
                {
                    // Trường hợp không có claim hoặc không parse được
                    // Thử lấy từ header
                    if (Request.Headers.TryGetValue("X-User-Id", out var headerUserId) &&
                        int.TryParse(headerUserId, out authenticatedUserId))
                    {
                        if (authenticatedUserId != request.UserId)
                        {
                            return Forbid("Bạn không có quyền cập nhật thông tin của người dùng khác");
                        }
                    }
                    else
                    {
                        // Không thể xác định người dùng hiện tại
                        return Unauthorized("Không thể xác định người dùng hiện tại");
                    }
                }

                // Lấy thông tin cũ của người dùng để chỉ cập nhật các trường được cho phép
                var existingUser = await _userService.GetUserByIdAsync(request.UserId);
                if (existingUser == null)
                {
                    return NotFound("Không tìm thấy người dùng");
                }

                // Cập nhật chỉ các trường được phép
                User userToUpdate = new User
                {
                    UserId = request.UserId,
                    Username = existingUser.Username, // Giữ nguyên username
                    FullName = request.FullName, // Cập nhật fullname
                    Dob = request.Dob,
                    Gender = request.Gender,
                    Address = request.Address,
                    Email = request.Email,
                    Phone = request.Phone,
                    Role = existingUser.Role, // Giữ nguyên role
                    Password = existingUser.Password, // Giữ nguyên password
                    Status = existingUser.Status // Giữ nguyên status
                };

                try
                {
                    var updatedUser = await _userService.UpdateUserProfileAsync(request.UserId, userToUpdate);
                    return Ok(new { success = true, message = "Cập nhật thông tin thành công", user = updatedUser });
                }
                catch (NotFoundException ex)
                {
                    return NotFound(ex.Message);
                }
                catch (DuplicateException ex)
                {
                    return Conflict(ex.Message);
                }
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user profile {request.UserId}: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Lỗi khi cập nhật thông tin cá nhân" });
            }
        }
    }

    public class UserCreateRequest
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(255, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(15)]
        public string? Phone { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public string? Status { get; set; } = "active";
    }

    public class UserUpdateRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(15)]
        public string? Phone { get; set; }

        [Required]
        public string Status { get; set; } = "active";
    }

    public class UserStatusUpdateRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        [Required]
        [StringLength(255, MinimumLength = 6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UserRoleUpdateRequest
    {
        [Required]
        public UserRole Role { get; set; }
    }

    public class ProfileUpdateRequest
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        public DateTime? Dob { get; set; }
        
        public bool? Gender { get; set; }
        
        [MaxLength(255)]
        public string? Address { get; set; }
        
        [EmailAddress]
        [MaxLength(100)]
        public string? Email { get; set; }
        
        [MaxLength(15)]
        public string? Phone { get; set; }
    }
} 