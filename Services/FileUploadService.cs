using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using System.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;

namespace VirtualAdvisorAPI.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FileUploadService> _logger;
        private readonly HttpClient _httpClient;
        private readonly IFileConverterService _fileConverterService;
        private readonly string[] _allowedExtensions = { ".pdf", ".docx", ".pptx" };

        public FileUploadService(
            AppDbContext context, 
            IWebHostEnvironment webHostEnvironment, 
            IConfiguration configuration,
            ILogger<FileUploadService> logger,
            IHttpClientFactory httpClientFactory,
            IFileConverterService fileConverterService)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _fileConverterService = fileConverterService;
        }

        public async Task<LectureUploadResponseDTO> UploadLectureAsync(LectureUploadRequestDTO request)
        {
            // Validate file
            if (request.File == null || request.File.Length <= 0)
            {
                throw new ArgumentException("File không được để trống");
            }

            // Sanitize filename
            string sanitizedFileName = SanitizeFileName(Path.GetFileName(request.File.FileName));
            string uniqueFileName = $"{Guid.NewGuid()}_{sanitizedFileName}";
            
            // Đường dẫn thư mục lưu trữ
            string uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "uploads");
            string vectorStoreFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "vector_store");
            
            // Tạo thư mục nếu chưa tồn tại
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }
            
            if (!Directory.Exists(vectorStoreFolder))
            {
                Directory.CreateDirectory(vectorStoreFolder);
            }

            // Đường dẫn đầy đủ đến file
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            try
            {
                // Lưu file
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(fileStream);
                }

                _logger.LogInformation($"Đã lưu file tải lên tại: {filePath}");

                // Tạo vector path cho AI training
                string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(uniqueFileName);
                string vectorPath = Path.Combine("vector_store", $"{fileNameWithoutExtension}.pkl");

                // Chuyển đổi file sang PDF nếu là DOCX hoặc PPTX
                string pdfFileName = null;
                string extension = Path.GetExtension(uniqueFileName).ToLowerInvariant();
                
                if (extension == ".docx" || extension == ".pptx")
                {
                    try
                    {
                        _logger.LogInformation($"Bắt đầu tự động chuyển đổi file {uniqueFileName} sang PDF trong quá trình tải lên");
                        
                        // Gọi service chuyển đổi và đợi kết quả
                        pdfFileName = await _fileConverterService.ConvertToPdfAsync(filePath);
                        
                        if (!string.IsNullOrEmpty(pdfFileName))
                        {
                            _logger.LogInformation($"Đã chuyển đổi thành công file sang PDF: {pdfFileName}");
                            
                            // Kiểm tra file PDF đã được tạo
                            string pdfFullPath = Path.Combine(uploadsFolder, pdfFileName);
                            if (File.Exists(pdfFullPath))
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
                            _logger.LogWarning($"Không thể chuyển đổi file {uniqueFileName} sang PDF khi tải lên");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi chuyển đổi file {uniqueFileName} sang PDF");
                        // Tiếp tục quá trình lưu lecture ngay cả khi chuyển đổi thất bại
                    }
                }

                // Tạo lecture mới
                var lecture = new Lecture
                {
                    CourseId = request.CourseId,
                    TeacherId = request.TeacherId,
                    Title = request.Title,
                    Content = request.Content ?? string.Empty,
                    Attachment = uniqueFileName,
                    UploadDate = DateTime.Now,
                    Type = request.Type,
                    Status = "chuahuanluyen",
                    VectorPath = vectorPath,
                    MaxHours = request.MaxHours
                };

                _context.Lectures.Add(lecture);
                await _context.SaveChangesAsync();

                // Thêm vào bảng AI_Training
                var aiTraining = new AITraining
                {
                    LectureId = lecture.LectureId,
                    VectorStorePath = vectorPath,
                    Status = "pending"
                };

                _context.AITrainings.Add(aiTraining);
                await _context.SaveChangesAsync();

                // Trả về kết quả
                return new LectureUploadResponseDTO
                {
                    Message = "File uploaded successfully",
                    LectureId = lecture.LectureId,
                    FilePath = uniqueFileName,
                    PdfFilePath = pdfFileName
                };
            }
            catch (Exception)
            {
                // Xóa file nếu có lỗi
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }
                
                // Xóa file PDF nếu có
                string pdfPath = Path.Combine(uploadsFolder, Path.GetFileNameWithoutExtension(uniqueFileName) + ".pdf");
                if (File.Exists(pdfPath))
                {
                    File.Delete(pdfPath);
                }
                
                throw;
            }
        }

        private async Task<string> ConvertToPdfAsync(string inputFile)
        {
            try
            {
                string libreOfficePath = _configuration["LibreOffice:Path"] ?? @"C:\Program Files\LibreOffice\program\soffice.exe";
                
                // Kiểm tra file thực thi tồn tại
                if (!File.Exists(libreOfficePath))
                {
                    _logger.LogError($"Không tìm thấy LibreOffice tại đường dẫn: {libreOfficePath}");
                    return null;
                }

                // Đảm bảo đường dẫn đầy đủ
                string uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "uploads");
                string fullPath = inputFile;
                
                // Nếu chỉ là tên file hoặc đường dẫn tương đối, tạo đường dẫn đầy đủ
                if (!Path.IsPathRooted(inputFile) || !inputFile.StartsWith(uploadsFolder))
                {
                    fullPath = Path.Combine(uploadsFolder, Path.GetFileName(inputFile));
                }
                
                _logger.LogInformation($"ConvertToPdfAsync - Đường dẫn đầy đủ: {fullPath}");
                
                if (!File.Exists(fullPath))
                {
                    _logger.LogError($"Không tìm thấy file cần chuyển đổi: {fullPath}");
                    return null;
                }

                string outputDir = Path.GetDirectoryName(fullPath);
                string fileNameOnly = Path.GetFileNameWithoutExtension(fullPath);
                
                // Đặt tên file PDF như tên file gốc để dễ tìm kiếm
                string pdfFileName = $"{fileNameOnly}.pdf";
                string outputFile = Path.Combine(outputDir, pdfFileName);

                // Nếu file đã tồn tại, không cần chuyển đổi lại
                if (File.Exists(outputFile))
                {
                    _logger.LogInformation($"File PDF đã tồn tại: {outputFile}");
                    return pdfFileName;  // Chỉ trả về tên file thay vì đường dẫn đầy đủ
                }

                // Tạo process để chạy LibreOffice headless
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = libreOfficePath,
                    Arguments = $"--headless --convert-to pdf --outdir \"{outputDir}\" \"{fullPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                _logger.LogInformation($"Chạy lệnh chuyển đổi khi tải lên: {processStartInfo.FileName} {processStartInfo.Arguments}");

                // Chạy process và đợi kết quả
                using (var process = new Process { StartInfo = processStartInfo })
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
                        _logger.LogError("LibreOffice conversion timeout sau 60 giây");
                        return null;
                    }

                    // Kiểm tra exit code
                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"LibreOffice conversion failed với exit code {process.ExitCode}. Error: {error}");
                        return null;
                    }

                    _logger.LogInformation($"LibreOffice conversion output: {output}");
                    
                    // Kiểm tra file output tồn tại
                    // LibreOffice thường tạo file với tên như file gốc
                    string defaultOutputFile = Path.Combine(outputDir, $"{Path.GetFileNameWithoutExtension(fullPath)}.pdf");
                    
                    if (File.Exists(defaultOutputFile) && defaultOutputFile != outputFile)
                    {
                        // Đổi tên file nếu cần
                        File.Move(defaultOutputFile, outputFile, true);
                    }
                    
                    if (File.Exists(outputFile))
                    {
                        _logger.LogInformation($"Chuyển đổi thành công, file PDF: {outputFile}");
                        return pdfFileName;  // Chỉ trả về tên file thay vì đường dẫn đầy đủ
                    }
                    else
                    {
                        _logger.LogWarning($"Không tìm thấy file PDF sau khi chuyển đổi: {outputFile}");
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi chuyển đổi file {inputFile} sang PDF");
                return null;
            }
        }

        public bool IsAllowedFileType(IFormFile file)
        {
            if (file == null || string.IsNullOrEmpty(file.FileName))
            {
                return false;
            }

            string extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }

        public string SanitizeFileName(string fileName)
        {
            // Loại bỏ các ký tự không hợp lệ trong tên file
            string invalidChars = Regex.Escape(new string(Path.GetInvalidFileNameChars()));
            string invalidRegex = string.Format(@"([{0}]*\.+$)|([{0}]+)", invalidChars);
            
            return Regex.Replace(fileName, invalidRegex, "_");
        }
    }
} 