using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface IFileUploadService
    {
        Task<LectureUploadResponseDTO> UploadLectureAsync(LectureUploadRequestDTO request);
        bool IsAllowedFileType(IFormFile file);
        string SanitizeFileName(string fileName);
    }
} 