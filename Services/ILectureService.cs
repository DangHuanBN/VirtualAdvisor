using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface ILectureService
    {
        Task<LectureResponseDTO> UploadLectureAsync(UploadLectureDTO uploadDto, int teacherId);
        Task<IEnumerable<LectureResponseDTO>> GetLecturesByTeacherIdAsync(int teacherId);
        Task<PaginatedResponse<LectureResponseDTO>> GetLecturesByTeacherIdPagedAsync(int teacherId, int pageNumber, int pageSize);
        Task<IEnumerable<LectureResponseDTO>> GetFilteredLecturesAsync(int teacherId, LectureFilterDTO filter);
        Task<PaginatedResponse<LectureResponseDTO>> GetFilteredLecturesPagedAsync(int teacherId, LectureFilterDTO filter);
        Task<bool> DeleteLectureAsync(int lectureId, int teacherId);
        Task<LectureResponseDTO> UpdateLectureAsync(int lectureId, LectureUpdateDto updateDto, int teacherId);
    }
} 