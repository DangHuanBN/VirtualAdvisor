using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    [Table("studytracking")]
    public class StudyTracking
    {
        [Key]
        [Column("tracking_id")]
        public int TrackingId { get; set; }
        
        [Column("user_id")]
        public int UserId { get; set; }
        
        [Column("lecture_id")]
        public int LectureId { get; set; }
        
        [Column("progress")]
        public decimal Progress { get; set; }
        
        [Column("status")]
        public string Status { get; set; } = string.Empty;
        
        [Column("start_date")]
        public DateTime? StartDate { get; set; }
        
        [Column("end_date")]
        public DateTime? EndDate { get; set; }
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        [ForeignKey("LectureId")]
        public Lecture? Lecture { get; set; }
    }
} 