using System.Collections.Generic;
using System.Threading.Tasks;

namespace VirtualAdvisorAPI.Services
{
    public interface IBackupService
    {
        /// <summary>
        /// Thực hiện sao lưu toàn bộ cơ sở dữ liệu
        /// </summary>
        /// <returns>Thông tin về file backup đã tạo</returns>
        Task<(bool Success, string FileName, string Message)> BackupDatabaseAsync();
        
        /// <summary>
        /// Lấy danh sách các file backup hiện có
        /// </summary>
        /// <returns>Danh sách các file backup</returns>
        Task<List<string>> GetBackupFilesAsync();

        /// <summary>
        /// Phục hồi cơ sở dữ liệu từ file backup
        /// </summary>
        /// <param name="fileName">Tên file backup để phục hồi</param>
        /// <returns>Kết quả thành công và thông báo</returns>
        Task<(bool Success, string Message)> RestoreDatabaseAsync(string fileName);
    }
} 