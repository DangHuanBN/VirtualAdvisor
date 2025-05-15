using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using VirtualAdvisorAPI.Services;
using Microsoft.Extensions.Logging;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminToolsController : ControllerBase
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IFileConverterService _fileConverterService;
        private readonly ILogger<AdminToolsController> _logger;

        public AdminToolsController(
            IWebHostEnvironment hostingEnvironment,
            IFileConverterService fileConverterService,
            ILogger<AdminToolsController> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _fileConverterService = fileConverterService;
            _logger = logger;
        }

        [HttpGet("convert-all-files")]
        public async Task<IActionResult> ConvertAllFiles()
        {
            try
            {
                // Đường dẫn đến thư mục uploads
                string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "uploads");
                
                if (!Directory.Exists(uploadsFolder))
                {
                    return NotFound(new { success = false, message = "Thư mục uploads không tồn tại" });
                }

                // Lấy tất cả file DOCX và PPTX trong thư mục uploads
                var files = Directory.GetFiles(uploadsFolder)
                    .Where(f => f.EndsWith(".docx", StringComparison.OrdinalIgnoreCase) || 
                           f.EndsWith(".pptx", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                if (files.Count == 0)
                {
                    return Ok(new { success = true, message = "Không có file DOCX hoặc PPTX nào trong thư mục uploads" });
                }

                _logger.LogInformation($"Tìm thấy {files.Count} file cần chuyển đổi");

                List<string> successFiles = new List<string>();
                List<string> failedFiles = new List<string>();

                // Chuyển đổi từng file
                foreach (var file in files)
                {
                    try
                    {
                        string fileName = Path.GetFileName(file);
                        _logger.LogInformation($"Đang chuyển đổi file: {fileName}");
                        
                        // Kiểm tra xem đã có file PDF tương ứng chưa
                        string pdfFilePath = Path.Combine(uploadsFolder, Path.GetFileNameWithoutExtension(file) + ".pdf");
                        if (System.IO.File.Exists(pdfFilePath))
                        {
                            _logger.LogInformation($"File PDF đã tồn tại cho {fileName}: {Path.GetFileName(pdfFilePath)}");
                            successFiles.Add($"{fileName} (đã tồn tại)");
                            continue;
                        }
                        
                        // Chuyển đổi file sang PDF
                        string pdfFileName = await _fileConverterService.ConvertToPdfAsync(file);
                        
                        if (!string.IsNullOrEmpty(pdfFileName))
                        {
                            _logger.LogInformation($"Chuyển đổi thành công file {fileName} -> {pdfFileName}");
                            successFiles.Add(fileName);
                        }
                        else
                        {
                            _logger.LogWarning($"Không thể chuyển đổi file {fileName}");
                            failedFiles.Add(fileName);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi chuyển đổi file {file}");
                        failedFiles.Add(Path.GetFileName(file));
                    }
                }

                return Ok(new { 
                    success = true, 
                    message = $"Đã xử lý {files.Count} file", 
                    totalFiles = files.Count,
                    successCount = successFiles.Count,
                    failedCount = failedFiles.Count,
                    successFiles = successFiles,
                    failedFiles = failedFiles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi chuyển đổi tất cả file");
                return StatusCode(500, new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
    }
} 