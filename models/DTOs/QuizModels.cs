using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace VirtualAdvisorAPI.Models.DTOs
{
    /// <summary>
    /// Cấu trúc dữ liệu JSON của bài kiểm tra
    /// </summary>
    public class QuizData
    {
        [JsonPropertyName("lecture_id")]
        public int lecture_id { get; set; }

        [JsonPropertyName("questions")]
        public List<QuizQuestion> questions { get; set; } = new List<QuizQuestion>();
        
        [JsonPropertyName("timeLimit")]
        public int timeLimit { get; set; } = 0; // Thời gian làm bài (phút)
    }

    /// <summary>
    /// Cấu trúc câu hỏi trong bài kiểm tra
    /// </summary>
    public class QuizQuestion
    {
        [JsonPropertyName("question")]
        public string question { get; set; } = string.Empty;

        [JsonPropertyName("options")]
        public Dictionary<string, string> options { get; set; } = new Dictionary<string, string>();

        [JsonPropertyName("correct")]
        public string correct { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho việc nộp bài kiểm tra
    /// </summary>
    public class QuizSubmissionDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int LectureId { get; set; }

        [Required]
        public List<QuizAnswerDto> Answers { get; set; } = new List<QuizAnswerDto>();
        
        /// <summary>
        /// Đánh dấu đây có phải là lần làm lại hay không
        /// </summary>
        public bool IsRetaking { get; set; } = false;
    }

    /// <summary>
    /// DTO cho câu trả lời của người dùng
    /// </summary>
    public class QuizAnswerDto
    {
        [Required]
        public int QuestionIndex { get; set; }

        [Required]
        public string Answer { get; set; } = string.Empty;
    }

    /// <summary>
    /// Kết quả chi tiết cho từng câu hỏi
    /// </summary>
    public class QuestionResult
    {
        public int QuestionIndex { get; set; }
        public string Question { get; set; } = string.Empty;
        public string UserAnswer { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
} 