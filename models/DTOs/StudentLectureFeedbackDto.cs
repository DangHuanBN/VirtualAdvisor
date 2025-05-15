using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentLectureFeedbackDto
    {
        [Required]
        public int LectureId { get; set; }
        
        [Required]
        [Range(1, 5, ErrorMessage = "Số sao phải từ 1 đến 5")]
        public int SoSao { get; set; }
        
        [Required]
        [StringLength(500, ErrorMessage = "Nội dung không được vượt quá 500 ký tự")]
        public string NoiDung { get; set; }
    }
} 