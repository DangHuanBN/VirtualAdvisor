using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface IChatbotService
    {
        Task<List<Chat>> GetChatHistoryByUserIdAsync(int userId, int limit = 100, int page = 1);
        Task<Chat> SaveUserMessageAsync(int userId, string message);
        Task<Chat> SaveBotMessageAsync(int userId, string message);
        Task<Chat> SaveConversationMessageAsync(int userId, string question, string answer);
        Task<bool> DeleteChatHistoryByUserIdAsync(int userId);
    }
} 