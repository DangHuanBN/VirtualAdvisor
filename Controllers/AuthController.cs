using Microsoft.AspNetCore.Mvc;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    _logger.LogWarning("Đăng nhập thất bại: Thông tin đăng nhập không đầy đủ");
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"
                    });
                }

                _logger.LogInformation($"Đang xử lý đăng nhập cho người dùng: {request.Username}");
                var response = await _authService.Login(request);
                
                if (!response.Success)
                {
                    _logger.LogWarning($"Đăng nhập thất bại cho người dùng {request.Username}: {response.Message}");
                    return BadRequest(response);
                }
                
                _logger.LogInformation($"Đăng nhập thành công cho người dùng: {request.Username}, vai trò: {response.User?.Role}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi xử lý đăng nhập: {ex.Message}");
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = "Lỗi server khi xử lý đăng nhập"
                });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Log thông tin request để debug
                Console.WriteLine($"==== ĐĂNG KÝ MỚI ====");
                Console.WriteLine($"Username: {request?.Username}");
                Console.WriteLine($"FullName: {request?.FullName}");
                Console.WriteLine($"Role: {request?.Role}");
                
                if (request == null)
                {
                    Console.WriteLine("LỖI: Request body trống");
                    return BadRequest(new AuthResponse 
                    { 
                        Success = false, 
                        Message = "Dữ liệu đăng ký không hợp lệ - Request body trống" 
                    });
                }
                
                // Validate dữ liệu cơ bản
                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password) || 
                    string.IsNullOrEmpty(request.FullName))
                {
                    var missingFields = new List<string>();
                    if (string.IsNullOrEmpty(request.Username)) missingFields.Add("tên đăng nhập");
                    if (string.IsNullOrEmpty(request.Password)) missingFields.Add("mật khẩu");
                    if (string.IsNullOrEmpty(request.FullName)) missingFields.Add("họ tên");
                    
                    var message = $"Vui lòng điền đầy đủ thông tin bắt buộc: {string.Join(", ", missingFields)}";
                    Console.WriteLine($"LỖI: {message}");
                    
                    return BadRequest(new AuthResponse 
                    { 
                        Success = false, 
                        Message = message
                    });
                }
                
                // Kiểm tra password và confirmPassword trước khi gửi đến service
                if (request.Password != request.ConfirmPassword)
                {
                    Console.WriteLine("LỖI: Mật khẩu và mật khẩu xác nhận không khớp");
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Mật khẩu và mật khẩu xác nhận không khớp"
                    });
                }
                
                // Kiểm tra giá trị role hợp lệ
                if (!Enum.IsDefined(typeof(UserRole), request.Role))
                {
                    Console.WriteLine($"LỖI: Giá trị vai trò không hợp lệ: {request.Role}");
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = $"Giá trị vai trò không hợp lệ: {request.Role}"
                    });
                }
                
                var response = await _authService.Register(request);
                if (!response.Success)
                {
                    Console.WriteLine($"LỖI từ service: {response.Message}");
                    return BadRequest(response);
                }
                
                Console.WriteLine("Đăng ký thành công!");
                return Ok(response);
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"LỖI NGHIÊM TRỌNG khi đăng ký: {ex.Message}");
                Console.WriteLine($"Chi tiết: {ex.StackTrace}");
                
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = $"Lỗi server: {ex.Message}"
                });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new OtpResponse
                    {
                        Success = false,
                        Message = "Email không được để trống"
                    });
                }

                var response = await _authService.ForgotPassword(request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi xử lý quên mật khẩu: {ex.Message}");
                return StatusCode(500, new OtpResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý yêu cầu quên mật khẩu"
                });
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.OtpCode))
                {
                    return BadRequest(new OtpResponse
                    {
                        Success = false,
                        Message = "Email và mã OTP không được để trống"
                    });
                }

                var response = await _authService.VerifyOtp(request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi xác thực OTP: {ex.Message}");
                return StatusCode(500, new OtpResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xác thực mã OTP"
                });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrEmpty(request.Email) || 
                    string.IsNullOrEmpty(request.OtpCode) || 
                    string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Vui lòng cung cấp đầy đủ thông tin"
                    });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new AuthResponse
                    {
                        Success = false,
                        Message = "Mật khẩu xác nhận không khớp"
                    });
                }

                var response = await _authService.ResetPassword(request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi đặt lại mật khẩu: {ex.Message}");
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đặt lại mật khẩu"
                });
            }
        }

        [HttpGet("redirect")]
        public IActionResult GetRedirectUrl([FromQuery] string role)
        {
            string redirectUrl;

            switch (role.ToLower())
            {
                case "admin":
                    redirectUrl = "/admin/index.html";
                    break;
                case "teacher":
                    redirectUrl = "/teacher/index.html";
                    break;
                case "student":
                case "other":
                default:
                    redirectUrl = "/student/index.html";
                    break;
            }

            return Ok(new { redirectUrl });
        }
    }
} 