using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace VirtualAdvisorAPI.Alerts
{
    /// <summary>
    /// Lớp tích hợp với hệ thống cảnh báo học tập từ Python
    /// </summary>
    public class TestAlertIntegration
    {
        /// <summary>
        /// Gửi cảnh báo học tập sau khi sinh viên làm bài kiểm tra hoặc bài thi
        /// </summary>
        /// <param name="userId">ID của sinh viên</param>
        /// <param name="lectureId">ID của bài kiểm tra hoặc bài thi</param>
        /// <param name="progress">Tiến độ học tập (0-100)</param>
        /// <param name="answers">Từ điển chứa câu trả lời của sinh viên, dạng {"0": "A", "1": "B", ...}</param>
        /// <returns>True nếu thành công, False nếu có lỗi</returns>
        public static async Task<bool> GenerateTestAlerts(int userId, int lectureId, decimal progress, Dictionary<string, string> answers)
        {
            try
            {
                // Đường dẫn tới thư mục gốc của ứng dụng
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                
                // Đường dẫn tới script Python
                string scriptPath = Path.Combine(baseDir, "alerts", "test_alerts.py");
                
                // Nếu không tìm thấy file Python ở thư mục bin, tìm trong thư mục gốc
                if (!File.Exists(scriptPath))
                {
                    // Thử tìm từ thư mục gốc của ứng dụng
                    string appRootDir = Directory.GetCurrentDirectory();
                    scriptPath = Path.Combine(appRootDir, "alerts", "test_alerts.py");
                    
                    if (!File.Exists(scriptPath))
                    {
                        return false;
                    }
                }
                
                // Tạo file tạm để lưu câu trả lời
                string answersFilePath = Path.Combine(Path.GetTempPath(), $"answers_{userId}_{lectureId}_{Guid.NewGuid()}.json");
                string answersJson = JsonSerializer.Serialize(answers);
                await File.WriteAllTextAsync(answersFilePath, answersJson);
                
                // Tạo process để chạy Python script
                var processInfo = new ProcessStartInfo
                {
                    FileName = "python", // Hoặc "python3" tùy thuộc vào môi trường
                    Arguments = $"\"{scriptPath}\" {userId} {lectureId} {progress} \"{answersFilePath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                
                // Chạy process
                using var process = Process.Start(processInfo);
                if (process == null)
                {
                    return false;
                }
                
                // Đọc output
                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();
                
                // Đợi process kết thúc
                await process.WaitForExitAsync();
                
                // Xóa file tạm
                if (File.Exists(answersFilePath))
                {
                    File.Delete(answersFilePath);
                }
                
                // Kiểm tra kết quả
                bool success = process.ExitCode == 0;
                
                return success;
            }
            catch (Exception ex)
            {
                // Vẫn giữ lại log lỗi quan trọng này
                Console.WriteLine($"Lỗi khi tạo cảnh báo học tập: {ex.Message}");
                return false;
            }
        }
    }
} 