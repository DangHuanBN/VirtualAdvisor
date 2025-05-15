using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class SubjectDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Credits { get; set; }
        public int CourseCount { get; set; }
    }

    public class SubjectCreateDTO
    {
        public string Name { get; set; } = string.Empty;
        public int Credits { get; set; }
    }

    public class SubjectUpdateDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Credits { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }
}
