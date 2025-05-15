using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Linq;

namespace VirtualAdvisorAPI.Services
{
    public class FileConverterService : IFileConverterService
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FileConverterService> _logger;

        public FileConverterService(
            IWebHostEnvironment hostingEnvironment,
            IConfiguration configuration,
            ILogger<FileConverterService> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Chuyển đổi file sang PDF
        /// </summary>
        /// <param name="filePath">Đường dẫn tương đối hoặc tên file</param>
        /// <returns>Đường dẫn tương đối đến file PDF đã chuyển đổi</returns>
        public async Task<string> ConvertToPdfAsync(string filePath)
        {
            try
            {
                _logger.LogInformation($"FileConverterService - Bắt đầu chuyển đổi file: {filePath}");

                // Đường dẫn tệp đầy đủ
                string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "uploads");
                string fullPath = filePath;
                
                // Nếu chỉ là tên file hoặc đường dẫn tương đối, tạo đường dẫn đầy đủ
                if (!Path.IsPathRooted(filePath))
                {
                    fullPath = Path.Combine(uploadsFolder, Path.GetFileName(filePath));
                }
                
                _logger.LogInformation($"FileConverterService - Đường dẫn đầy đủ: {fullPath}");

                // Kiểm tra file tồn tại
                if (!File.Exists(fullPath))
                {
                    _logger.LogWarning($"FileConverterService - Không tìm thấy file: {fullPath}");
                    return null;
                }

                string extension = Path.GetExtension(fullPath).ToLowerInvariant();
                
                // Kiểm tra nếu là PDF, không cần chuyển đổi
                if (extension == ".pdf")
                {
                    _logger.LogInformation($"FileConverterService - File đã là PDF: {fullPath}");
                    return Path.GetFileName(fullPath);
                }

                // Chỉ hỗ trợ chuyển đổi từ DOCX hoặc PPTX
                if (extension != ".docx" && extension != ".pptx")
                {
                    _logger.LogWarning($"FileConverterService - Định dạng không hỗ trợ chuyển đổi: {extension}");
                    return null;
                }

                // Đường dẫn file PDF đầu ra
                string fileNameWithoutExt = Path.GetFileNameWithoutExtension(fullPath);
                string pdfFileName = $"{fileNameWithoutExt}.pdf";
                string outputPath = Path.Combine(uploadsFolder, pdfFileName);
                
                // Nếu file PDF đã tồn tại, trả về ngay
                if (File.Exists(outputPath))
                {
                    _logger.LogInformation($"FileConverterService - File PDF đã tồn tại: {outputPath}");
                    return pdfFileName;
                }

                // Thực hiện chuyển đổi bằng LibreOffice
                string libreOfficePath = _configuration["LibreOffice:Path"] ?? @"C:\Program Files\LibreOffice\program\soffice.exe";
                
                // Kiểm tra file thực thi tồn tại
                if (!File.Exists(libreOfficePath))
                {
                    _logger.LogError($"FileConverterService - Không tìm thấy LibreOffice tại đường dẫn: {libreOfficePath}");
                    return null;
                }
                
                _logger.LogInformation($"FileConverterService - LibreOffice tồn tại tại: {libreOfficePath}");

                // Tạo process để chạy LibreOffice headless
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = libreOfficePath,
                    Arguments = $"--headless --convert-to pdf --outdir \"{uploadsFolder}\" \"{fullPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                _logger.LogInformation($"FileConverterService - Thực thi lệnh: {processStartInfo.FileName} {processStartInfo.Arguments}");

                // Chạy process và đợi kết quả
                using (var process = new Process { StartInfo = processStartInfo })
                {
                    try
                    {
                        process.Start();
                        
                        // Đọc output và error
                        string output = await process.StandardOutput.ReadToEndAsync();
                        string error = await process.StandardError.ReadToEndAsync();
                        
                        // Đợi process kết thúc với timeout 60 giây
                        bool completed = process.WaitForExit(60000);
                        
                        if (!completed)
                        {
                            try { process.Kill(); } catch { }
                            _logger.LogError("FileConverterService - LibreOffice conversion timeout sau 60 giây");
                            return null;
                        }

                        // Kiểm tra exit code
                        if (process.ExitCode != 0)
                        {
                            _logger.LogError($"FileConverterService - LibreOffice conversion failed với exit code {process.ExitCode}. Error: {error}");
                            return null;
                        }

                        _logger.LogInformation($"FileConverterService - LibreOffice conversion output: {output}");
                        
                        // Chờ một chút để file có thể được tạo hoàn toàn
                        await Task.Delay(1000);
                        
                        // Kiểm tra file output tồn tại
                        if (File.Exists(outputPath))
                        {
                            _logger.LogInformation($"FileConverterService - Đã tạo thành công file PDF: {outputPath}");
                            return pdfFileName;
                        }
                        else
                        {
                            // Kiểm tra nếu file được tạo với tên khác
                            string expectedOutput = Path.Combine(uploadsFolder, $"{fileNameWithoutExt}.pdf");
                            
                            if (File.Exists(expectedOutput) && expectedOutput != outputPath)
                            {
                                // Đổi tên file nếu cần
                                File.Move(expectedOutput, outputPath, true);
                                _logger.LogInformation($"FileConverterService - Đã đổi tên file PDF: {expectedOutput} -> {outputPath}");
                                return pdfFileName;
                            }
                            
                            _logger.LogWarning($"FileConverterService - Không tìm thấy file PDF sau khi chuyển đổi: {outputPath}");
                            
                            // Kiểm tra toàn bộ thư mục để xem có file PDF nào vừa được tạo hay không
                            var pdfFiles = Directory.GetFiles(uploadsFolder, "*.pdf")
                                .Where(f => new FileInfo(f).CreationTime > DateTime.Now.AddMinutes(-5))
                                .ToList();
                                
                            if (pdfFiles.Any())
                            {
                                _logger.LogInformation($"FileConverterService - Tìm thấy các file PDF mới được tạo: {string.Join(", ", pdfFiles)}");
                            }
                            
                            return null;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"FileConverterService - Lỗi khi thực thi LibreOffice: {ex.Message}");
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"FileConverterService - Lỗi khi chuyển đổi file {filePath} sang PDF: {ex.Message}");
                return null;
            }
        }
    }
} 