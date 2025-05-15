using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    [Table("notification")]
    public class Notification
    {
        [Key]
        [Column("notification_id")]
        public int NotificationId { get; set; }
        
        [Column("user_id")]
        public int UserId { get; set; }
        
        [Column("content")]
        public string Content { get; set; }
        
        [Column("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
        
        // Không lưu trong DB nhưng sử dụng trong mã
        [NotMapped]
        public bool IsRead { get; set; }
        
        [NotMapped]
        public string Type { get; set; }
    }
} 