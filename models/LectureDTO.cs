using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models
{
    // DTO cho upload bài giảng
    public class UploadLectureDTO
    {
        [Required(ErrorMessage = "Vui lòng chọn môn học")]
        public int SubjectId { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn khóa học")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tiêu đề bài giảng")]
        [StringLength(255, ErrorMessage = "Tiêu đề không được vượt quá 255 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mô tả bài giảng")]
        public string Content { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn loại bài giảng")]
        public string Type { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn file đính kèm")]
        public IFormFile File { get; set; } = null!;
        
        [Range(1, int.MaxValue, ErrorMessage = "Số giờ tối đa phải lớn hơn 0")]
        public int? MaxHours { get; set; }
    }

    // DTO cho kết quả trả về sau khi upload
    public class LectureResponseDTO
    {
        public int LectureId { get; set; }
        public int CourseId { get; set; }
        public int TeacherId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Attachment { get; set; } = string.Empty;
        public string PdfAttachment { get; set; } = string.Empty;
        public DateTime UploadDate { get; set; }
        public string LectureType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? MaxHours { get; set; }
        
        // Thêm thông tin khóa học và môn học
        public string CourseName { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        
        // Thêm thông tin về loại khóa học (tuantu/tudo)
        public string CourseType { get; set; } = string.Empty;
        
        // Thêm đường dẫn đến file JSON cho bài kiểm tra/bài thi
        public string JsonPath { get; set; } = string.Empty;
    }

    // DTO để lọc bài giảng
    public class LectureFilterDTO
    {
        public string? SearchText { get; set; }
        public int? SubjectId { get; set; }
        public int? CourseId { get; set; }
        public string? Type { get; set; }
        public string? SortBy { get; set; } // "recent" hoặc "popular"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10; // Mặc định 10 bài giảng trên mỗi trang
    }

    // Lớp hỗ trợ phân trang
    public class PaginatedResponse<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasPreviousPage => PageNumber > 1;
        public bool HasNextPage => PageNumber < TotalPages;
    }

    // DTO để xóa bài giảng
    public class DeleteLectureDTO
    {
        [Required]
        public int Id { get; set; }
    }
} 