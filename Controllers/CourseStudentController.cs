using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CourseStudentController : ControllerBase
    {
        private readonly ICourseStudentService _courseStudentService;

        public CourseStudentController(ICourseStudentService courseStudentService)
        {
            _courseStudentService = courseStudentService;
        }
        
        /// <summary>
        /// Kiểm tra trạng thái kết nối của API
        /// </summary>
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { 
                success = true, 
                message = "API đang hoạt động", 
                time = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        /// <summary>
        /// Lấy danh sách khóa học mà sinh viên chưa đăng ký
        /// </summary>
        /// <param name="studentId">ID của sinh viên</param>
        /// <returns>Danh sách khóa học khả dụng</returns>
        [HttpGet("available/{studentId}")]
        public async Task<IActionResult> GetAvailableCourses(int studentId)
        {
            var response = await _courseStudentService.GetAvailableCoursesAsync(studentId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }

        /// <summary>
        /// Đăng ký khóa học cho sinh viên
        /// </summary>
        /// <param name="model">Thông tin đăng ký khóa học</param>
        /// <returns>Kết quả đăng ký</returns>
        [HttpPost("register")]
        public async Task<IActionResult> RegisterCourse([FromBody] CourseStudentRegisterModel model)
        {
            // Log dữ liệu nhận được để debug
            System.Console.WriteLine($"Đăng ký khóa học: UserId={model.UserId}, CourseId={model.CourseId}");
            
            if (!ModelState.IsValid)
                return BadRequest(new { 
                    success = false, 
                    message = "Dữ liệu không hợp lệ", 
                    errors = ModelState 
                });
                
            var response = await _courseStudentService.RegisterCourseAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }

        /// <summary>
        /// Lấy danh sách khóa học mà sinh viên đã đăng ký
        /// </summary>
        /// <param name="studentId">ID của sinh viên</param>
        /// <returns>Danh sách khóa học đã đăng ký</returns>
        [HttpGet("mycourses/{studentId}")]
        public async Task<IActionResult> GetEnrolledCourses(int studentId)
        {
            var response = await _courseStudentService.GetEnrolledCoursesAsync(studentId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        /// <summary>
        /// Lấy danh sách khóa học mà sinh viên đã đăng ký (endpoint bổ sung)
        /// </summary>
        /// <param name="userId">ID của sinh viên</param>
        /// <returns>Danh sách khóa học đã đăng ký</returns>
        [HttpGet("enrolled/{userId}")]
        public async Task<IActionResult> GetEnrolledCoursesByUserId(int userId)
        {
            var response = await _courseStudentService.GetEnrolledCoursesAsync(userId);
            
            if (!response.Success)
                return StatusCode(500, response);
                
            return Ok(response);
        }
        
        /// <summary>
        /// Lấy danh sách bài giảng của một khóa học
        /// </summary>
        /// <param name="courseId">ID của khóa học</param>
        /// <returns>Danh sách bài giảng của khóa học</returns>
        [HttpGet("lectures/{courseId}")]
        public async Task<IActionResult> GetCourseLectures(int courseId)
        {
            try
            {
                // In ra log để debug
                System.Console.WriteLine($"Đang tải bài giảng cho khóa học ID={courseId}");
                
                // Kiểm tra khóa học có tồn tại không
                var course = await _courseStudentService.GetCourseByIdAsync(courseId);
                if (!course.Success || course.Data == null)
                {
                    System.Console.WriteLine($"Không tìm thấy khóa học có ID={courseId}");
                    return NotFound(new
                    {
                        success = false,
                        message = $"Không tìm thấy khóa học có ID={courseId}"
                    });
                }
                
                // Lấy danh sách bài giảng
                var lectures = await _courseStudentService.GetLecturesByCourseIdAsync(courseId);
                
                // Debug chi tiết
                System.Console.WriteLine($"Kết quả truy vấn bài giảng: Success={lectures.Success}, Count={lectures.Data?.Count ?? 0}");
                
                // Log kết quả
                if (!lectures.Success || lectures.Data == null || lectures.Data.Count == 0)
                {
                    System.Console.WriteLine($"Khóa học ID={courseId} không có bài giảng nào");
                    
                    // Debug trực tiếp từ database cho các khóa học đặc biệt
                    if (courseId == 1 || courseId == 3 || courseId == 6)
                    {
                        try {
                            // Truy vấn trực tiếp bảng lecture
                            var lecturesCount = await _courseStudentService.GetLectureCountDirectlyAsync(courseId);
                            System.Console.WriteLine($"Kiểm tra trực tiếp từ database: Khóa học ID={courseId} có {lecturesCount} bài giảng");
                        }
                        catch (System.Exception ex) {
                            System.Console.WriteLine($"Lỗi khi kiểm tra trực tiếp: {ex.Message}");
                        }
                    }
                }
                else
                {
                    System.Console.WriteLine($"Tìm thấy {lectures.Data.Count} bài giảng cho khóa học ID={courseId}");
                    foreach (var lecture in lectures.Data)
                    {
                        System.Console.WriteLine($"  - Bài giảng ID={lecture.LectureId}, Tên={lecture.LectureName}, File={lecture.FilePath}");
                    }
                }
                
                return Ok(lectures);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Lỗi khi lấy danh sách bài giảng: {ex.Message}");
                System.Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Lỗi khi lấy danh sách bài giảng: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Hủy đăng ký khóa học cho sinh viên
        /// </summary>
        /// <param name="model">Thông tin hủy đăng ký khóa học</param>
        /// <returns>Kết quả hủy đăng ký</returns>
        [HttpPost("unregister")]
        public async Task<IActionResult> UnregisterCourse([FromBody] CourseStudentRegisterModel model)
        {
            // Log dữ liệu nhận được để debug
            System.Console.WriteLine($"Hủy đăng ký khóa học: UserId={model.UserId}, CourseId={model.CourseId}");
            
            if (!ModelState.IsValid)
                return BadRequest(new { 
                    success = false, 
                    message = "Dữ liệu không hợp lệ", 
                    errors = ModelState 
                });
                
            var response = await _courseStudentService.UnregisterCourseAsync(model);
            
            if (!response.Success)
                return BadRequest(response);
                
            return Ok(response);
        }
    }
} 