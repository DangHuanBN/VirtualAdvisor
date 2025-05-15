using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Alerts;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuizController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QuizController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy câu hỏi của bài kiểm tra/bài thi dựa trên lecture_id
        /// </summary>
        [HttpGet("{lectureId}")]
        public IActionResult GetQuizQuestions(int lectureId)
        {
            try
            {
                // Kiểm tra bài giảng tồn tại - sử dụng Include để đảm bảo load đầy đủ thông tin
                var lecture = _context.Lectures
                    .AsNoTracking()
                    .FirstOrDefault(l => l.LectureId == lectureId);
                
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng có ID {lectureId}" });
                }

                // Kiểm tra bài giảng có phải loại bài kiểm tra hoặc bài thi không
                if (lecture.Type != "baikiemtra" && lecture.Type != "baithi")
                {
                    return BadRequest(new { success = false, message = $"Bài giảng ID {lectureId} không phải là bài kiểm tra hoặc bài thi" });
                }

                // Đường dẫn tới file JSON
                string jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training", "json", $"test_lecture_{lectureId}.json");

                // Kiểm tra file tồn tại
                if (!System.IO.File.Exists(jsonFilePath))
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy dữ liệu bài kiểm tra cho bài giảng ID {lectureId}" });
                }

                // Đọc nội dung file JSON
                string jsonContent = System.IO.File.ReadAllText(jsonFilePath);
                var quizData = JsonSerializer.Deserialize<QuizData>(jsonContent);

                // Lấy thông tin thời gian làm bài trực tiếp từ CSDL
                // Thực hiện truy vấn SQL trực tiếp để đảm bảo lấy đúng giá trị MaxHours
                float? maxHours = null;
                using (var command = _context.Database.GetDbConnection().CreateCommand())
                {
                    command.CommandText = $"SELECT maxhours FROM lecture WHERE lecture_id = {lectureId}";
                    _context.Database.OpenConnection();
                    using (var result = command.ExecuteReader())
                    {
                        if (result.Read())
                        {
                            maxHours = result.IsDBNull(0) ? null : (float?)result.GetFloat(0);
                        }
                    }
                }

                // Tính thời gian làm bài
                int timeLimit = 18; // Mặc định 18 phút
                
                // Nếu có giá trị MaxHours từ SQL trực tiếp
                if (maxHours.HasValue && maxHours.Value > 0)
                {
                    timeLimit = (int)(maxHours.Value * 60); // Chuyển từ giờ sang phút
                }
                // Hoặc nếu có giá trị MaxHours từ model
                else if (lecture.MaxHours.HasValue && lecture.MaxHours.Value > 0)
                {
                    timeLimit = (int)(lecture.MaxHours.Value * 60);
                }
                
                return Ok(new { 
                    success = true, 
                    data = quizData,
                    timeLimit = timeLimit,
                    lectureInfo = new {
                        id = lecture.LectureId,
                        title = lecture.Title,
                        maxHours = lecture.MaxHours,
                        maxHoursFromSql = maxHours
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái hoàn thành bài kiểm tra của người dùng
        /// </summary>
        [HttpGet("{lectureId}/status/{userId}")]
        public async Task<IActionResult> CheckQuizStatus(int lectureId, int userId)
        {
            try
            {
                // Kiểm tra người dùng tồn tại
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy người dùng với ID {userId}" });
                }

                // Kiểm tra bài giảng tồn tại
                var lecture = await _context.Lectures.FindAsync(lectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {lectureId}" });
                }

                // Kiểm tra xem người dùng đã từng làm bài kiểm tra này chưa
                var tracking = await _context.StudyTrackings
                    .FirstOrDefaultAsync(st => st.UserId == userId && st.LectureId == lectureId);

                bool hasCompleted = tracking != null && tracking.Progress > 0;

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        hasCompleted,
                        progress = tracking?.Progress ?? 0,
                        status = tracking?.Status ?? "chuahoanthanh",
                        completionDate = tracking?.EndDate
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lưu kết quả bài kiểm tra
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitQuiz([FromBody] QuizSubmissionDto submission)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
                }

                // Kiểm tra user tồn tại
                var user = await _context.Users.FindAsync(submission.UserId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy người dùng với ID {submission.UserId}" });
                }

                // Kiểm tra bài giảng tồn tại
                var lecture = await _context.Lectures.FindAsync(submission.LectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {submission.LectureId}" });
                }

                // Kiểm tra xem người dùng đã làm bài này chưa
                var existingTracking = await _context.StudyTrackings
                    .FirstOrDefaultAsync(st => st.UserId == submission.UserId && st.LectureId == submission.LectureId);

                bool isFirstAttempt = (existingTracking == null || existingTracking.Progress <= 0);
                bool isRetaking = submission.IsRetaking || !isFirstAttempt;

                // Đường dẫn tới file JSON
                string jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training", "json", $"test_lecture_{submission.LectureId}.json");

                // Kiểm tra file tồn tại
                if (!System.IO.File.Exists(jsonFilePath))
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy dữ liệu bài kiểm tra cho bài giảng ID {submission.LectureId}" });
                }

                // Đọc nội dung file JSON
                string jsonContent = System.IO.File.ReadAllText(jsonFilePath);
                var quizData = JsonSerializer.Deserialize<QuizData>(jsonContent);

                // Kiểm tra số câu trả lời
                if (submission.Answers.Count != quizData.questions.Count)
                {
                    return BadRequest(new { success = false, message = "Số lượng câu trả lời không khớp với số lượng câu hỏi" });
                }

                // Tính điểm
                int correctAnswers = 0;
                var detailedResults = new List<QuestionResult>();

                for (int i = 0; i < quizData.questions.Count; i++)
                {
                    var question = quizData.questions[i];
                    var userAnswer = submission.Answers.FirstOrDefault(a => a.QuestionIndex == i)?.Answer ?? "";
                    bool isCorrect = userAnswer == question.correct;

                    if (isCorrect)
                    {
                        correctAnswers++;
                    }

                    detailedResults.Add(new QuestionResult
                    {
                        QuestionIndex = i,
                        Question = question.question,
                        UserAnswer = userAnswer,
                        CorrectAnswer = question.correct,
                        IsCorrect = isCorrect
                    });
                }

                // Tính điểm theo thang 10
                decimal score = quizData.questions.Count > 0 
                    ? Math.Round((decimal)correctAnswers / quizData.questions.Count * 10, 2) 
                    : 0;

                // Tính tiến độ học tập
                decimal progress = (decimal)correctAnswers / quizData.questions.Count * 100;

                // Lưu câu trả lời của sinh viên vào file JSON
                try
                {
                    // Tạo thư mục nếu chưa tồn tại
                    string answersDir = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training", "json", "answers");
                    Directory.CreateDirectory(answersDir);
                    
                    // Tạo tên file
                    string answersFileName = $"user_{submission.UserId}_lecture_{submission.LectureId}.json";
                    string answersFilePath = Path.Combine(answersDir, answersFileName);
                    
                    // Tạo đối tượng lưu trữ
                    var answersData = new
                    {
                        userId = submission.UserId,
                        lectureId = submission.LectureId,
                        timestamp = DateTime.Now,
                        correctAnswers,
                        totalQuestions = quizData.questions.Count,
                        score,
                        answers = submission.Answers.ToDictionary(a => a.QuestionIndex.ToString(), a => a.Answer),
                        wrong_keywords = new List<string>() // Khởi tạo trống, sẽ được cập nhật bởi module test_alerts
                    };
                    
                    // Lưu vào file
                    string answersJson = JsonSerializer.Serialize(answersData, new JsonSerializerOptions
                    {
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    });
                    
                    System.IO.File.WriteAllText(answersFilePath, answersJson, System.Text.Encoding.UTF8);
                }
                catch (Exception ex)
                {
                    // Chỉ ghi log lỗi, không ảnh hưởng đến quá trình lưu kết quả bài kiểm tra
                    Console.WriteLine($"ERROR - Lỗi khi lưu file câu trả lời: {ex.Message}");
                }

                // Chỉ cập nhật tiến độ (StudyTracking) khi là lần làm đầu tiên
                if (!isRetaking)
                {
                    if (existingTracking == null)
                    {
                        // Tạo mới nếu chưa có
                        existingTracking = new StudyTracking
                        {
                            UserId = submission.UserId,
                            LectureId = submission.LectureId,
                            Progress = progress,
                            Status = "hoanthanh", // Luôn hoàn thành sau khi làm bài lần đầu
                            StartDate = DateTime.Now,
                            EndDate = DateTime.Now
                        };
                        _context.StudyTrackings.Add(existingTracking);
                    }
                    else
                    {
                        // Cập nhật StudyTracking hiện có khi là lần làm đầu tiên
                        existingTracking.Progress = progress;
                        existingTracking.Status = "hoanthanh"; // Luôn hoàn thành sau khi làm bài lần đầu
                        existingTracking.EndDate = DateTime.Now;
                    }

                    await _context.SaveChangesAsync();
                    
                    // Tạo cảnh báo học tập cho sinh viên
                    try
                    {
                        // Chuyển đổi đáp án từ DTO sang Dictionary để gọi Python module
                        var answers = submission.Answers.ToDictionary(a => a.QuestionIndex.ToString(), a => a.Answer);
                        
                        // Gọi module cảnh báo học tập
                        await TestAlertIntegration.GenerateTestAlerts(
                            submission.UserId,
                            submission.LectureId,
                            progress,
                            answers
                        );
                    }
                    catch (Exception ex)
                    {
                        // Chỉ ghi log lỗi, không ảnh hưởng đến quá trình lưu kết quả bài kiểm tra
                        Console.WriteLine($"ERROR - Lỗi khi tạo cảnh báo học tập: {ex.Message}");
                    }
                }
                else
                {
                }

                // Trả về kết quả
                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        totalQuestions = quizData.questions.Count,
                        correctAnswers,
                        score,
                        progress,
                        detailedResults,
                        isRetaking,
                        savedToDatabase = !isRetaking
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }

        /// <summary>
        /// Tạo cảnh báo học tập sau khi sinh viên hoàn thành bài kiểm tra hoặc bài thi
        /// </summary>
        [HttpPost("alerts")]
        public async Task<IActionResult> GenerateTestAlerts([FromBody] TestAlertDto model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
                }

                // Kiểm tra user tồn tại
                var user = await _context.Users.FindAsync(model.UserId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy người dùng với ID {model.UserId}" });
                }

                // Kiểm tra bài giảng tồn tại
                var lecture = await _context.Lectures.FindAsync(model.LectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {model.LectureId}" });
                }

                // Kiểm tra bài giảng có phải loại bài kiểm tra hoặc bài thi không
                if (lecture.Type != "baikiemtra" && lecture.Type != "baithi")
                {
                    return BadRequest(new { success = false, message = $"Bài giảng ID {model.LectureId} không phải là bài kiểm tra hoặc bài thi" });
                }

                // Chuyển đổi đáp án từ DTO sang Dictionary để gọi Python module
                var answers = model.Answers.ToDictionary(a => a.QuestionIndex.ToString(), a => a.Answer);

                // Gọi module cảnh báo học tập
                bool result = await TestAlertIntegration.GenerateTestAlerts(
                    model.UserId,
                    model.LectureId,
                    model.Progress,
                    answers
                );

                return Ok(new
                {
                    success = result,
                    message = result 
                        ? "Đã tạo cảnh báo học tập thành công" 
                        : "Có lỗi khi tạo cảnh báo học tập"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }
        
        /// <summary>
        /// Tạo cảnh báo học tập tự động sau khi sinh viên nộp bài kiểm tra
        /// </summary>
        [HttpPost("testalert")]
        public async Task<IActionResult> GenerateTestAlertsAfterSubmit([FromBody] TestAlertSubmitDto model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
                }

                // Kiểm tra user tồn tại
                var user = await _context.Users.FindAsync(model.UserId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy người dùng với ID {model.UserId}" });
                }

                // Kiểm tra bài giảng tồn tại
                var lecture = await _context.Lectures.FindAsync(model.LectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {model.LectureId}" });
                }

                try
                {
                    // Tạo cảnh báo học tập
                    // Đọc file câu trả lời đã lưu để lấy dữ liệu về đáp án
                    string answersDir = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training", "json", "answers");
                    string answersFileName = $"user_{model.UserId}_lecture_{model.LectureId}.json";
                    string answersFilePath = Path.Combine(answersDir, answersFileName);
                    
                    // Đảm bảo thư mục tồn tại
                    if (!Directory.Exists(answersDir))
                    {
                        Directory.CreateDirectory(answersDir);
                    }
                    
                    // Nếu file không tồn tại, thử tạo một file tạm để test
                    if (!System.IO.File.Exists(answersFilePath))
                    {
                        // Tạo file câu trả lời mẫu cho testing
                        var sampleAnswers = new Dictionary<string, string>();
                        for (int i = 0; i < 5; i++)
                        {
                            sampleAnswers.Add(i.ToString(), "A");
                        }
                        
                        // Gọi Module Python với câu trả lời mẫu
                        bool resultSample = await TestAlertIntegration.GenerateTestAlerts(
                            model.UserId,
                            model.LectureId,
                            model.Progress,
                            sampleAnswers
                        );
                        
                        if (resultSample)
                        {
                            // Lấy thông báo cảnh báo học tập mới nhất từ database
                            var notificationSample = await _context.Notifications
                                .Where(n => n.UserId == model.UserId)
                                .OrderByDescending(n => n.Timestamp)
                                .FirstOrDefaultAsync();
                            
                            string alertSample = notificationSample?.Content ?? "Không có dữ liệu cảnh báo";
                            
                            return Ok(new
                            {
                                success = true,
                                data = new
                                {
                                    alert = alertSample,
                                    created = resultSample
                                },
                                message = "Đã tạo cảnh báo học tập dựa trên dữ liệu mẫu"
                            });
                        }
                        else
                        {
                            return Ok(new 
                            { 
                                success = false, 
                                message = "Không thể tạo cảnh báo học tập với dữ liệu mẫu" 
                            });
                        }
                    }
                    
                    // Đọc file JSON câu trả lời
                    string answersJson = System.IO.File.ReadAllText(answersFilePath);
                    var answersData = JsonSerializer.Deserialize<AnswersData>(answersJson);
                    
                    if (answersData == null)
                    {
                        return BadRequest(new { success = false, message = $"Dữ liệu câu trả lời không hợp lệ" });
                    }
                    
                    // Chuyển đổi câu trả lời từ JSON sang Dictionary
                    var answers = answersData.answers;
                    
                    // Gọi Python module để tạo cảnh báo
                    string alert = string.Empty;
                    bool result = false;
                    
                    try
                    {
                        // Gọi module cảnh báo học tập
                        result = await TestAlertIntegration.GenerateTestAlerts(
                            model.UserId,
                            model.LectureId,
                            model.Progress,
                            answers
                        );
                        
                        if (result)
                        {
                            // Lấy thông báo cảnh báo học tập mới nhất từ database
                            var notification = await _context.Notifications
                                .Where(n => n.UserId == model.UserId)
                                .OrderByDescending(n => n.Timestamp)
                                .FirstOrDefaultAsync();
                            
                            if (notification != null)
                            {
                                alert = notification.Content;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Lỗi khi tạo cảnh báo học tập: {ex.Message}");
                        return Ok(new { success = false, message = $"Lỗi khi tạo cảnh báo: {ex.Message}" });
                    }
                    
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            alert = alert,
                            created = result
                        },
                        message = result ? "Đã tạo cảnh báo học tập thành công" : "Không có cảnh báo học tập"
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi khi tạo cảnh báo học tập: {ex.Message}");
                    return Ok(new { success = false, message = $"Lỗi khi tạo cảnh báo: {ex.Message}" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi server: {ex.Message}" });
            }
        }
    }

    /// <summary>
    /// DTO cho yêu cầu tạo cảnh báo học tập
    /// </summary>
    public class TestAlertDto
    {
        public int UserId { get; set; }
        public int LectureId { get; set; }
        public decimal Progress { get; set; }
        public List<AnswerDto> Answers { get; set; }
    }
    
    /// <summary>
    /// DTO cho yêu cầu tạo cảnh báo học tập tự động sau khi nộp bài
    /// </summary>
    public class TestAlertSubmitDto
    {
        public int UserId { get; set; }
        public int LectureId { get; set; }
        public decimal Progress { get; set; }
        public bool IsRetaking { get; set; }
    }
    
    /// <summary>
    /// DTO cho dữ liệu từ file JSON câu trả lời
    /// </summary>
    public class AnswersData
    {
        public int userId { get; set; }
        public int lectureId { get; set; }
        public DateTime timestamp { get; set; }
        public int correctAnswers { get; set; }
        public int totalQuestions { get; set; }
        public decimal score { get; set; }
        public Dictionary<string, string> answers { get; set; }
        public List<string> wrong_keywords { get; set; }
    }

    /// <summary>
    /// DTO cho đáp án của sinh viên
    /// </summary>
    public class AnswerDto
    {
        public int QuestionIndex { get; set; }
        public string Answer { get; set; }
    }
} 