using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudyTrackingUpdateDto
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int LectureId { get; set; }
        
        [Required]
        [Range(0, 100, ErrorMessage = "Tiến độ phải nằm trong khoảng từ 0 đến 100")]
        public decimal Progress { get; set; }
    }
} 