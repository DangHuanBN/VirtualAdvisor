using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrackingController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Cập nhật hoặc tạo mới tiến độ học tập của sinh viên cho một bài giảng
        /// </summary>
        [HttpPost("update")]
        public async Task<IActionResult> UpdateStudyTracking([FromBody] StudyTrackingUpdateDto model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
                }

                Console.WriteLine($"Cập nhật tiến độ: UserId={model.UserId}, LectureId={model.LectureId}, Progress={model.Progress}");

                // Kiểm tra người dùng tồn tại
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

                // Tìm bản ghi tracking hiện có
                var tracking = await _context.StudyTrackings
                    .FirstOrDefaultAsync(st => st.UserId == model.UserId && st.LectureId == model.LectureId);

                if (tracking == null)
                {
                    // Tạo bản ghi mới nếu chưa tồn tại
                    tracking = new StudyTracking
                    {
                        UserId = model.UserId,
                        LectureId = model.LectureId,
                        Progress = model.Progress,
                        Status = model.Progress >= 80 ? "hoanthanh" : "chuahoanthanh",
                        StartDate = DateTime.Now,
                        EndDate = DateTime.Now
                    };
                    _context.StudyTrackings.Add(tracking);
                    Console.WriteLine($"Tạo mới bản ghi tracking với Progress={model.Progress}");
                }
                else
                {
                    // CHỈ cập nhật Progress nếu giá trị mới lớn hơn giá trị hiện tại
                    if (model.Progress > tracking.Progress)
                    {
                        Console.WriteLine($"Cập nhật Progress từ {tracking.Progress} thành {model.Progress}");
                        tracking.Progress = model.Progress;
                        
                        // Cập nhật trạng thái dựa trên tiến độ mới
                        if (model.Progress >= 80)
                        {
                            tracking.Status = "hoanthanh";
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Giữ nguyên Progress={tracking.Progress} (giá trị mới là {model.Progress})");
                    }
                    
                    // Luôn cập nhật EndDate khi có tương tác
                    tracking.EndDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cập nhật tiến độ học tập thành công",
                    data = new
                    {
                        tracking.TrackingId,
                        tracking.UserId,
                        tracking.LectureId,
                        tracking.Progress,
                        tracking.Status,
                        tracking.StartDate,
                        tracking.EndDate
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi cập nhật tiến độ học tập: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Lỗi khi cập nhật tiến độ học tập: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy thông tin tiến độ học tập của một khóa học cho người dùng cụ thể
        /// </summary>
        [HttpGet("course/{courseId}/user/{userId}")]
        public async Task<IActionResult> GetCourseProgress(int courseId, int userId)
        {
            try
            {
                // Lấy thông tin về khóa học
                var course = await _context.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);
                
                if (course == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học" });
                }

                // Lấy danh sách bài giảng của khóa học
                var lectures = await _context.Lectures
                    .Where(l => l.CourseId == courseId)
                    .OrderBy(l => l.LectureId)
                    .ToListAsync();

                if (lectures == null || !lectures.Any())
                {
                    return Ok(new { 
                        success = true, 
                        data = new { 
                            courseType = course.Type,
                            lectureProgress = new List<object>() 
                        } 
                    });
                }

                // Lấy dữ liệu tracking từ bảng studytracking
                var trackingData = await _context.StudyTrackings
                    .Where(st => st.UserId == userId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                    .ToListAsync();

                // Tạo danh sách kết quả
                var lectureProgressList = lectures.Select(lecture => {
                    // Tìm tracking tương ứng cho bài giảng này
                    var tracking = trackingData.FirstOrDefault(t => t.LectureId == lecture.LectureId);
                    
                    return new {
                        lectureId = lecture.LectureId,
                        title = lecture.Title,
                        type = lecture.Type,
                        order = lecture.LectureId,
                        status = tracking?.Status ?? "chuahoanthanh",
                        progress = tracking?.Progress ?? 0,
                        startDate = tracking?.StartDate,
                        endDate = tracking?.EndDate
                    };
                }).ToList();

                return Ok(new { 
                    success = true, 
                    data = new { 
                        courseId = courseId,
                        courseType = course.Type,
                        userId = userId,
                        totalLectures = lectures.Count,
                        completedLectures = trackingData.Count(t => t.Status == "hoanthanh"),
                        lectureProgress = lectureProgressList
                    } 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        
        /// <summary>
        /// Lấy thông tin tiến độ học tập từ studytracking cho một sinh viên trong một khóa học
        /// </summary>
        [HttpGet("{userId}/{courseId}")]
        public async Task<IActionResult> GetStudyTracking(int userId, int courseId)
        {
            try
            {
                // Lấy danh sách lecture id của khóa học
                var lectureIds = await _context.Lectures
                    .Where(l => l.CourseId == courseId)
                    .Select(l => l.LectureId)
                    .ToListAsync();
                
                if (lectureIds == null || !lectureIds.Any())
                {
                    return Ok(new List<object>());
                }
                
                // Lấy dữ liệu tracking từ bảng studytracking
                var trackingData = await _context.StudyTrackings
                    .Where(st => st.UserId == userId && lectureIds.Contains(st.LectureId))
                    .Join(_context.Lectures,
                        st => st.LectureId,
                        l => l.LectureId,
                        (st, l) => new {
                            lectureId = st.LectureId,
                            title = l.Title,
                            type = l.Type,
                            order = l.LectureId,
                            status = st.Status,
                            progress = st.Progress,
                            startDate = st.StartDate,
                            endDate = st.EndDate
                        })
                    .OrderBy(x => x.order)
                    .ToListAsync();
                
                return Ok(trackingData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thông tin tiến độ học tập cho một bài giảng cụ thể
        /// </summary>
        [HttpGet("lecture/{lectureId}/user/{userId}")]
        public async Task<IActionResult> GetLectureTrackingForUser(int lectureId, int userId)
        {
            try
            {
                // Kiểm tra bài giảng có tồn tại không
                var lecture = await _context.Lectures.FindAsync(lectureId);
                if (lecture == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy bài giảng với ID {lectureId}" });
                }

                // Kiểm tra user có tồn tại không
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy người dùng với ID {userId}" });
                }

                // Lấy dữ liệu theo dõi của sinh viên cho bài giảng này
                var tracking = await _context.StudyTrackings
                    .Where(st => st.LectureId == lectureId && st.UserId == userId)
                    .Select(st => new
                    {
                        st.TrackingId,
                        st.UserId,
                        st.LectureId,
                        st.Progress,
                        st.Status,
                        st.StartDate,
                        st.EndDate,
                        LastAccessed = st.EndDate // Sử dụng EndDate như LastAccessed
                    })
                    .FirstOrDefaultAsync();

                if (tracking == null)
                {
                    // Nếu không có dữ liệu tracking, trả về kết quả trống với thông tin cơ bản
                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            lectureId = lectureId,
                            userId = userId,
                            progress = 0,
                            status = "chuahoanthanh",
                            startDate = (DateTime?)null,
                            endDate = (DateTime?)null,
                            lastAccessed = (DateTime?)null,
                            courseId = lecture.CourseId
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        tracking.TrackingId,
                        tracking.UserId,
                        tracking.LectureId,
                        tracking.Progress,
                        tracking.Status,
                        tracking.StartDate,
                        tracking.EndDate,
                        tracking.LastAccessed,
                        courseId = lecture.CourseId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy dữ liệu tracking: {ex.Message}" });
            }
        }
    }
} 