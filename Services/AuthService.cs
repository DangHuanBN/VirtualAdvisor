using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using BCrypt.Net;

namespace VirtualAdvisorAPI.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> Login(LoginRequest request);
        Task<AuthResponse> Register(RegisterRequest request);
        Task<OtpResponse> ForgotPassword(ForgotPasswordRequest request);
        Task<OtpResponse> VerifyOtp(VerifyOtpRequest request);
        Task<AuthResponse> ResetPassword(ResetPasswordRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IOtpService _otpService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            AppDbContext context, 
            IConfiguration configuration,
            IEmailService emailService,
            IOtpService otpService,
            ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _otpService = otpService;
            _logger = logger;
        }

        public async Task<AuthResponse> Login(LoginRequest request)
        {
            try
            {
                // Log yêu cầu đăng nhập
                _logger.LogInformation($"Xử lý yêu cầu đăng nhập cho username: {request.Username}");
                
                // Tìm kiếm người dùng theo tên đăng nhập
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
                
                if (user == null)
                {
                    _logger.LogWarning($"Đăng nhập thất bại: Username không tồn tại: {request.Username}");
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Tên đăng nhập hoặc mật khẩu không chính xác"
                    };
                }

                // Kiểm tra mật khẩu
                if (!VerifyPasswordHash(request.Password, user.Password))
                {
                    _logger.LogWarning($"Đăng nhập thất bại: Sai mật khẩu cho username: {request.Username}");
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Tên đăng nhập hoặc mật khẩu không chính xác"
                    };
                }

                // Tạo JWT token
                var token = GenerateJwtToken(user);
                
                _logger.LogInformation($"Đăng nhập thành công cho username: {request.Username}, UserId: {user.UserId}, Role: {user.Role}");
                
                // Trả về kết quả thành công
                return new AuthResponse
                {
                    Success = true,
                    Message = "Đăng nhập thành công",
                    Token = token,
                    User = user
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi trong quá trình đăng nhập: {ex.Message}");
                return new AuthResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xử lý đăng nhập. Vui lòng thử lại sau."
                };
            }
        }

        public async Task<AuthResponse> Register(RegisterRequest request)
        {
            try
            {
                // Validate thông tin cơ bản một lần nữa
                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Tên đăng nhập và mật khẩu không được để trống"
                    };
                }

                if (request.Password != request.ConfirmPassword)
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Mật khẩu xác nhận không khớp"
                    };
                }

                if (string.IsNullOrEmpty(request.FullName))
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Họ tên không được để trống"
                    };
                }

                // Kiểm tra tên đăng nhập đã tồn tại chưa
                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Tên đăng nhập đã tồn tại"
                    };
                }

                // Kiểm tra email đã tồn tại chưa
                if (!string.IsNullOrEmpty(request.Email) && await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Email đã tồn tại"
                    };
                }

                // Kiểm tra số điện thoại đã tồn tại chưa
                if (!string.IsNullOrEmpty(request.Phone) && await _context.Users.AnyAsync(u => u.Phone == request.Phone))
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Số điện thoại đã tồn tại"
                    };
                }

                var passwordHash = HashPassword(request.Password);

                var user = new User
                {
                    Username = request.Username,
                    Password = passwordHash,
                    FullName = request.FullName,
                    Dob = request.Dob,
                    Gender = request.Gender,
                    Address = request.Address?.Trim(),
                    Email = request.Email?.Trim(),
                    Phone = request.Phone?.Trim(),
                    Role = EnsureValidRole(request.Role)
                };

                // Thêm vào CSDL
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Tạo token JWT
                var token = GenerateJwtToken(user);

                // Trả về kết quả thành công
                return new AuthResponse
                {
                    Success = true,
                    Message = "Đăng ký thành công",
                    Token = token,
                    User = user
                };
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về thông báo lỗi
                Console.WriteLine($"Lỗi đăng ký: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return new AuthResponse
                {
                    Success = false,
                    Message = $"Lỗi khi đăng ký: {ex.Message}"
                };
            }
        }

        public async Task<OtpResponse> ForgotPassword(ForgotPasswordRequest request)
        {
            try
            {
                // Kiểm tra email có tồn tại trong hệ thống không
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                
                if (user == null)
                {
                    _logger.LogWarning($"Forgot password attempt with non-existent email: {request.Email}");
                    return new OtpResponse
                    {
                        Success = false,
                        Message = "Email không tồn tại trong hệ thống"
                    };
                }

                // Tạo mã OTP mới
                var otpCode = await _otpService.GenerateOtpForEmailAsync(request.Email);
                
                // Tạo nội dung email
                string emailSubject = "Mã xác thực đặt lại mật khẩu";
                string emailBody = $@"
                <html>
                <body>
                    <h2>Xin chào {user.FullName},</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Mã xác thực của bạn là: <strong>{otpCode.Code}</strong></p>
                    <p>Mã này có hiệu lực trong vòng 5 phút.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br/>Đội ngũ Virtual Advisor</p>
                </body>
                </html>";
                
                // Gửi email
                bool emailSent = await _emailService.SendEmailAsync(request.Email, emailSubject, emailBody, true);
                
                if (!emailSent)
                {
                    _logger.LogError($"Failed to send OTP email to {request.Email}");
                    return new OtpResponse
                    {
                        Success = false,
                        Message = "Không thể gửi email với mã xác thực. Vui lòng thử lại sau."
                    };
                }
                
                _logger.LogInformation($"OTP sent to {request.Email}");
                return new OtpResponse
                {
                    Success = true,
                    Message = "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã để tiếp tục."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ForgotPassword: {ex.Message}");
                return new OtpResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi. Vui lòng thử lại sau."
                };
            }
        }

        public async Task<OtpResponse> VerifyOtp(VerifyOtpRequest request)
        {
            try
            {
                // Kiểm tra mã OTP có hợp lệ không
                bool isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);
                
                if (!isValid)
                {
                    return new OtpResponse
                    {
                        Success = false,
                        Message = "Mã xác thực không đúng hoặc đã hết hạn"
                    };
                }
                
                return new OtpResponse
                {
                    Success = true,
                    Message = "Xác thực thành công. Vui lòng đặt mật khẩu mới."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in VerifyOtp: {ex.Message}");
                return new OtpResponse
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xác thực mã OTP"
                };
            }
        }

        public async Task<AuthResponse> ResetPassword(ResetPasswordRequest request)
        {
            try
            {
                // Xác thực mã OTP trước khi đặt lại mật khẩu
                bool isValid = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);
                
                if (!isValid)
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Mã xác thực không đúng hoặc đã hết hạn"
                    };
                }
                
                // Tìm kiếm người dùng theo email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                
                if (user == null)
                {
                    return new AuthResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng"
                    };
                }
                
                // Đặt lại mật khẩu
                user.Password = HashPassword(request.NewPassword);
                
                // Đánh dấu mã OTP đã sử dụng
                await _otpService.MarkOtpAsUsedAsync(request.Email, request.OtpCode);
                
                // Lưu thay đổi
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Password reset for user {user.Username}");
                return new AuthResponse
                {
                    Success = true,
                    Message = "Đặt lại mật khẩu thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ResetPassword: {ex.Message}");
                return new AuthResponse
                {
                    Success = false,
                    Message = $"Đã xảy ra lỗi: {ex.Message}"
                };
            }
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("uid", user.UserId.ToString()),
                new Claim("fullName", user.FullName ?? string.Empty)
            };

            // Thêm email vào claims nếu có
            if (!string.IsNullOrEmpty(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Email, user.Email));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSettings:Token").Value));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1),
                SigningCredentials = creds,
                IssuedAt = DateTime.Now,
                NotBefore = DateTime.Now
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        private string HashPassword(string password)
        {
            // Sử dụng plain text thay vì BCrypt
            return password;
        }

        private bool VerifyPasswordHash(string password, string storedHash)
        {
            // So sánh trực tiếp mật khẩu nhập vào với mật khẩu đã lưu
            return password == storedHash;
        }

        private UserRole EnsureValidRole(UserRole requestRole)
        {
            // Kiểm tra xem requestRole có nằm trong khoảng hợp lệ của enum không
            if (!Enum.IsDefined(typeof(UserRole), requestRole))
            {
                Console.WriteLine($"Vai trò không hợp lệ: {requestRole}, sử dụng mặc định: Student");
                return UserRole.Student; // Mặc định là Student nếu không hợp lệ
            }
            return requestRole;
        }
    }
} 