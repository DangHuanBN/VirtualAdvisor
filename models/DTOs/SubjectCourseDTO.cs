using System.Collections.Generic;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class SubjectCourseDTO
    {
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public List<CourseItemDTO> Courses { get; set; } = new List<CourseItemDTO>();
    }

    public class CourseItemDTO
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public int StudentCount { get; set; }
        public int LectureCount { get; set; }
    }

    public class SubjectCoursesResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<SubjectCourseDTO> Data { get; set; } = new List<SubjectCourseDTO>();
    }
} 