using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentProgressDto
    {
        public int StudentId { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public decimal OverallProgress { get; set; }
        public decimal AttendanceProgress { get; set; }
        public decimal AssignmentProgress { get; set; }
    }
} 