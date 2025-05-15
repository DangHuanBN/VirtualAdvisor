using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public interface IChatRepository
    {
        Task<List<Chat>> GetChatHistoryByUserIdAsync(int userId, int limit = 100, int page = 1);
        Task<Chat> SaveChatMessageAsync(Chat chatMessage);
        Task<bool> DeleteChatHistoryByUserIdAsync(int userId);
    }
} 