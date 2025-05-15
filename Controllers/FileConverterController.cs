using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Web;

namespace VirtualAdvisorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileConverterController : ControllerBase
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FileConverterController> _logger;

        public FileConverterController(
            IWebHostEnvironment hostingEnvironment,
            IConfiguration configuration,
            ILogger<FileConverterController> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("convert")]
        public async Task<IActionResult> ConvertToPdf([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { success = false, message = "Đường dẫn file không được để trống" });
                }

                _logger.LogInformation($"Yêu cầu chuyển đổi file: {filePath}");
                
                // Kiểm tra nếu filePath là URL của serve endpoint
                string fileName = filePath;
                if (filePath.Contains("/api/FileConverter/serve"))
                {
                    try
                    {
                        // Trích xuất tên file từ tham số URL
                        int filePathParamIndex = filePath.IndexOf("filePath=");
                        if (filePathParamIndex > 0)
                        {
                            fileName = filePath.Substring(filePathParamIndex + 9); // "filePath=".Length = 9
                            
                            // Nếu có thêm tham số khác sau đó
                            int andIndex = fileName.IndexOf("&");
                            if (andIndex > 0)
                            {
                                fileName = fileName.Substring(0, andIndex);
                            }
                            
                            // Giải mã URL
                            fileName = Uri.UnescapeDataString(fileName);
                            
                            _logger.LogInformation($"Đã trích xuất tên file: {fileName}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi khi trích xuất tên file từ URL");
                        return BadRequest(new { success = false, message = $"Không thể trích xuất tên file từ URL: {ex.Message}" });
                    }
                }

                // Đảm bảo đường dẫn là từ thư mục uploads
                string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "uploads");
                string fullPath = Path.Combine(uploadsFolder, Path.GetFileName(fileName));
                
                _logger.LogInformation($"Đường dẫn đầy đủ: {fullPath}");

                // Kiểm tra file tồn tại
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning($"Không tìm thấy file: {fullPath}");
                    return NotFound(new { success = false, message = "Không tìm thấy file" });
                }

                string extension = Path.GetExtension(fullPath).ToLowerInvariant();
                if (extension == ".pdf")
                {
                    // Đã là PDF, trả về đường dẫn
                    string relativePath = $"/api/FileConverter/serve?filePath={Path.GetFileName(fullPath)}";
                    
                    return Ok(new { success = true, filePath = relativePath });
                }

                if (extension != ".docx" && extension != ".pptx")
                {
                    return BadRequest(new { success = false, message = "Chỉ hỗ trợ chuyển đổi từ DOCX hoặc PPTX sang PDF" });
                }

                // Lấy guid và tên file gốc từ tên file đầy đủ
                string filenameWithoutExt = Path.GetFileNameWithoutExtension(fullPath);
                
                // Tìm kiếm file PDF có tên giống với tên file gốc trong thư mục
                string pdfFileName = $"{filenameWithoutExt}.pdf";
                string pdfFilePath = Path.Combine(uploadsFolder, pdfFileName);
                
                // Nếu file PDF đã tồn tại (được tạo tự động khi upload), sử dụng nó
                if (System.IO.File.Exists(pdfFilePath))
                {
                    _logger.LogInformation($"Đã tìm thấy file PDF có sẵn: {pdfFilePath}");
                    string relativePath = $"/api/FileConverter/serve?filePath={Path.GetFileName(pdfFilePath)}";
                    return Ok(new { success = true, filePath = relativePath });
                }

                // Nếu file PDF chưa tồn tại, thực hiện chuyển đổi
                string outputPath = Path.Combine(uploadsFolder, pdfFileName);

                // Thực hiện chuyển đổi bằng LibreOffice
                bool conversionSuccess = await ConvertFileToPdfWithLibreOffice(fullPath, outputPath);
                
                if (!conversionSuccess)
                {
                    return StatusCode(500, new { success = false, message = "Chuyển đổi file không thành công" });
                }

                // Trả về đường dẫn tương đối đến file PDF
                string relativeOutputPath = $"/api/FileConverter/serve?filePath={Path.GetFileName(outputPath)}";

                return Ok(new { success = true, filePath = relativeOutputPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi chuyển đổi file sang PDF");
                return StatusCode(500, new { success = false, message = $"Lỗi khi chuyển đổi file: {ex.Message}" });
            }
        }

        private async Task<bool> ConvertFileToPdfWithLibreOffice(string inputFile, string outputFile)
        {
            try
            {
                // Lấy đường dẫn đến LibreOffice từ cấu hình hoặc sử dụng giá trị mặc định
                string libreOfficePath = _configuration["LibreOffice:Path"] ?? @"C:\Program Files\LibreOffice\program\soffice.exe";
                
                // Kiểm tra file thực thi tồn tại
                if (!System.IO.File.Exists(libreOfficePath))
                {
                    _logger.LogError($"Không tìm thấy LibreOffice tại đường dẫn: {libreOfficePath}");
                    return false;
                }

                // Đảm bảo đường dẫn output không chứa ký tự đặc biệt
                string outputDir = Path.GetDirectoryName(outputFile);
                string safeOutputFileName = Path.GetFileName(outputFile);
                safeOutputFileName = Regex.Replace(safeOutputFileName, @"[^\w\.-]", "_");
                outputFile = Path.Combine(outputDir, safeOutputFileName);

                // Tạo process để chạy LibreOffice headless
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = libreOfficePath,
                    Arguments = $"--headless --convert-to pdf --outdir \"{outputDir}\" \"{inputFile}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                _logger.LogInformation($"Chạy lệnh: {processStartInfo.FileName} {processStartInfo.Arguments}");

                // Chạy process và đợi kết quả
                using (var process = new Process { StartInfo = processStartInfo })
                {
                    process.Start();
                    
                    // Đọc output và error
                    string output = await process.StandardOutput.ReadToEndAsync();
                    string error = await process.StandardError.ReadToEndAsync();
                    
                    // Đợi process kết thúc với timeout 30 giây
                    bool completed = process.WaitForExit(30000);
                    
                    if (!completed)
                    {
                        try { process.Kill(); } catch { }
                        _logger.LogError("LibreOffice conversion timeout sau 30 giây");
                        return false;
                    }

                    // Kiểm tra exit code
                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"LibreOffice conversion failed với exit code {process.ExitCode}. Error: {error}");
                        return false;
                    }

                    _logger.LogInformation($"LibreOffice conversion output: {output}");
                    
                    // Kiểm tra file output tồn tại
                    string expectedOutput = Path.Combine(outputDir, Path.GetFileNameWithoutExtension(inputFile) + ".pdf");
                    if (System.IO.File.Exists(expectedOutput) && expectedOutput != outputFile)
                    {
                        // Nếu LibreOffice tạo file với tên khác, đổi tên file
                        System.IO.File.Move(expectedOutput, outputFile, true);
                    }

                    return System.IO.File.Exists(outputFile);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi chuyển đổi file {inputFile} sang PDF");
                return false;
            }
        }

        [HttpGet("serve")]
        [HttpHead("serve")]
        [HttpOptions("serve")]
        public IActionResult ServeFile([FromQuery] string filePath)
        {
            // Xử lý CORS cho OPTIONS request
            if (HttpContext.Request.Method == "OPTIONS")
            {
                Response.Headers.Add("Access-Control-Allow-Origin", "*");
                Response.Headers.Add("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
                return Ok();
            }

            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return BadRequest(new { success = false, message = "Đường dẫn file không được để trống" });
                }

                _logger.LogInformation($"Yêu cầu phục vụ file: {filePath}");
                
                // Chuẩn hóa đường dẫn tệp
                filePath = filePath.Replace("/", "\\").TrimStart('\\');
                
                // Đảm bảo đường dẫn là từ thư mục AI_Training/uploads
                string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "uploads");
                string fullPath = Path.Combine(uploadsFolder, Path.GetFileName(filePath));
                
                _logger.LogInformation($"Đường dẫn đầy đủ: {fullPath}");

                // Kiểm tra file tồn tại
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning($"Không tìm thấy file: {fullPath}");
                    return NotFound(new { success = false, message = "Không tìm thấy file" });
                }

                string extension = Path.GetExtension(fullPath).ToLowerInvariant();
                
                // Nếu yêu cầu là file DOCX hoặc PPTX, kiểm tra xem có file PDF tương ứng không
                if (extension == ".docx" || extension == ".pptx")
                {
                    string pdfFileName = Path.GetFileNameWithoutExtension(fullPath) + ".pdf";
                    string pdfFilePath = Path.Combine(uploadsFolder, pdfFileName);
                    
                    // Nếu file PDF tồn tại, phục vụ file PDF thay vì file gốc
                    if (System.IO.File.Exists(pdfFilePath))
                    {
                        _logger.LogInformation($"Phát hiện file PDF ({pdfFilePath}), sử dụng nó thay vì file gốc");
                        string contentType = "application/pdf";
                        var pdfFileStream = new FileStream(pdfFilePath, FileMode.Open, FileAccess.Read);
                        return File(pdfFileStream, contentType, pdfFileName);
                    }
                    
                    _logger.LogInformation($"Không tìm thấy bản PDF của file: {filePath}");
                }

                // Phục vụ file gốc nếu không tìm thấy PDF hoặc file không phải loại cần chuyển đổi
                string originalContentType = GetContentType(extension);
                _logger.LogInformation($"Loại nội dung: {originalContentType}");

                // Phục vụ tệp
                var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
                return File(fileStream, originalContentType, Path.GetFileName(fullPath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi phục vụ file");
                return StatusCode(500, new { success = false, message = $"Lỗi khi phục vụ file: {ex.Message}" });
            }
        }
        
        private string GetContentType(string extension)
        {
            switch (extension.ToLower())
            {
                case ".pdf":
                    return "application/pdf";
                case ".docx":
                    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case ".pptx":
                    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                case ".xlsx":
                    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                case ".jpg":
                case ".jpeg":
                    return "image/jpeg";
                case ".png":
                    return "image/png";
                case ".gif":
                    return "image/gif";
                case ".mp4":
                    return "video/mp4";
                case ".mp3":
                    return "audio/mpeg";
                default:
                    return "application/octet-stream";
            }
        }
    }
} 