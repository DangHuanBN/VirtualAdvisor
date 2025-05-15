using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Repositories;

namespace VirtualAdvisorAPI.Services
{
    public class ChatbotService : IChatbotService
    {
        private readonly IChatRepository _chatRepository;

        public ChatbotService(IChatRepository chatRepository)
        {
            _chatRepository = chatRepository;
        }

        public async Task<List<Chat>> GetChatHistoryByUserIdAsync(int userId, int limit = 100, int page = 1)
        {
            return await _chatRepository.GetChatHistoryByUserIdAsync(userId, limit, page);
        }

        public async Task<Chat> SaveUserMessageAsync(int userId, string message)
        {
            var chatMessage = new Chat
            {
                UserId = userId,
                Message = message,
                IsBot = false,
                Timestamp = DateTime.Now
            };

            return await _chatRepository.SaveChatMessageAsync(chatMessage);
        }

        public async Task<Chat> SaveBotMessageAsync(int userId, string message)
        {
            var chatMessage = new Chat
            {
                UserId = userId,
                Message = message,
                IsBot = true,
                Timestamp = DateTime.Now
            };

            return await _chatRepository.SaveChatMessageAsync(chatMessage);
        }

        public async Task<Chat> SaveConversationMessageAsync(int userId, string question, string answer)
        {
            string formattedMessage = $"câu hỏi: {question} ____ câu trả lời: {answer}";
            
            var chatMessage = new Chat
            {
                UserId = userId,
                Message = formattedMessage,
                IsBot = true,
                Timestamp = DateTime.Now
            };

            return await _chatRepository.SaveChatMessageAsync(chatMessage);
        }

        public async Task<bool> DeleteChatHistoryByUserIdAsync(int userId)
        {
            return await _chatRepository.DeleteChatHistoryByUserIdAsync(userId);
        }
    }
} 