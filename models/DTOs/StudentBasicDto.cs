using System;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentBasicDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public decimal OverallProgress { get; set; }
        public decimal AttendanceProgress { get; set; } 
        public decimal AssignmentProgress { get; set; }
    }
} 