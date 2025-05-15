using System.Threading.Tasks;

namespace VirtualAdvisorAPI.Services
{
    public interface IExamService
    {
        /// <summary>
        /// Xử lý file bài kiểm tra hoặc bài thi để tạo file JSON đúng định dạng
        /// </summary>
        /// <param name="filePath">Đường dẫn đến file cần xử lý</param>
        /// <param name="lectureId">ID của bài giảng</param>
        /// <returns>Đường dẫn đến file JSON đã tạo</returns>
        Task<string> ProcessExamLecture(string filePath, int lectureId);
    }
} 