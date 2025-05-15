using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Services
{
    public interface IOtpService
    {
        Task<OtpCode> GenerateOtpForEmailAsync(string email);
        Task<bool> VerifyOtpAsync(string email, string otpCode);
        Task<bool> MarkOtpAsUsedAsync(string email, string otpCode);
    }

    public class OtpService : IOtpService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<OtpService> _logger;
        private readonly Random _random;
        private const string OTP_CACHE_KEY_PREFIX = "OTP_";

        public OtpService(IMemoryCache cache, ILogger<OtpService> logger)
        {
            _cache = cache;
            _logger = logger;
            _random = new Random();
        }

        public Task<OtpCode> GenerateOtpForEmailAsync(string email)
        {
            try
            {
                // Tạo mã OTP mới gồm 6 chữ số
                string otpCode = GenerateRandomOtp();
                
                // Thiết lập thời hạn OTP là 5 phút
                var expiryTime = DateTime.UtcNow.AddMinutes(5);
                
                // Tạo bản ghi OTP mới
                var newOtp = new OtpCode
                {
                    Id = 0, // Không quan trọng vì lưu trong memory
                    Email = email,
                    Code = otpCode,
                    ExpiryTime = expiryTime,
                    IsUsed = false
                };
                
                // Vô hiệu hóa OTP cũ (nếu có)
                string cacheKey = OTP_CACHE_KEY_PREFIX + email;
                _cache.Remove(cacheKey);
                
                // Lưu OTP mới vào cache với thời hạn 5 phút
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
                
                _cache.Set(cacheKey, newOtp, cacheEntryOptions);
                
                _logger.LogInformation($"Generated OTP for {email}: {otpCode}, expires at {expiryTime}");
                return Task.FromResult(newOtp);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating OTP: {ex.Message}");
                throw;
            }
        }

        public Task<bool> VerifyOtpAsync(string email, string otpCode)
        {
            try
            {
                // Lấy mã OTP từ cache
                string cacheKey = OTP_CACHE_KEY_PREFIX + email;
                if (!_cache.TryGetValue(cacheKey, out OtpCode otp))
                {
                    _logger.LogWarning($"No OTP found for {email}");
                    return Task.FromResult(false);
                }
                
                // Kiểm tra mã OTP
                if (otp.IsUsed)
                {
                    _logger.LogWarning($"OTP for {email} is already used");
                    return Task.FromResult(false);
                }
                
                if (otp.ExpiryTime < DateTime.UtcNow)
                {
                    _logger.LogWarning($"OTP for {email} has expired");
                    return Task.FromResult(false);
                }
                
                if (otp.Code != otpCode)
                {
                    _logger.LogWarning($"Invalid OTP for {email}");
                    return Task.FromResult(false);
                }
                
                _logger.LogInformation($"OTP verified successfully for {email}");
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying OTP: {ex.Message}");
                return Task.FromResult(false);
            }
        }

        public Task<bool> MarkOtpAsUsedAsync(string email, string otpCode)
        {
            try
            {
                // Lấy mã OTP từ cache
                string cacheKey = OTP_CACHE_KEY_PREFIX + email;
                if (!_cache.TryGetValue(cacheKey, out OtpCode otp))
                {
                    return Task.FromResult(false);
                }
                
                // Kiểm tra mã OTP
                if (otp.Code != otpCode)
                {
                    return Task.FromResult(false);
                }
                
                // Đánh dấu đã sử dụng
                otp.IsUsed = true;
                
                // Cập nhật lại vào cache
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
                
                _cache.Set(cacheKey, otp, cacheEntryOptions);
                
                _logger.LogInformation($"OTP marked as used for {email}");
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking OTP as used: {ex.Message}");
                return Task.FromResult(false);
            }
        }

        private string GenerateRandomOtp()
        {
            // Tạo số ngẫu nhiên 6 chữ số
            int otpNumber = _random.Next(100000, 999999);
            return otpNumber.ToString();
        }
    }
} 