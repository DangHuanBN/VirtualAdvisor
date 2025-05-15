using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class FeedbackHistoryDTO
    {
        public int FeedbackId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public decimal Diem { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Type { get; set; }
        public int? Progress { get; set; }
        public bool? Status { get; set; }
    }
} 