using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models
{
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; }

        public DateTime? Dob { get; set; }

        public bool? Gender { get; set; }

        [MaxLength(255)]
        public string? Address { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(15)]
        public string? Phone { get; set; }

        [Required]
        public UserRole Role { get; set; } = UserRole.Student;
    }

    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }

    public class VerifyOtpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
        public string OtpCode { get; set; }
    }

    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
        public string OtpCode { get; set; }

        [Required]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; }
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public User User { get; set; }
    }

    public class OtpResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }

    public class UserLoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class UserRegisterDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required, MinLength(6)]
        public string Username { get; set; } = string.Empty;
        
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [Required, Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        // Các trường khác
    }
} 