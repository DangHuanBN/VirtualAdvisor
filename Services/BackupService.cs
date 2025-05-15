using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using VirtualAdvisorAPI.Data;
using Microsoft.Extensions.Logging;
using System.Text;
using MySql.Data.MySqlClient;

namespace VirtualAdvisorAPI.Services
{
    public class BackupService : IBackupService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly string _backupFolderPath;
        private readonly ILogger<BackupService> _logger;

        public BackupService(
            AppDbContext context,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<BackupService> logger)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
            
            // Tạo thư mục BackupFiles trong thư mục gốc của ứng dụng
            _backupFolderPath = Path.Combine(_environment.ContentRootPath, "BackupFiles");
            
            // Đảm bảo thư mục tồn tại
            if (!Directory.Exists(_backupFolderPath))
            {
                Directory.CreateDirectory(_backupFolderPath);
            }
        }

        /// <summary>
        /// Thực hiện sao lưu toàn bộ cơ sở dữ liệu
        /// </summary>
        /// <returns>Thông tin về file backup đã tạo</returns>
        public async Task<(bool Success, string FileName, string Message)> BackupDatabaseAsync()
        {
            try
            {
                // Lấy thông tin kết nối
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                
                _logger.LogInformation($"Connection string: {connectionString}");

                // Tạo tên file backup
                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                string fileName = $"backup_{timestamp}.sql";
                string backupFilePath = Path.Combine(_backupFolderPath, fileName);
                
                // Sửa lại đường dẫn để đảm bảo đúng định dạng Windows
                backupFilePath = backupFilePath.Replace("/", "\\");
                
                _logger.LogInformation($"Đường dẫn tệp sao lưu: {backupFilePath}");

                // Đảm bảo thư mục backup tồn tại
                Directory.CreateDirectory(_backupFolderPath);

                // Nếu file backup đã tồn tại, xóa nó
                if (File.Exists(backupFilePath))
                {
                    File.Delete(backupFilePath);
                }

                // Lấy thông tin XAMPP MySQL
                string server = GetConnectionStringValue(connectionString, "server");
                string database = GetConnectionStringValue(connectionString, "database");
                string userId = GetConnectionStringValue(connectionString, "user id");
                string password = ""; // Không sử dụng mật khẩu
                string portStr = GetConnectionStringValue(connectionString, "port");
                int port = 3306;
                if (!string.IsNullOrEmpty(portStr) && int.TryParse(portStr, out int parsedPort))
                {
                    port = parsedPort;
                }

                // Tìm mysqldump trong XAMPP
                string mysqldumpPath = @"D:\PHP\XAMPP\mysql\bin\mysqldump.exe";
                
                // Kiểm tra xem file có tồn tại không
                if (!File.Exists(mysqldumpPath))
                {
                    // Thử các đường dẫn XAMPP khác
                    string[] possibleXamppPaths = {
                        @"D:\PHP\XAMPP\mysql\bin\mysqldump.exe",
                        @"C:\xampp\mysql\bin\mysqldump.exe",
                        @"D:\xampp\mysql\bin\mysqldump.exe",
                        @"E:\xampp\mysql\bin\mysqldump.exe"
                    };
                    
                    foreach (string path in possibleXamppPaths)
                    {
                        if (File.Exists(path))
                        {
                            mysqldumpPath = path;
                            break;
                        }
                    }
                }
                
                if (!File.Exists(mysqldumpPath))
                {
                    // Không tìm thấy mysqldump, trả về lỗi
                    _logger.LogError("Không tìm thấy mysqldump trong XAMPP. Vui lòng cài đặt XAMPP hoặc kiểm tra đường dẫn.");
                    return (false, string.Empty, "Không tìm thấy mysqldump trong XAMPP. Vui lòng cài đặt XAMPP hoặc kiểm tra đường dẫn.");
                }
                
                // Thực hiện lệnh mysqldump để backup
                var processInfo = new ProcessStartInfo
                {
                    FileName = mysqldumpPath,
                    Arguments = $"--host={server} --port={port} --user={userId} --databases {database} --result-file={backupFilePath}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                
                _logger.LogInformation($"Thực thi lệnh sao lưu: {mysqldumpPath} {processInfo.Arguments}");
                
                try
                {
                    using var process = Process.Start(processInfo);
                    if (process != null)
                    {
                        string output = await process.StandardOutput.ReadToEndAsync();
                        string error = await process.StandardError.ReadToEndAsync();
                        
                        await process.WaitForExitAsync();
                        
                        if (process.ExitCode != 0)
                        {
                            _logger.LogError($"Lỗi khi sao lưu cơ sở dữ liệu với mysqldump: {error}");
                            return (false, string.Empty, $"Lỗi khi sao lưu: {error}");
                        }
                    }
                    else
                    {
                        _logger.LogError("Không thể khởi chạy mysqldump");
                        return (false, string.Empty, "Không thể khởi chạy mysqldump");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Lỗi khi thực thi mysqldump: {ex.Message}");
                    return (false, string.Empty, $"Lỗi khi thực thi mysqldump: {ex.Message}");
                }
                
                if (File.Exists(backupFilePath))
                {
                    _logger.LogInformation($"Sao lưu cơ sở dữ liệu thành công: {fileName}");
                    return (true, fileName, $"Đã sao lưu thành công cơ sở dữ liệu vào tệp {fileName}");
                }
                else
                {
                    return (false, string.Empty, "Không tạo được tệp sao lưu");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi sao lưu cơ sở dữ liệu: {ex.Message}");
                return (false, string.Empty, $"Lỗi khi sao lưu: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách các file backup hiện có
        /// </summary>
        /// <returns>Danh sách các file backup</returns>
        public async Task<List<string>> GetBackupFilesAsync()
        {
            return await Task.Run(() =>
            {
                if (!Directory.Exists(_backupFolderPath))
                {
                    return new List<string>();
                }

                return Directory.GetFiles(_backupFolderPath, "backup_*.sql")
                    .Select(Path.GetFileName)
                    .OrderByDescending(f => f)
                    .ToList();
            });
        }

        /// <summary>
        /// Phục hồi cơ sở dữ liệu từ file backup
        /// </summary>
        /// <param name="fileName">Tên file backup để phục hồi</param>
        /// <returns>Kết quả thực hiện: thành công hay thất bại và thông báo</returns>
        public async Task<(bool Success, string Message)> RestoreDatabaseAsync(string fileName)
        {
            _logger.LogInformation("Bắt đầu khôi phục cơ sở dữ liệu từ tệp '{FileName}'", fileName);
            try
            {
                // Kiểm tra tham số đầu vào
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    return (false, "Tên tệp không được để trống");
                }

                // Đảm bảo tệp không chứa đường dẫn
                fileName = Path.GetFileName(fileName);
                
                // Kiểm tra đường dẫn tệp sao lưu
                string backupFilePath = Path.Combine(_backupFolderPath, fileName);
                backupFilePath = backupFilePath.Replace("/", "\\");
                
                _logger.LogInformation($"Đường dẫn tệp khôi phục: {backupFilePath}");
                
                if (!File.Exists(backupFilePath))
                {
                    _logger.LogWarning("Tệp sao lưu không tồn tại: {BackupPath}", backupFilePath);
                    return (false, $"Tệp sao lưu không tồn tại: {fileName}");
                }

                // Lấy chuỗi kết nối từ cấu hình
                string connectionString = _configuration.GetConnectionString("DefaultConnection");
                _logger.LogInformation("Đang sử dụng chuỗi kết nối: {ConnectionString}", connectionString);

                if (string.IsNullOrEmpty(connectionString))
                {
                    _logger.LogError("Không tìm thấy chuỗi kết nối trong cấu hình");
                    return (false, "Không tìm thấy chuỗi kết nối trong cấu hình");
                }

                // Lấy thông tin kết nối
                string server = GetConnectionStringValue(connectionString, "server");
                string database = GetConnectionStringValue(connectionString, "database");
                string userId = GetConnectionStringValue(connectionString, "user id");
                string password = ""; // Không sử dụng mật khẩu
                
                // Kiểm tra thông tin kết nối cần thiết
                if (string.IsNullOrEmpty(server))
                {
                    _logger.LogError("Không tìm thấy tham số 'server' trong chuỗi kết nối");
                    return (false, "Cấu hình máy chủ MySQL không hợp lệ");
                }

                if (string.IsNullOrEmpty(database))
                {
                    _logger.LogError("Không tìm thấy tham số 'database' trong chuỗi kết nối");
                    return (false, "Cấu hình cơ sở dữ liệu không hợp lệ");
                }

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogError("Không tìm thấy tham số 'user id' trong chuỗi kết nối");
                    return (false, "Cấu hình người dùng MySQL không hợp lệ");
                }

                // Lấy cổng kết nối, mặc định là 3306
                string portStr = GetConnectionStringValue(connectionString, "port");
                int port = 3306;
                if (!string.IsNullOrEmpty(portStr) && !int.TryParse(portStr, out port))
                {
                    _logger.LogWarning("Không thể phân tích cổng kết nối '{Port}', sử dụng cổng mặc định 3306", portStr);
                    port = 3306;
                }

                // Tìm mysql.exe trong XAMPP
                string mysqlPath = @"D:\PHP\XAMPP\mysql\bin\mysql.exe";
                
                // Kiểm tra xem file có tồn tại không
                if (!File.Exists(mysqlPath))
                {
                    // Thử các đường dẫn XAMPP khác
                    string[] possibleXamppPaths = {
                        @"D:\PHP\XAMPP\mysql\bin\mysql.exe",
                        @"C:\xampp\mysql\bin\mysql.exe",
                        @"D:\xampp\mysql\bin\mysql.exe",
                        @"E:\xampp\mysql\bin\mysql.exe"
                    };
                    
                    foreach (string path in possibleXamppPaths)
                    {
                        if (File.Exists(path))
                        {
                            mysqlPath = path;
                            break;
                        }
                    }
                }
                
                if (!File.Exists(mysqlPath))
                {
                    // Không tìm thấy mysql.exe, trả về lỗi
                    _logger.LogError("Không tìm thấy mysql.exe trong XAMPP. Vui lòng cài đặt XAMPP hoặc kiểm tra đường dẫn.");
                    return (false, "Không tìm thấy mysql.exe trong XAMPP. Vui lòng cài đặt XAMPP hoặc kiểm tra đường dẫn.");
                }
                
                // Thực hiện lệnh mysql để phục hồi
                var processInfo = new ProcessStartInfo
                {
                    FileName = mysqlPath,
                    Arguments = $"-h{server} -P{port} -u{userId} {database}",
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                
                _logger.LogInformation($"Thực thi lệnh khôi phục: {mysqlPath} {processInfo.Arguments}");
                
                try
                {
                    using var process = Process.Start(processInfo);
                    if (process == null)
                    {
                        _logger.LogError("Không thể khởi chạy mysql");
                        return (false, "Không thể khởi chạy mysql");
                    }
                    
                    // Đọc nội dung SQL và gửi vào mysql
                    string sqlContent = await File.ReadAllTextAsync(backupFilePath);
                    await process.StandardInput.WriteAsync(sqlContent);
                    process.StandardInput.Close();
                    
                    string output = await process.StandardOutput.ReadToEndAsync();
                    string error = await process.StandardError.ReadToEndAsync();
                    
                    await process.WaitForExitAsync();
                    
                    if (process.ExitCode != 0)
                    {
                        _logger.LogError($"Lỗi khi phục hồi cơ sở dữ liệu: {error}");
                        return (false, $"Lỗi khi phục hồi cơ sở dữ liệu: {error}");
                    }
                    
                    _logger.LogInformation("Phục hồi cơ sở dữ liệu thành công");
                    return (true, $"Đã phục hồi thành công cơ sở dữ liệu từ tệp {fileName}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi thực thi mysql: {ErrorMessage}", ex.Message);
                    return (false, $"Lỗi khi phục hồi: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi phục hồi cơ sở dữ liệu từ tệp {FileName}", fileName);
                return (false, $"Lỗi khi phục hồi: {ex.Message}");
            }
        }

        /// <summary>
        /// Helper để lấy giá trị từ chuỗi kết nối
        /// </summary>
        private string GetConnectionStringValue(string connectionString, string parameterName)
        {
            try
            {
                // Kiểm tra tham số đầu vào
                if (string.IsNullOrEmpty(connectionString))
                {
                    _logger.LogWarning("Không thể lấy giá trị tham số: chuỗi kết nối trống");
                    return string.Empty;
                }

                if (string.IsNullOrEmpty(parameterName))
                {
                    _logger.LogWarning("Không thể lấy giá trị tham số: tên tham số trống");
                    return string.Empty;
                }

                // Chuẩn hóa tham số đầu vào
                string normalizedParamName = parameterName.ToLowerInvariant();
                string normalizedConnString = connectionString.ToLowerInvariant();

                // Tìm tham số trong chuỗi kết nối
                int startIndex = normalizedConnString.IndexOf($"{normalizedParamName}=", StringComparison.OrdinalIgnoreCase);
                
                // Kiểm tra các tên thay thế nếu không tìm thấy
                if (startIndex == -1)
                {
                    // Các tên thay thế phổ biến
                    Dictionary<string, string[]> alternativeNames = new Dictionary<string, string[]>
                    {
                        { "user id", new[] { "uid", "username", "user" } },
                        { "server", new[] { "host", "data source", "datasource", "addr", "address" } },
                        { "database", new[] { "initial catalog", "db" } },
                        { "password", new[] { "pwd" } },
                        { "port", new[] { "p" } }
                    };

                    // Tìm kiếm các tên thay thế
                    if (alternativeNames.TryGetValue(normalizedParamName, out string[] alternatives))
                    {
                        foreach (string alt in alternatives)
                        {
                            startIndex = normalizedConnString.IndexOf($"{alt}=", StringComparison.OrdinalIgnoreCase);
                            if (startIndex != -1)
                            {
                                normalizedParamName = alt;
                                break;
                            }
                        }
                    }
                }

                // Nếu vẫn không tìm thấy
                if (startIndex == -1)
                {
                    _logger.LogWarning("Không tìm thấy tham số '{ParamName}' trong chuỗi kết nối", parameterName);
                    return string.Empty;
                }

                // Tìm vị trí bắt đầu của giá trị
                startIndex += normalizedParamName.Length + 1;
                
                // Tìm vị trí kết thúc của giá trị
                int endIndex = normalizedConnString.IndexOf(';', startIndex);
                if (endIndex == -1)
                {
                    endIndex = normalizedConnString.Length;
                }

                // Trích xuất giá trị
                string value = connectionString.Substring(startIndex, endIndex - startIndex);
                
                // Loại bỏ dấu ngoặc kép nếu có
                if (value.StartsWith("\"") && value.EndsWith("\""))
                {
                    value = value.Substring(1, value.Length - 2);
                }

                return value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi trích xuất giá trị từ chuỗi kết nối cho tham số '{ParamName}'", parameterName);
                return string.Empty;
            }
        }
    }
} 