using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class ProgressDetailDto
    {
        public int LectureId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Progress { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
} 