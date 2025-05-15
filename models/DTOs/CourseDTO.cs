using System;
using System.Collections.Generic;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class CourseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Type { get; set; } = "tuantu";
        public int LecturesCount { get; set; }
    }

    public class CourseCreateDTO
    {
        public string Name { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string Type { get; set; } = "tuantu";
    }

    public class CourseUpdateDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string Type { get; set; } = "tuantu";
    }

    public class CourseDetailDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Type { get; set; } = "tuantu";
        public int LecturesCount { get; set; }
        public List<SubjectDTO>? Subjects { get; set; }
    }

    public class CourseDto
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public int LectureCount { get; set; }
        public int StudentCount { get; set; }
    }
}