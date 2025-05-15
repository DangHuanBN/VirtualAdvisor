using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class LectureUploadRequestDTO
    {
        [Required(ErrorMessage = "Vui lòng chọn file")]
        public IFormFile File { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng chọn khóa học")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Cần có ID giảng viên")]
        public int TeacherId { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tiêu đề bài giảng")]
        [StringLength(255, ErrorMessage = "Tiêu đề không được vượt quá 255 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn loại bài giảng")]
        public string Type { get; set; } = string.Empty;

        [StringLength(10000, ErrorMessage = "Nội dung không được vượt quá 10000 ký tự")]
        public string Content { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "Số giờ tối đa phải lớn hơn 0")]
        public int? MaxHours { get; set; }
    }

    public class LectureUploadResponseDTO
    {
        public string Message { get; set; } = string.Empty;
        public int LectureId { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string? PdfFilePath { get; set; }
    }
} 