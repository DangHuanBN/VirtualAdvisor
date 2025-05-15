using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Repositories
{
    public class ChatRepository : IChatRepository
    {
        private readonly AppDbContext _context;

        public ChatRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Chat>> GetChatHistoryByUserIdAsync(int userId, int limit = 100, int page = 1)
        {
            // Tính toán số lượng bản ghi bỏ qua
            int skip = (page - 1) * limit;

            return await _context.Chats
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.Timestamp)
                .Skip(skip)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<Chat> SaveChatMessageAsync(Chat chatMessage)
        {
            if (chatMessage.Timestamp == default)
            {
                chatMessage.Timestamp = DateTime.Now;
            }

            await _context.Chats.AddAsync(chatMessage);
            await _context.SaveChangesAsync();
            return chatMessage;
        }

        public async Task<bool> DeleteChatHistoryByUserIdAsync(int userId)
        {
            var chatMessages = await _context.Chats
                .Where(c => c.UserId == userId)
                .ToListAsync();

            if (chatMessages.Any())
            {
                _context.Chats.RemoveRange(chatMessages);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }
    }
} 