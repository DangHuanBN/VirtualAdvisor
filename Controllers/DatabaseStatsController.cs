using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Controllers
{
    // DTO cho kết quả huấn luyện AI
    public class AITrainingResultDto
    {
        public int TrainingId { get; set; }
        public int LectureId { get; set; }
        public string? CourseName { get; set; }
        public DateTime? TrainingTime { get; set; }
        public string? Status { get; set; }
        public string? Accuracy { get; set; }
        public string? Creator { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    // Tạm thời bỏ [Authorize] để kiểm tra lỗi
    //[Authorize(Roles = "Admin,admin,Teacher,teacher")]
    public class DatabaseStatsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public DatabaseStatsController(
            AppDbContext context,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetDatabaseSummary()
        {
            try
            {
                // Đếm số lượng người dùng, khóa học, bài giảng, môn học, và phản hồi
                int userCount = await _context.Users.CountAsync();
                int courseCount = await _context.Courses.CountAsync();
                int lectureCount = await _context.Lectures.CountAsync();
                int subjectCount = await _context.Subjects.CountAsync();
                int feedbackCount = await _context.FeedbackHistories.CountAsync();

                // Ước tính kích thước cơ sở dữ liệu dựa trên số lượng bản ghi
                // Đây chỉ là ước tính thô, trong thực tế nên sử dụng truy vấn SQL trực tiếp để lấy kích thước chính xác
                double estimatedSizeMB = (userCount * 0.05) + (courseCount * 0.02) + (lectureCount * 0.5) + (subjectCount * 0.01) + (feedbackCount * 0.01);
                string dbSizeDisplay = estimatedSizeMB >= 1000 ? $"{estimatedSizeMB / 1000:F2} GB" : $"{estimatedSizeMB:F2} MB";

                // Thông tin bảng (cố định vì chúng ta biết có bao nhiêu bảng trong cơ sở dữ liệu)
                int tableCount = 10; // Giả định rằng có 10 bảng trong cơ sở dữ liệu

                // Thư mục backup - giả định rằng có thư mục backup trong wwwroot
                string backupPath = Path.Combine(_environment.WebRootPath, "backups");
                int backupCount = 0;
                DateTime? lastBackupDate = null;

                // Kiểm tra xem thư mục backup có tồn tại không
                if (Directory.Exists(backupPath))
                {
                    var backupFiles = Directory.GetFiles(backupPath, "*.bak");
                    backupCount = backupFiles.Length;

                    // Lấy ngày sao lưu gần nhất
                    if (backupCount > 0)
                    {
                        lastBackupDate = backupFiles
                            .Select(f => new FileInfo(f).LastWriteTime)
                            .OrderByDescending(d => d)
                            .FirstOrDefault();
                    }
                }

                // Tạo đối tượng kết quả
                var result = new
                {
                    dbSize = dbSizeDisplay,
                    tableCount = tableCount,
                    backupCount = backupCount,
                    lastBackupDate = lastBackupDate?.ToString("yyyy-MM-ddTHH:mm:ss") ?? "Chưa có",
                    userCount = userCount,
                    courseCount = courseCount,
                    lectureCount = lectureCount,
                    subjectCount = subjectCount,
                    feedbackCount = feedbackCount
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi lấy thông tin cơ sở dữ liệu: {ex.Message}" });
            }
        }

        [HttpGet("lectures")]
        public async Task<IActionResult> GetLectureStats()
        {
            try
            {
                // Lấy tổng số bài giảng
                int totalLectures = await _context.Lectures.CountAsync();
                
                // Lấy số lượng bài giảng đã huấn luyện
                int trainedLectures = await _context.Lectures
                    .Where(l => l.Status == "dahuanluyen")
                    .CountAsync();
                
                // Tính toán số lượng bài giảng chưa huấn luyện
                int untrainedLectures = totalLectures - trainedLectures;

                // Lấy thông tin thống kê cho từng khóa học
                var courseStats = await _context.Courses
                    .Select(c => new
                    {
                        courseId = c.CourseId,
                        courseName = c.CourseName,
                        totalLectures = _context.Lectures.Count(l => l.CourseId == c.CourseId),
                        trainedLectures = _context.Lectures.Count(l => l.CourseId == c.CourseId && l.Status == "dahuanluyen"),
                        untrainedLectures = _context.Lectures.Count(l => l.CourseId == c.CourseId && l.Status != "dahuanluyen")
                    })
                    .ToListAsync();

                // Tạo đối tượng kết quả
                var result = new
                {
                    totalLectures,
                    trainedLectures,
                    untrainedLectures,
                    courseStats
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi lấy thông tin bài giảng: {ex.Message}" });
            }
        }

        [HttpGet("lectures/course/{courseId}")]
        public async Task<IActionResult> GetLecturesByCourse(int courseId)
        {
            try
            {
                // Kiểm tra xem khóa học có tồn tại không
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    return NotFound(new { message = $"Không tìm thấy khóa học với ID: {courseId}" });
                }

                // Lấy danh sách bài giảng thuộc khóa học - sử dụng COALESCE để xử lý các giá trị NULL
                var lectures = await _context.Lectures
                    .Where(l => l.CourseId == courseId)
                    .Join(_context.Users,
                        lecture => lecture.TeacherId,
                        user => user.UserId,
                        (lecture, user) => new
                        {
                            lectureId = lecture.LectureId,
                            title = lecture.Title ?? string.Empty,
                            filePath = lecture.Attachment ?? string.Empty,
                            status = lecture.Status ?? "chuahuanluyen",
                            uploadDate = lecture.UploadDate,
                            teacherId = lecture.TeacherId,
                            teacherName = user.FullName ?? "Không có tên",
                            courseId = lecture.CourseId
                        })
                    .ToListAsync();

                return Ok(lectures);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi lấy danh sách bài giảng cho khóa học {courseId}: {ex.Message}" });
            }
        }

        [HttpGet("ai-training")]
        public async Task<IActionResult> GetAITrainingStats()
        {
            try
            {
                var results = new List<AITrainingResultDto>();
                
                // Lấy thông tin từ bảng AITraining - xử lý các giá trị NULL
                var trainingsFromDB = await _context.AITrainings
                    .Join(_context.Lectures,
                        training => training.LectureId,
                        lecture => lecture.LectureId,
                        (training, lecture) => new { Training = training, Lecture = lecture })
                    .Join(_context.Courses,
                        joined => joined.Lecture.CourseId,
                        course => course.CourseId,
                        (joined, course) => new AITrainingResultDto
                        {
                            TrainingId = joined.Training.TrainingId,
                            LectureId = joined.Training.LectureId,
                            CourseName = course.CourseName ?? "Không có tên",
                            TrainingTime = joined.Training.TrainingTime,
                            Status = joined.Training.Status ?? "completed",
                            Accuracy = "98%", // Mẫu giá trị chính xác (trong thực tế sẽ được lấy từ DB)
                            Creator = "Administrator", // Người tạo mặc định
                        })
                    .Take(10) // Giới hạn 10 kết quả gần nhất
                    .OrderByDescending(t => t.TrainingTime)
                    .ToListAsync();
                
                // Thêm kết quả vào danh sách
                results.AddRange(trainingsFromDB);

                // Nếu không có dữ liệu huấn luyện, sử dụng bài giảng đã huấn luyện thay thế
                if (results.Count == 0)
                {
                    var lecturesFromDB = await _context.Lectures
                        .Where(l => l.Status == "dahuanluyen")
                        .Join(_context.Courses,
                            lecture => lecture.CourseId,
                            course => course.CourseId,
                            (lecture, course) => new AITrainingResultDto
                            {
                                TrainingId = lecture.LectureId, // Sử dụng lectureId làm trainingId
                                LectureId = lecture.LectureId,
                                CourseName = course.CourseName ?? "Không có tên",
                                TrainingTime = lecture.TrainingDate ?? lecture.UploadDate, // Sử dụng UploadDate khi TrainingDate là null
                                Status = "completed", // Đã huấn luyện
                                Accuracy = "98%", // Mẫu giá trị chính xác
                                Creator = "Administrator", // Người tạo mặc định
                            })
                        .Take(10) // Giới hạn 10 kết quả gần nhất
                        .OrderByDescending(t => t.TrainingTime)
                        .ToListAsync();
                    
                    // Thêm kết quả vào danh sách
                    results.AddRange(lecturesFromDB);
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi lấy thông tin huấn luyện AI: {ex.Message}" });
            }
        }
    }
} 