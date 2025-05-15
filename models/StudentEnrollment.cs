using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VirtualAdvisorAPI.Models
{
    [Table("studentenrollment")]
    public class StudentEnrollment
    {
        [Column("user_id")]
        public int UserId { get; set; }
        
        [Column("course_id")]
        public int CourseId { get; set; }
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }
    }
} 