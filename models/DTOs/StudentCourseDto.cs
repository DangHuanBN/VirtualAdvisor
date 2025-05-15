using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentCourseDto
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public decimal OverallProgress { get; set; }
        public decimal FinalGrade { get; set; }
        public string GradeLevel { get; set; } = string.Empty;
        public string CourseStatus { get; set; } = string.Empty;
        public DateTime? EnrollmentDate { get; set; }
    }
} 