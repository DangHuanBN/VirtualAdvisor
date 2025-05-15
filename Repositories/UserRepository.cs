using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm, string? role = null, string? status = null)
        {
            var query = _context.Users.AsQueryable();

            // Tìm kiếm theo từ khóa (fullname, email, phone)
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(u => 
                    u.FullName.ToLower().Contains(searchTerm) || 
                    (u.Email != null && u.Email.ToLower().Contains(searchTerm)) || 
                    (u.Phone != null && u.Phone.Contains(searchTerm)));
            }

            // Lọc theo vai trò
            if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var userRole))
            {
                query = query.Where(u => u.Role == userRole);
            }

            // Lọc theo trạng thái (active/inactive)
            if (!string.IsNullOrWhiteSpace(status))
            {
                bool isActive = status.ToLower() == "active";
                query = query.Where(u => (isActive ? u.Status == "active" : u.Status == "inactive"));
            }

            return await query.ToListAsync();
        }

        public async Task<bool> UpdateUserStatusAsync(int userId, string status)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Password = newPassword;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserRoleAsync(int userId, UserRole role)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Role = role;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUserExistsAsync(string username, int? excludeUserId = null)
        {
            var query = _context.Users.Where(u => u.Username.ToLower() == username.ToLower());
            
            // Nếu có ID cần loại trừ (thường là ID của user đang được cập nhật)
            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.UserId != excludeUserId.Value);
            }
            
            return await query.AnyAsync();
        }

        public async Task<bool> IsEmailExistsAsync(string email, int? excludeUserId = null)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;
            
            var query = _context.Users.Where(u => u.Email != null && u.Email.ToLower() == email.ToLower());
            
            // Nếu có ID cần loại trừ (thường là ID của user đang được cập nhật)
            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.UserId != excludeUserId.Value);
            }
            
            return await query.AnyAsync();
        }

        public async Task<bool> IsPhoneExistsAsync(string phone, int? excludeUserId = null)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return false;
            
            var query = _context.Users.Where(u => u.Phone != null && u.Phone == phone);
            
            // Nếu có ID cần loại trừ (thường là ID của user đang được cập nhật)
            if (excludeUserId.HasValue)
            {
                query = query.Where(u => u.UserId != excludeUserId.Value);
            }
            
            return await query.AnyAsync();
        }
    }
} 