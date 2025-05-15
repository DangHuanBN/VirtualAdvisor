using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Repositories;
using VirtualAdvisorAPI.Exceptions;

namespace VirtualAdvisorAPI.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UserService> _logger;

        public UserService(IUserRepository userRepository, ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            try
            {
                return await _userRepository.GetAllAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all users: {ex.Message}");
                throw;
            }
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            try
            {
                return await _userRepository.GetByIdAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting user by id {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, string? role = null, string? status = null)
        {
            try
            {
                return await _userRepository.SearchUsersAsync(searchTerm, role, status);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching users with term '{searchTerm}': {ex.Message}");
                throw;
            }
        }

        public async Task<User> CreateUserAsync(User user, string password)
        {
            try
            {
                // Kiểm tra trùng lặp
                if (await _userRepository.IsUserExistsAsync(user.Username, null))
                {
                    throw new InvalidOperationException("Tên đăng nhập đã tồn tại");
                }

                if (!string.IsNullOrEmpty(user.Email) && await _userRepository.IsEmailExistsAsync(user.Email, null))
                {
                    throw new InvalidOperationException("Email đã tồn tại");
                }

                if (!string.IsNullOrEmpty(user.Phone) && await _userRepository.IsPhoneExistsAsync(user.Phone, null))
                {
                    throw new InvalidOperationException("Số điện thoại đã tồn tại");
                }

                // Đảm bảo user luôn có trạng thái hợp lệ
                if (string.IsNullOrEmpty(user.Status))
                {
                    user.Status = "active";
                }

                // Set mật khẩu
                user.Password = password;

                return await _userRepository.AddAsync(user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user {user.Username}: {ex.Message}");
                throw;
            }
        }

        public async Task<User> UpdateUserAsync(int userId, User user)
        {
            // Kiểm tra xem người dùng có tồn tại không
            var existingUser = await _userRepository.GetByIdAsync(userId);
            if (existingUser == null)
                throw new NotFoundException("User not found");

            // Kiểm tra trùng lặp username, email và số điện thoại, nhưng loại trừ user hiện tại
            if (await _userRepository.IsUserExistsAsync(user.Username, userId))
                throw new DuplicateException("Username already exists");

            if (!string.IsNullOrEmpty(user.Email) && await _userRepository.IsEmailExistsAsync(user.Email, userId))
                throw new DuplicateException("Email already exists");

            if (!string.IsNullOrEmpty(user.Phone) && await _userRepository.IsPhoneExistsAsync(user.Phone, userId))
                throw new DuplicateException("Phone already exists");

            // Cập nhật thông tin người dùng
            existingUser.FullName = user.FullName;
            existingUser.Email = user.Email;
            existingUser.Phone = user.Phone;
            existingUser.Status = user.Status;

            await _userRepository.UpdateAsync(existingUser);
            return existingUser;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    return false;
                }

                await _userRepository.RemoveAsync(user);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SoftDeleteUserAsync(int id)
        {
            try
            {
                return await UpdateUserStatusAsync(id, "inactive");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error soft deleting user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateUserStatusAsync(int id, string status)
        {
            try
            {
                return await _userRepository.UpdateUserStatusAsync(id, status);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating status for user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> ChangePasswordAsync(int id, string newPassword)
        {
            try
            {
                return await _userRepository.ChangePasswordAsync(id, newPassword);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error changing password for user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateUserRoleAsync(int id, UserRole role)
        {
            try
            {
                return await _userRepository.UpdateUserRoleAsync(id, role);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating role for user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<string?> GetUserPasswordAsync(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                {
                    return null;
                }

                // Trả về mật khẩu từ CSDL
                return user.Password;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting password for user {id}: {ex.Message}");
                throw;
            }
        }

        public async Task<User> UpdateUserProfileAsync(int userId, User user)
        {
            // Kiểm tra xem người dùng có tồn tại không
            var existingUser = await _userRepository.GetByIdAsync(userId);
            if (existingUser == null)
                throw new NotFoundException("User not found");

            // Kiểm tra trùng lặp email và số điện thoại, nhưng loại trừ user hiện tại
            if (!string.IsNullOrEmpty(user.Email) && await _userRepository.IsEmailExistsAsync(user.Email, userId))
                throw new DuplicateException("Email already exists");

            if (!string.IsNullOrEmpty(user.Phone) && await _userRepository.IsPhoneExistsAsync(user.Phone, userId))
                throw new DuplicateException("Phone already exists");

            // Cập nhật thông tin người dùng (chỉ các thông tin cá nhân)
            existingUser.FullName = user.FullName;
            existingUser.Dob = user.Dob;
            existingUser.Gender = user.Gender;
            existingUser.Address = user.Address;
            existingUser.Email = user.Email;
            existingUser.Phone = user.Phone;

            await _userRepository.UpdateAsync(existingUser);
            return existingUser;
        }
    }
} 