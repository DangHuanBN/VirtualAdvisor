using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class LectureDto
    {
        public int LectureId { get; set; }
        public string LectureName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int LectureOrder { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Lưu trữ loại bài học (baigiang, baikiemtra, baithi)
        public int Duration { get; set; } // Thời lượng tính bằng giây
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
    }
} 