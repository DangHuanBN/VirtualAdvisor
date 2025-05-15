using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace VirtualAdvisorAPI.Services
{
    public class ExamService : IExamService
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly ILogger<ExamService> _logger;

        public ExamService(
            IWebHostEnvironment hostingEnvironment,
            ILogger<ExamService> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;
        }

        /// <summary>
        /// Gọi file Python để xử lý file đề thi và tạo file JSON
        /// </summary>
        public async Task<string> ProcessExamLecture(string filePath, int lectureId)
        {
            try
            {
                _logger.LogInformation($"ExamService - Bắt đầu xử lý file bài kiểm tra/bài thi: {filePath} với lectureId: {lectureId}");

                // Đường dẫn đầy đủ đến file exam.py
                string pythonScript = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "exam.py");
                
                // Kiểm tra file Python tồn tại
                if (!File.Exists(pythonScript))
                {
                    _logger.LogError($"ExamService - Không tìm thấy file Python: {pythonScript}");
                    return null;
                }

                // Đường dẫn đầy đủ đến file đề thi
                string fullPath = filePath;
                if (!Path.IsPathRooted(filePath))
                {
                    string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "uploads");
                    fullPath = Path.Combine(uploadsFolder, Path.GetFileName(filePath));
                }

                // Kiểm tra file đề thi tồn tại
                if (!File.Exists(fullPath))
                {
                    _logger.LogWarning($"ExamService - Không tìm thấy file đề thi: {fullPath}");
                    return null;
                }
                
                // Tạo thư mục json nếu chưa tồn tại
                string jsonFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training", "json");
                if (!Directory.Exists(jsonFolder))
                {
                    Directory.CreateDirectory(jsonFolder);
                }
                
                // Tạo process để chạy Python script
                var psi = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = $"\"{pythonScript}\" \"{fullPath}\" {lectureId}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.Combine(_hostingEnvironment.ContentRootPath, "AI_Training")
                };

                _logger.LogInformation($"ExamService - Thực thi lệnh: {psi.FileName} {psi.Arguments}");

                // Chạy process và đợi kết quả
                using (var process = new Process { StartInfo = psi })
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
                        _logger.LogError("ExamService - Python script execution timeout sau 60 giây");
                        return null;
                    }

                    // Kiểm tra exit code
                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"ExamService - Python script execution failed với exit code {process.ExitCode}. Error: {error}");
                        return null;
                    }

                    _logger.LogInformation($"ExamService - Python script output: {output}");
                }
                
                // Tạo đường dẫn tới file JSON đầu ra
                string jsonFilePath = Path.Combine(jsonFolder, $"test_lecture_{lectureId}.json");
                
                // Kiểm tra file JSON có tồn tại không
                if (File.Exists(jsonFilePath))
                {
                    _logger.LogInformation($"ExamService - Đã tạo thành công file JSON: {jsonFilePath}");
                    return $"AI_Training/json/test_lecture_{lectureId}.json";
                }
                else
                {
                    _logger.LogWarning($"ExamService - Không tìm thấy file JSON đầu ra: {jsonFilePath}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"ExamService - Lỗi khi xử lý file bài kiểm tra {filePath}: {ex.Message}");
                return null;
            }
        }
    }
} 