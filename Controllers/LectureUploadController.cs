using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Services;
using Microsoft.Extensions.Logging;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/lectures")]
    [Authorize(Roles = "Teacher")]
    public class LectureUploadController : ControllerBase
    {
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<LectureUploadController> _logger;

        public LectureUploadController(IFileUploadService fileUploadService, ILogger<LectureUploadController> logger)
        {
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadLecture([FromForm] LectureUploadRequestDTO uploadRequest)
        {
            try
            {
                // Lấy teacherId từ token JWT
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out int teacherId))
                {
                    return Unauthorized(new { message = "Không xác định được giảng viên. Vui lòng đăng nhập lại." });
                }

                // Thiết lập teacherId từ token
                uploadRequest.TeacherId = teacherId;

                // Validate file
                if (uploadRequest.File == null || uploadRequest.File.Length <= 0)
                {
                    return BadRequest(new { message = "Vui lòng chọn file để tải lên" });
                }

                // Kiểm tra các trường bắt buộc
                if (uploadRequest.CourseId <= 0 || string.IsNullOrEmpty(uploadRequest.Title) || string.IsNullOrEmpty(uploadRequest.Type))
                {
                    return BadRequest(new { message = "Thiếu thông tin bắt buộc: course_id, title, type" });
                }

                // Kiểm tra định dạng file
                if (!_fileUploadService.IsAllowedFileType(uploadRequest.File))
                {
                    return BadRequest(new { message = "Định dạng file không được hỗ trợ. Chỉ chấp nhận: .pdf, .docx, .pptx" });
                }

                // Xử lý tải lên
                var result = await _fileUploadService.UploadLectureAsync(uploadRequest);
                
                // Gọi chuyển đổi PDF tự động nếu là file DOCX hoặc PPTX
                string fileExtension = Path.GetExtension(uploadRequest.File.FileName).ToLowerInvariant();
                if ((fileExtension == ".docx" || fileExtension == ".pptx") && !string.IsNullOrEmpty(result.FilePath))
                {
                    try
                    {
                        // Lấy đường dẫn file đã upload
                        string filePath = result.FilePath;
                        
                        _logger.LogInformation($"Bắt đầu chuyển đổi file sau khi tải lên: {filePath}");
                        
                        // Đường dẫn đến thư mục uploads
                        string uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training", "uploads");
                        string fullPath = filePath;
                        
                        // Đảm bảo có đường dẫn đầy đủ
                        if (!Path.IsPathRooted(filePath))
                        {
                            fullPath = Path.Combine(uploadsFolder, Path.GetFileName(filePath));
                        }
                        
                        _logger.LogInformation($"Đường dẫn đầy đủ file cần chuyển đổi: {fullPath}");
                        
                        // Kiểm tra file tồn tại
                        if (!System.IO.File.Exists(fullPath))
                        {
                            _logger.LogError($"Không tìm thấy file cần chuyển đổi: {fullPath}");
                        }
                        else
                        {
                            // Gọi API chuyển đổi PDF
                            var fileConverter = HttpContext.RequestServices.GetService<IFileConverterService>();
                            if (fileConverter != null)
                            {
                                // Cố gắng chuyển đổi ngay lập tức và đợi kết quả
                                string pdfPath = await fileConverter.ConvertToPdfAsync(fullPath);
                                
                                if (!string.IsNullOrEmpty(pdfPath))
                                {
                                    _logger.LogInformation($"Đã chuyển đổi thành công file {filePath} sang PDF: {pdfPath}");
                                    // Cập nhật kết quả để trả về
                                    result.PdfFilePath = pdfPath;
                                    
                                    // Kiểm tra file PDF đã được tạo
                                    string pdfFullPath = Path.Combine(uploadsFolder, pdfPath);
                                    if (System.IO.File.Exists(pdfFullPath))
                                    {
                                        _logger.LogInformation($"Xác nhận file PDF đã tồn tại: {pdfFullPath}");
                                    }
                                    else
                                    {
                                        _logger.LogWarning($"Không tìm thấy file PDF sau khi chuyển đổi: {pdfFullPath}");
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning($"Không thể chuyển đổi file {filePath} sang PDF khi tải lên");
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Không thể lấy IFileConverterService từ DI container");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi chuyển đổi file sang PDF: {result.FilePath}");
                        // Vẫn trả về kết quả thành công, chỉ ghi log lỗi
                    }
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi tải lên bài giảng: {ex.Message}" });
            }
        }
    }
} 