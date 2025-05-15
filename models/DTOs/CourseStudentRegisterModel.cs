using System.ComponentModel.DataAnnotations;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class CourseStudentRegisterModel
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int CourseId { get; set; }
    }

    public class AvailableCourseDto
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? StudentCount { get; set; }
        public int? LectureCount { get; set; }
    }
} 