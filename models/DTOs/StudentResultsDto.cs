using System;
using System.Collections.Generic;

namespace VirtualAdvisorAPI.Models.DTOs
{
    public class StudentResultsDto
    {
        // Thông tin cơ bản về khóa học
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        
        // Thông tin tổng quan về kết quả học tập
        public decimal OverallProgress { get; set; }
        public decimal FinalGrade { get; set; }
        public string GradeLevel { get; set; } = string.Empty;
        public string CourseStatus { get; set; } = string.Empty;
        public int CompletedLessons { get; set; }
        public int TotalLessons { get; set; }
        
        // Chi tiết điểm theo từng bài học
        public List<LectureResultDto> LectureResults { get; set; } = new List<LectureResultDto>();
        
        // Danh sách các bài kiểm tra
        public List<AssessmentResultDto> AssessmentResults { get; set; } = new List<AssessmentResultDto>();
    }
    
    public class LectureResultDto
    {
        public int LectureId { get; set; }
        public string LectureCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Progress { get; set; }
        public decimal? Grade { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime? CompletionDate { get; set; }
    }
    
    public class AssessmentResultDto
    {
        public int LectureId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime? AssessmentDate { get; set; }
        public decimal Score { get; set; }
        public int CorrectAnswers { get; set; }
        public int TotalQuestions { get; set; }
        public int TimeSpentMinutes { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // quiz, exam
    }
} 