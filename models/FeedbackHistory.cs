using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    [Table("feedbackHistory")]
    public class FeedbackHistory
    {
        [Key]
        [Column("feedback_id")]
        public int FeedbackId { get; set; }
        
        [Required]
        [Column("user_id")]
        public int UserId { get; set; }
        
        [Required]
        [Column("content")]
        [StringLength(500)]
        public string Content { get; set; }
        
        [Required]
        [Column("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [Required]
        [Column("diem")]
        public decimal Diem { get; set; }
    }
} 