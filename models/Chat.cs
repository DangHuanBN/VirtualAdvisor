using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    [Table("chathistory")]
    public class Chat
    {
        [Key]
        [Column("chat_id")]
        public int ChatId { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Column("message")]
        public string Message { get; set; }

        [Column("timestamp")]
        public DateTime Timestamp { get; set; }

        // Thuộc tính không ánh xạ vào CSDL (chỉ sử dụng trong code)
        [NotMapped]
        public bool IsBot { get; set; } = false;
    }
} 