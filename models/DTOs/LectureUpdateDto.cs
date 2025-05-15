using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class LectureUpdateDto
    {
        [Required(ErrorMessage = "Tiêu đề không được để trống")]
        [StringLength(255, ErrorMessage = "Tiêu đề không được vượt quá 255 ký tự")]
        public string Title { get; set; } = string.Empty;

        [StringLength(5000, ErrorMessage = "Nội dung không được vượt quá 5000 ký tự")]
        public string Content { get; set; } = string.Empty;

        public string? Attachment { get; set; }

        [Required(ErrorMessage = "Loại bài giảng không được để trống")]
        [RegularExpression("^(baigiang|baikiemtra|baithi)$", ErrorMessage = "Loại bài giảng phải là một trong các giá trị: baigiang, baikiemtra, baithi")]
        public string Type { get; set; } = string.Empty;

        [Range(0.1, float.MaxValue, ErrorMessage = "Số giờ tối đa phải lớn hơn 0")]
        public float? MaxHours { get; set; }
    }
} 