using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace VirtualAdvisorAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // Tạm thời bỏ [Authorize] để kiểm tra lỗi
    //[Authorize(Roles = "Admin,admin")]
    public class BackupController : ControllerBase
    {
        private readonly IBackupService _backupService;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<BackupController> _logger;

        public BackupController(
            IBackupService backupService,
            IWebHostEnvironment environment,
            ILogger<BackupController> logger)
        {
            _backupService = backupService;
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Thực hiện sao lưu toàn bộ cơ sở dữ liệu
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> BackupDatabase()
        {
            try
            {
                _logger.LogInformation("Bắt đầu sao lưu cơ sở dữ liệu");
                var (success, fileName, message) = await _backupService.BackupDatabaseAsync();

                if (success)
                {
                    _logger.LogInformation("Sao lưu cơ sở dữ liệu thành công: {FileName}", fileName);
                    return Ok(new { 
                        success = true, 
                        fileName, 
                        message,
                        timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    });
                }
                else
                {
                    _logger.LogWarning("Sao lưu cơ sở dữ liệu thất bại: {Message}", message);
                    return BadRequest(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xử lý được khi sao lưu cơ sở dữ liệu");
                return StatusCode(500, new { success = false, message = $"Lỗi khi sao lưu: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy danh sách các file backup
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetBackupFiles()
        {
            try
            {
                var files = await _backupService.GetBackupFilesAsync();
                
                // Bổ sung thông tin về kích thước file và thời gian tạo
                var backupDir = Path.Combine(_environment.ContentRootPath, "BackupFiles");
                var fileDetails = files.Select(fileName => {
                    var filePath = Path.Combine(backupDir, fileName);
                    var fileInfo = new FileInfo(filePath);
                    
                    return new {
                        fileName,
                        size = fileInfo.Length,
                        sizeFormatted = FormatFileSize(fileInfo.Length),
                        createdDate = fileInfo.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
                    };
                }).ToList();
                
                return Ok(fileDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi lấy danh sách file backup: {ex.Message}" });
            }
        }

        /// <summary>
        /// Tải xuống file backup
        /// </summary>
        [HttpGet("downloads/{fileName}")]
        public async Task<IActionResult> DownloadBackupFile(string fileName)
        {
            try
            {
                // Kiểm tra tên file hợp lệ để tránh directory traversal
                if (string.IsNullOrEmpty(fileName) || fileName.Contains(".."))
                {
                    return BadRequest("Tên file không hợp lệ");
                }

                var files = await _backupService.GetBackupFilesAsync();
                var fileExists = files.Any(f => f == fileName);
                
                if (!fileExists)
                {
                    return NotFound("Không tìm thấy file");
                }

                // Lấy đường dẫn đầy đủ của file backup
                var backupDirectory = Path.Combine(Directory.GetCurrentDirectory(), "BackupFiles");
                var filePath = Path.Combine(backupDirectory, fileName);

                // Kiểm tra file tồn tại
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("Không tìm thấy file");
                }

                // Đọc file và trả về như một file download
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                return File(fileBytes, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tải xuống file backup: {fileName}", fileName);
                return StatusCode(500, "Đã xảy ra lỗi khi tải xuống file backup");
            }
        }

        /// <summary>
        /// Format kích thước file để hiển thị
        /// </summary>
        private string FormatFileSize(long bytes)
        {
            string[] suffixes = { "B", "KB", "MB", "GB", "TB" };
            int counter = 0;
            decimal number = bytes;
            
            while (Math.Round(number / 1024) >= 1)
            {
                number /= 1024;
                counter++;
            }
            
            return $"{number:n2} {suffixes[counter]}";
        }

        /// <summary>
        /// Phục hồi cơ sở dữ liệu từ file backup
        /// </summary>
        [HttpPost("restore/{fileName}")]
        public async Task<IActionResult> RestoreDatabase(string fileName)
        {
            try
            {
                // Kiểm tra tên file để tránh lỗi bảo mật
                if (string.IsNullOrEmpty(fileName) || !fileName.StartsWith("backup_") || !fileName.EndsWith(".sql"))
                {
                    return BadRequest(new { success = false, message = "Tên file không hợp lệ" });
                }
                
                var (success, message) = await _backupService.RestoreDatabaseAsync(fileName);
                
                if (success)
                {
                    return Ok(new { 
                        success = true, 
                        message,
                        timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi phục hồi cơ sở dữ liệu: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thực hiện khôi phục cơ sở dữ liệu từ file sao lưu
        /// </summary>
        /// <param name="fileName">Tên file sao lưu</param>
        /// <returns>Kết quả khôi phục</returns>
        [HttpPost("restoredatabase")]
        public async Task<IActionResult> RestoreDatabaseFromQuery([FromQuery] string fileName)
        {
            try
            {
                if (string.IsNullOrEmpty(fileName))
                {
                    _logger.LogWarning("Yêu cầu khôi phục cơ sở dữ liệu với tên file trống");
                    return BadRequest(new
                    {
                        success = false,
                        message = "Tên file sao lưu không được cung cấp"
                    });
                }

                // Kiểm tra tên file để tránh lỗi bảo mật
                if (!fileName.StartsWith("backup_") || !fileName.EndsWith(".sql"))
                {
                    _logger.LogWarning("Yêu cầu khôi phục cơ sở dữ liệu với tên file không hợp lệ: {FileName}", fileName);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Tên file sao lưu không hợp lệ"
                    });
                }

                // Thực hiện khôi phục cơ sở dữ liệu
                var (success, message) = await _backupService.RestoreDatabaseAsync(fileName);

                if (success)
                {
                    _logger.LogInformation("Khôi phục cơ sở dữ liệu thành công từ file: {FileName}", fileName);
                    return Ok(new
                    {
                        success = true,
                        message,
                        timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    });
                }
                else
                {
                    _logger.LogWarning("Khôi phục cơ sở dữ liệu thất bại từ file: {FileName}. Lỗi: {Message}", fileName, message);
                    return BadRequest(new
                    {
                        success = false,
                        message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xử lý được khi khôi phục cơ sở dữ liệu từ file: {FileName}", fileName);
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Lỗi khi khôi phục cơ sở dữ liệu: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Trả về kích thước của file sao lưu
        /// </summary>
        /// <param name="fileName">Tên file sao lưu</param>
        /// <returns>Kích thước file được định dạng</returns>
        [HttpGet("getbackupfilesize")]
        public IActionResult GetBackupFileSize([FromQuery] string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
            {
                return BadRequest(new { Success = false, Message = "Tên file không được để trống" });
            }
            
            try
            {
                string backupPath = Path.Combine(Directory.GetCurrentDirectory(), "BackupFiles", fileName);
                if (!System.IO.File.Exists(backupPath))
                {
                    return NotFound(new { Success = false, Message = "Không tìm thấy file sao lưu" });
                }
                
                var fileInfo = new FileInfo(backupPath);
                string fileSize = FormatFileSize(fileInfo.Length);
                
                return Ok(new { Success = true, FileSize = fileSize });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy kích thước file {FileName}", fileName);
                return StatusCode(500, new { Success = false, Message = $"Lỗi: {ex.Message}" });
            }
        }
    }
} 