using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(int id);
        Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, string? role = null, string? status = null);
        Task<User> CreateUserAsync(User user, string password);
        Task<User> UpdateUserAsync(int userId, User user);
        Task<User> UpdateUserProfileAsync(int userId, User user);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> SoftDeleteUserAsync(int id);
        Task<bool> UpdateUserStatusAsync(int id, string status);
        Task<bool> ChangePasswordAsync(int id, string newPassword);
        Task<bool> UpdateUserRoleAsync(int id, UserRole role);
        Task<string?> GetUserPasswordAsync(int id);
    }
} 