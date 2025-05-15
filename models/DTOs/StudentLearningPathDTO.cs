using System;
using System.Collections.Generic;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentLearningPathDTO
    {
        public int PathId { get; set; }
        public int CourseId { get; set; }
        public string PathName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public decimal TotalProgress { get; set; }
        public string Status { get; set; } = string.Empty; // "hoàn thành", "đang học", "chưa học"
    }

    public class StudentLearningPathDetailDTO
    {
        public int PathId { get; set; }
        public string PathName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public decimal TotalProgress { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<LearningPathModuleDTO> Modules { get; set; } = new List<LearningPathModuleDTO>();
    }

    public class LearningPathModuleDTO
    {
        public string ModuleName { get; set; } = string.Empty;
        public List<LectureProgressDTO> Lectures { get; set; } = new List<LectureProgressDTO>();
    }

    public class LectureProgressDTO
    {
        public int LectureId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "baigiang", "baikiemtra", "baithi"
        public int OrderNumber { get; set; }
        public decimal Progress { get; set; }
        public string Status { get; set; } = string.Empty; // "hoanthanh", "danghoc", "chuahoc", "khoa"
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class CourseRecommendationDTO
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedWeeks { get; set; }
        public decimal Rating { get; set; }
        public string Icon { get; set; } = string.Empty; // CSS class for icon
    }
} 