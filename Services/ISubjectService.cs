using System.Collections.Generic;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public interface ISubjectService
    {
        Task<ApiResponse<List<SubjectDTO>>> GetAllSubjectsAsync();
        Task<ApiResponse<List<SubjectDTO>>> GetSubjectsByNameAsync(string name);
        Task<ApiResponse<SubjectDTO>> GetSubjectByIdAsync(int id);
        Task<ApiResponse<SubjectDTO>> CreateSubjectAsync(SubjectCreateDTO subjectDto);
        Task<ApiResponse<SubjectDTO>> UpdateSubjectAsync(SubjectUpdateDTO subjectDto);
        Task<ApiResponse<bool>> DeleteSubjectAsync(int id);
        Task<ApiResponse<int>> GetSubjectsCountAsync();
    }
} 