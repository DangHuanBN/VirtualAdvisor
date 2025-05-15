using System.Threading.Tasks;

namespace VirtualAdvisorAPI.Services
{
    public interface IFileConverterService
    {
        /// <summary>
        /// Chuyển đổi file sang PDF
        /// </summary>
        /// <param name="filePath">Đường dẫn đến file cần chuyển đổi</param>
        /// <returns>Đường dẫn đến file PDF đã chuyển đổi</returns>
        Task<string> ConvertToPdfAsync(string filePath);
    }
} 