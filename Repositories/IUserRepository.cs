using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, string? role = null, string? status = null);
        Task<bool> UpdateUserStatusAsync(int userId, string status);
        Task<bool> ChangePasswordAsync(int userId, string newPassword);
        Task<bool> UpdateUserRoleAsync(int userId, UserRole role);
        Task<bool> IsUserExistsAsync(string username, int? excludeUserId = null);
        Task<bool> IsEmailExistsAsync(string email, int? excludeUserId = null);
        Task<bool> IsPhoneExistsAsync(string phone, int? excludeUserId = null);
    }
} 