using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using VirtualAdvisorAPI.Data;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api")]
    public class ProgressController : ControllerBase
    {
        private readonly IProgressService _progressService;
        private readonly AppDbContext _context;

        public ProgressController(IProgressService progressService, AppDbContext context)
        {
            _progressService = progressService;
            _context = context;
        }

        // GET: /api/progress/subjects
        [HttpGet("progress/subjects")]
        public async Task<ActionResult<IEnumerable<Subject>>> GetSubjects()
        {
            try
            {
                var subjects = await _progressService.GetAllSubjectsAsync();
                return Ok(subjects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy danh sách môn học: {ex.Message}");
            }
        }

        // GET: /api/progress/courses-by-subject/{subjectId}
        [HttpGet("progress/courses-by-subject/{subjectId}")]
        public async Task<ActionResult<IEnumerable<Course>>> GetCoursesBySubject(int subjectId)
        {
            try
            {
                var courses = await _progressService.GetCoursesBySubjectAsync(subjectId);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy danh sách khóa học: {ex.Message}");
            }
        }

        // GET: /api/progress/students-by-course/{courseId}
        [HttpGet("progress/students-by-course/{courseId}")]
        public async Task<ActionResult<IEnumerable<StudentBasicDto>>> GetStudentsByCourse(int courseId)
        {
            try
            {
                var students = await _progressService.GetStudentsByCourseAsync(courseId);
                return Ok(students);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi server khi lấy danh sách sinh viên: {ex.Message}");
                return StatusCode(500, $"Lỗi khi lấy danh sách sinh viên: {ex.Message}");
            }
        }

        // GET: /api/progress/student/{courseId}/{studentId}
        [HttpGet("progress/student/{courseId}/{studentId}")]
        public async Task<ActionResult<StudentProgressDto>> GetStudentProgress(int courseId, int studentId)
        {
            try
            {
                var progress = await _progressService.GetStudentProgressAsync(courseId, studentId);
                return Ok(progress);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy tiến độ học tập: {ex.Message}");
            }
        }

        // GET: /api/progress/details/{courseId}/{studentId}
        [HttpGet("progress/details/{courseId}/{studentId}")]
        public async Task<ActionResult<IEnumerable<ProgressDetailDto>>> GetProgressDetails(int courseId, int studentId)
        {
            try
            {
                var progressDetails = await _progressService.GetProgressDetailsAsync(courseId, studentId);
                return Ok(progressDetails);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy chi tiết tiến độ: {ex.Message}");
            }
        }

        // GET: /api/progress/student-courses/{studentId}
        [HttpGet("progress/student-courses/{studentId}")]
        public async Task<ActionResult<IEnumerable<StudentCourseDto>>> GetStudentCourses(int studentId)
        {
            try
            {
                var courses = await _progressService.GetStudentCoursesAsync(studentId);
                return Ok(courses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy danh sách khóa học của sinh viên: {ex.Message}");
            }
        }

        // GET: /api/progress/student-results/{studentId}/{courseId}
        [HttpGet("progress/student-results/{studentId}/{courseId}")]
        public async Task<ActionResult<StudentResultsDto>> GetStudentResults(int studentId, int courseId)
        {
            try
            {
                var results = await _progressService.GetStudentResultsAsync(studentId, courseId);
                return Ok(results);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy kết quả học tập: {ex.Message}");
            }
        }
        
        // GET: /api/students/{studentId}/courses/{courseId}/results
        [HttpGet("/api/students/{studentId}/courses/{courseId}/results")]
        public async Task<ActionResult<StudentResultsDto>> GetStudentCourseResults(int studentId, int courseId, [FromQuery] string? semester = null)
        {
            try
            {
                var results = await _progressService.GetStudentResultsAsync(studentId, courseId);
                
                // Lọc kết quả theo học kỳ nếu được chỉ định
                if (!string.IsNullOrEmpty(semester) && semester != "all" && semester != "current")
                {
                    // Thực hiện lọc dữ liệu theo học kỳ ở đây nếu cần
                }
                
                return Ok(results);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy kết quả học tập: {ex.Message}" });
            }
        }
        
        // GET: /api/students/{studentId}/courses
        [HttpGet("/api/students/{studentId}/courses")]
        public async Task<ActionResult> GetStudentCoursesFromApi(int studentId)
        {
            try
            {
                var courses = await _progressService.GetStudentCoursesAsync(studentId);
                
                if (courses == null || !courses.Any())
                {
                    return Ok(new List<StudentCourseDto>());
                }
                
                return Ok(courses);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy danh sách khóa học: {ex.Message}" });
            }
        }

        // GET: /api/studytracking
        [HttpGet("studytracking")]
        public async Task<ActionResult> GetStudyTracking([FromQuery] int userId, [FromQuery] int courseId)
        {
            try
            {
                Console.WriteLine($"GetStudyTracking được gọi với userId={userId}, courseId={courseId}");
                
                // Lấy danh sách tất cả các bài giảng trong khóa học
                var lectures = await _context.Lectures
                    .Where(l => l.CourseId == courseId)
                    .ToListAsync();

                Console.WriteLine($"Tìm thấy {lectures.Count} bài giảng trong khóa học {courseId}");

                if (lectures.Count == 0)
                {
                    Console.WriteLine($"Không có bài giảng nào trong khóa học {courseId}");
                    return Ok(new List<object>());
                }

                // Lấy dữ liệu tracking của sinh viên cho các bài giảng trong khóa học
                var trackingData = await _context.StudyTrackings
                    .Where(st => st.UserId == userId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                    .Include(st => st.Lecture)
                    .ToListAsync();

                Console.WriteLine($"Tìm thấy {trackingData.Count} bản ghi tracking cho userId={userId}");

                // Tạo kết quả theo định dạng mà frontend mong đợi
                var result = new List<object>();

                // Ánh xạ cho các bài giảng có dữ liệu tracking
                foreach (var lecture in lectures)
                {
                    var tracking = trackingData.FirstOrDefault(t => t.LectureId == lecture.LectureId);
                    
                    // Thêm cả những bài giảng không có tracking
                    result.Add(new
                    {
                        lectureId = lecture.LectureId,
                        lectureCode = $"{courseId}-{lecture.LectureId.ToString().PadLeft(3, '0')}",
                        title = lecture.Title ?? string.Empty,
                        type = lecture.Type ?? string.Empty,
                        progress = tracking?.Progress ?? 0,
                        status = tracking?.Status ?? "chuahoanthanh",
                        startDate = tracking?.StartDate,
                        endDate = tracking?.EndDate
                    });
                }

                // Log kết quả
                Console.WriteLine($"Trả về {result.Count} kết quả tracking theo định dạng phù hợp với frontend");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi trong GetStudyTracking: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy dữ liệu studytracking: {ex.Message}" });
            }
        }

        // Phương thức hỗ trợ để chuyển đổi loại bài giảng
        private string ChuyenDoiLoaiBaiGiang(string loai)
        {
            return loai switch
            {
                "baigiang" => "Bài giảng",
                "baikiemtra" => "Bài kiểm tra",
                "baithi" => "Bài thi",
                _ => "Khác"
            };
        }

        // Phương thức hỗ trợ để chuyển đổi trạng thái
        private string ChuyenDoiTrangThai(string trangThai)
        {
            return trangThai switch
            {
                "hoanthanh" => "Đã hoàn thành",
                "chuahoanthanh" => "Chưa bắt đầu",
                _ => "Đang thực hiện"
            };
        }

        // GET: /api/studytracking/student/{studentId}/course/{courseId}
        [HttpGet("studytracking/student/{studentId}/course/{courseId}")]
        public async Task<ActionResult> GetStudyTrackingByStudentAndCourse(int studentId, int courseId)
        {
            Console.WriteLine($"GetStudyTrackingByStudentAndCourse được gọi với studentId={studentId}, courseId={courseId}");
            return await GetStudyTracking(userId: studentId, courseId: courseId);
        }

        // GET: /api/tracking/{studentId}/{courseId}
        [HttpGet("tracking/{studentId}/{courseId}")]
        public async Task<ActionResult> GetTrackingAlternative(int studentId, int courseId)
        {
            Console.WriteLine($"GetTrackingAlternative được gọi với studentId={studentId}, courseId={courseId}");
            return await GetStudyTracking(userId: studentId, courseId: courseId);
        }

        // GET: /api/tracking
        [HttpGet("tracking")]
        public async Task<ActionResult> GetTrackingAlternative2([FromQuery] int userId, [FromQuery] int courseId)
        {
            Console.WriteLine($"GetTrackingAlternative2 được gọi với userId={userId}, courseId={courseId}");
            return await GetStudyTracking(userId: userId, courseId: courseId);
        }
    }
} 