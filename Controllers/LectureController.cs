using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;
using System.Linq;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using VirtualAdvisorAPI.Data;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Teacher")]
    public class LectureController : ControllerBase
    {
        private readonly ILectureService _lectureService;
        private readonly AppDbContext _context;

        public LectureController(ILectureService lectureService, AppDbContext context)
        {
            _lectureService = lectureService;
            _context = context;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<LectureResponseDTO>> UploadLecture([FromForm] UploadLectureDTO uploadDto)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId))
                {
                    return Unauthorized(new { Message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }

                // Validate file
                if (uploadDto.File == null || uploadDto.File.Length <= 0)
                {
                    return BadRequest(new { Message = "Vui lòng chọn file để tải lên" });
                }

                // Kiểm tra định dạng file
                var allowedExtensions = new[] { ".pdf", ".docx", ".pptx", ".mp4" };
                var fileExtension = System.IO.Path.GetExtension(uploadDto.File.FileName).ToLowerInvariant();
                
                if (!Array.Exists(allowedExtensions, ext => ext.Equals(fileExtension)))
                {
                    return BadRequest(new { Message = "Định dạng file không được hỗ trợ. Vui lòng sử dụng .pdf, .docx, .pptx hoặc .mp4" });
                }

                // Kiểm tra kích thước file (tối đa 100MB)
                if (uploadDto.File.Length > 104857600) // 100MB in bytes
                {
                    return BadRequest(new { Message = "Kích thước file không được vượt quá 100MB" });
                }

                // Gọi service để xử lý
                var result = await _lectureService.UploadLectureAsync(uploadDto, teacherId);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Lỗi trong quá trình xử lý: {ex.Message}" });
            }
        }

        [HttpGet("by-teacher/{id}")]
        public async Task<IActionResult> GetByTeacher(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "ID giảng viên không hợp lệ" });
                }

                var lectures = await _lectureService.GetLecturesByTeacherIdAsync(id);
                
                // Trả về danh sách trống nếu không có bài giảng
                if (lectures == null || !lectures.Any())
                {
                    return Ok(new { success = true, message = "Không tìm thấy bài giảng nào cho giảng viên này", data = new List<LectureResponseDTO>() });
                }
                
                return Ok(new { success = true, data = lectures });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in GetByTeacher: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy bài giảng theo giảng viên: {ex.Message}" });
            }
        }
        
        [HttpGet("teacher")]
        public async Task<IActionResult> GetForCurrentTeacher()
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }
                
                var lectures = await _lectureService.GetLecturesByTeacherIdAsync(teacherId);
                
                // Trả về danh sách trống nếu không có bài giảng
                if (lectures == null || !lectures.Any())
                {
                    return Ok(new { success = true, message = "Không tìm thấy bài giảng nào", data = new List<LectureResponseDTO>() });
                }
                
                return Ok(new { success = true, data = lectures });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in GetForCurrentTeacher: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy bài giảng: {ex.Message}" });
            }
        }

        [HttpGet("teacher/paged")]
        public async Task<IActionResult> GetForCurrentTeacherPaged([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }
                
                var pagedResult = await _lectureService.GetLecturesByTeacherIdPagedAsync(teacherId, pageNumber, pageSize);
                
                return Ok(new { 
                    success = true, 
                    data = pagedResult.Items,
                    pagination = new {
                        pageNumber = pagedResult.PageNumber,
                        pageSize = pagedResult.PageSize,
                        totalCount = pagedResult.TotalCount,
                        totalPages = pagedResult.TotalPages,
                        hasPreviousPage = pagedResult.HasPreviousPage,
                        hasNextPage = pagedResult.HasNextPage
                    }
                });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in GetForCurrentTeacherPaged: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy bài giảng phân trang: {ex.Message}" });
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterLectures([FromQuery] LectureFilterDTO filter)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }
                
                var lectures = await _lectureService.GetFilteredLecturesAsync(teacherId, filter);
                
                // Trả về danh sách trống nếu không có bài giảng
                if (lectures == null || !lectures.Any())
                {
                    return Ok(new { success = true, message = "Không tìm thấy bài giảng nào phù hợp", data = new List<LectureResponseDTO>() });
                }
                
                return Ok(new { success = true, data = lectures });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in FilterLectures: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi lọc bài giảng: {ex.Message}" });
            }
        }

        [HttpGet("filter/paged")]
        public async Task<IActionResult> FilterLecturesPaged([FromQuery] LectureFilterDTO filter)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }
                
                // Đảm bảo kích thước trang là 10
                filter.PageSize = 10;
                
                var pagedResult = await _lectureService.GetFilteredLecturesPagedAsync(teacherId, filter);
                
                return Ok(new { 
                    success = true, 
                    data = pagedResult.Items,
                    pagination = new {
                        pageNumber = pagedResult.PageNumber,
                        pageSize = pagedResult.PageSize,
                        totalCount = pagedResult.TotalCount,
                        totalPages = pagedResult.TotalPages,
                        hasPreviousPage = pagedResult.HasPreviousPage,
                        hasNextPage = pagedResult.HasNextPage
                    }
                });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in FilterLecturesPaged: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi lọc bài giảng phân trang: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLecture(int id)
        {
            try
            {
                // Kiểm tra ID hợp lệ
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "ID bài giảng không hợp lệ" });
                }

                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }

                // Gọi service để xóa bài giảng
                var result = await _lectureService.DeleteLectureAsync(id, teacherId);

                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy bài giảng hoặc bạn không có quyền xóa bài giảng này" });
                }

                return Ok(new { success = true, message = "Xóa bài giảng thành công" });
            }
            catch (Exception ex)
            {
                // Log lỗi
                Console.WriteLine($"Error in DeleteLecture: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi xóa bài giảng: {ex.Message}" });
            }
        }
        
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteLectureAlternative(int id)
        {
            // Sử dụng cùng logic với phương thức trên, tạo endpoint thay thế
            return await DeleteLecture(id);
        }
        
        [HttpPost("delete")]
        public async Task<IActionResult> DeleteLecturePost([FromBody] DeleteLectureDTO deleteDto)
        {
            if (deleteDto == null || deleteDto.Id <= 0)
            {
                return BadRequest(new { success = false, message = "ID bài giảng không hợp lệ" });
            }
            
            // Sử dụng cùng logic với phương thức DeleteLecture
            return await DeleteLecture(deleteDto.Id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLecture(int id, [FromBody] LectureUpdateDto updateDto)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId) || teacherId <= 0)
                {
                    return Unauthorized(new { success = false, message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }

                // Validate input
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                // Gọi service để xử lý cập nhật
                var result = await _lectureService.UpdateLectureAsync(id, updateDto, teacherId);
                
                return Ok(new { success = true, message = "Cập nhật bài giảng thành công", data = result });
            }
            catch (Exception ex)
            {
                // Xử lý trường hợp không tìm thấy bài giảng hoặc không có quyền
                if (ex.Message.Contains("Không tìm thấy bài giảng") || ex.Message.Contains("không có quyền"))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                
                // Log lỗi
                Console.WriteLine($"Error in UpdateLecture: {ex.Message}");
                
                return StatusCode(500, new { success = false, message = $"Lỗi khi cập nhật bài giảng: {ex.Message}" });
            }
        }

        [HttpGet("{lectureId}/tracking/{userId}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetLectureTrackingForUser(int lectureId, int userId)
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
                        lectureId = lectureId,
                        userId = userId,
                        progress = 0,
                        status = "chuahoanthanh",
                        startDate = (DateTime?)null,
                        endDate = (DateTime?)null,
                        lastAccessed = (DateTime?)null,
                        lecture.Title,
                        lecture.Type,
                        lecture.CourseId
                    });
                }

                // Thêm thông tin bài giảng vào kết quả
                var result = new
                {
                    tracking.TrackingId,
                    tracking.UserId,
                    tracking.LectureId,
                    tracking.Progress,
                    tracking.Status,
                    tracking.StartDate,
                    tracking.EndDate,
                    tracking.LastAccessed,
                    LectureTitle = lecture.Title,
                    LectureType = lecture.Type,
                    CourseId = lecture.CourseId
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy dữ liệu tracking: {ex.Message}" });
            }
        }
    }
} 