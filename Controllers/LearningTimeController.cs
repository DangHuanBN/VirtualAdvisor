using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.Linq;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningTimeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string _logsDirectory;

        public LearningTimeController(AppDbContext context)
        {
            _context = context;
            _logsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "alerts", "logs");
        }

        /// <summary>
        /// Lấy thông tin về số giờ tối đa của bài giảng và thời gian đã học của sinh viên
        /// </summary>
        [HttpGet("{lectureId}/{userId}")]
        public async Task<IActionResult> GetLearningTimeInfo(int lectureId, int userId)
        {
            try
            {
                // Kiểm tra bài giảng có tồn tại không
                var lecture = await _context.Lectures.FindAsync(lectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {lectureId}" });
                }

                // Kiểm tra maxhours có tồn tại không
                if (lecture.MaxHours == null)
                {
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            lectureId,
                            userId,
                            maxHours = 0,
                            studiedHours = 0,
                            formattedMaxHours = "0 tiếng 0 phút",
                            formattedStudiedHours = "0 tiếng 0 phút"
                        }
                    });
                }

                // Tính toán thời gian từ file logs JSON
                float studiedHours = CalculateStudiedHoursFromLogs(lectureId, userId);

                // Nếu không tìm thấy logs, lấy dữ liệu từ database
                if (studiedHours <= 0)
                {
                    // Lấy thông tin tiến độ học tập từ bảng studytracking
                    var tracking = await _context.StudyTrackings
                        .FirstOrDefaultAsync(st => st.LectureId == lectureId && st.UserId == userId);

                    decimal progress = 0;
                    if (tracking != null)
                    {
                        progress = tracking.Progress;
                    }

                    // Tính toán số giờ đã học (progress * maxHours / 100)
                    // Chuyển maxHours sang decimal để tương thích với progress
                    decimal maxHoursDecimal = (decimal)(lecture.MaxHours ?? 0);
                    decimal studiedHoursDecimal = (progress * maxHoursDecimal / 100);
                    
                    // Chuyển đổi lại sang float cho response
                    studiedHours = (float)studiedHoursDecimal;
                }

                // Chuyển đổi maxHours sang float cho response
                float maxHours = (float)(lecture.MaxHours ?? 0);

                // Chuyển đổi sang định dạng "X tiếng Y phút"
                string formattedMaxHours = FormatTimeHoursMinutes(maxHours);
                string formattedStudiedHours = FormatTimeHoursMinutes(studiedHours);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        lectureId,
                        userId,
                        maxHours,
                        studiedHours,
                        formattedMaxHours,
                        formattedStudiedHours
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy thông tin thời gian học: {ex.Message}" });
            }
        }

        /// <summary>
        /// Tính thời gian học từ file logs JSON
        /// </summary>
        private float CalculateStudiedHoursFromLogs(int lectureId, int userId)
        {
            try
            {
                string logFilePath = Path.Combine(_logsDirectory, $"lecture_{lectureId}_user_{userId}.json");
                
                // Kiểm tra file có tồn tại không
                if (!System.IO.File.Exists(logFilePath))
                {
                    Console.WriteLine($"Không tìm thấy file log: {logFilePath}");
                    return 0;
                }

                // Đọc nội dung file
                string jsonContent = System.IO.File.ReadAllText(logFilePath);
                var logData = JsonSerializer.Deserialize<LogData>(jsonContent);

                if (logData?.sessions == null || !logData.sessions.Any())
                {
                    Console.WriteLine($"File log không có dữ liệu sessions: {logFilePath}");
                    return 0;
                }

                // Tính tổng thời gian (tính bằng giờ)
                double totalHours = 0;
                foreach (var session in logData.sessions)
                {
                    if (session.start != null && session.end != null)
                    {
                        // Tính thời gian của phiên (kết thúc - bắt đầu) theo giờ
                        TimeSpan duration = session.end.Value - session.start.Value;
                        totalHours += duration.TotalHours;
                    }
                }

                Console.WriteLine($"Tổng thời gian học từ logs: {totalHours} giờ (lecture: {lectureId}, user: {userId})");
                return (float)totalHours;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi tính thời gian học từ logs: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// Hàm định dạng thời gian sang "X tiếng Y phút"
        /// </summary>
        private string FormatTimeHoursMinutes(float hours)
        {
            int totalMinutes = (int)(hours * 60);
            int hoursComponent = totalMinutes / 60;
            int minutesComponent = totalMinutes % 60;
            
            return $"{hoursComponent} tiếng {minutesComponent} phút";
        }

        /// <summary>
        /// Lấy chi tiết các phiên học của sinh viên cho một bài giảng
        /// </summary>
        [HttpGet("sessions/{lectureId}/{userId}")]
        public IActionResult GetLearningSessionInfo(int lectureId, int userId)
        {
            try
            {
                string logFilePath = Path.Combine(_logsDirectory, $"lecture_{lectureId}_user_{userId}.json");
                
                // Kiểm tra file có tồn tại không
                if (!System.IO.File.Exists(logFilePath))
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy dữ liệu phiên học cho bài giảng {lectureId} và người dùng {userId}" });
                }

                // Đọc nội dung file
                string jsonContent = System.IO.File.ReadAllText(logFilePath);
                var logData = JsonSerializer.Deserialize<LogData>(jsonContent);

                if (logData?.sessions == null || !logData.sessions.Any())
                {
                    return Ok(new { success = true, data = new { sessions = new List<object>(), totalHours = 0, formattedTotalHours = "0 tiếng 0 phút" } });
                }

                // Tạo danh sách chi tiết từng phiên học
                var sessionDetails = new List<object>();
                double totalHours = 0;

                foreach (var session in logData.sessions)
                {
                    if (session.start != null && session.end != null)
                    {
                        // Tính thời gian của phiên
                        TimeSpan duration = session.end.Value - session.start.Value;
                        
                        // Thêm thông tin chi tiết
                        sessionDetails.Add(new {
                            startTime = session.start.Value.ToString("g"),
                            endTime = session.end.Value.ToString("g"),
                            duration = FormatDuration(duration),
                            durationHours = Math.Round(duration.TotalHours, 2)
                        });
                        
                        totalHours += duration.TotalHours;
                    }
                }

                // Định dạng tổng thời gian học
                string formattedTotalHours = FormatTimeHoursMinutes((float)totalHours);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        lectureId,
                        userId,
                        sessions = sessionDetails,
                        totalHours = Math.Round(totalHours, 2),
                        formattedTotalHours,
                        sessionCount = sessionDetails.Count
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy thông tin phiên học: {ex.Message}" });
            }
        }

        /// <summary>
        /// Định dạng khoảng thời gian dưới dạng "X tiếng Y phút Z giây"
        /// </summary>
        private string FormatDuration(TimeSpan duration)
        {
            if (duration.TotalHours >= 1)
            {
                return $"{duration.Hours} tiếng {duration.Minutes} phút {duration.Seconds} giây";
            }
            else if (duration.TotalMinutes >= 1)
            {
                return $"{duration.Minutes} phút {duration.Seconds} giây";
            }
            else
            {
                return $"{duration.Seconds} giây";
            }
        }
    }

    /// <summary>
    /// Lớp dữ liệu cho file logs
    /// </summary>
    public class LogData
    {
        public int user_id { get; set; }
        public int lecture_id { get; set; }
        public List<Session> sessions { get; set; }
    }

    /// <summary>
    /// Lớp thể hiện một phiên học
    /// </summary>
    public class Session
    {
        public DateTime? start { get; set; }
        public DateTime? end { get; set; }
    }
} 