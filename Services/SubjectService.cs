using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Repositories;

namespace VirtualAdvisorAPI.Services
{
    public class SubjectService : ISubjectService
    {
        private readonly ISubjectRepository _subjectRepository;

        public SubjectService(ISubjectRepository subjectRepository)
        {
            _subjectRepository = subjectRepository;
        }

        public async Task<ApiResponse<List<SubjectDTO>>> GetAllSubjectsAsync()
        {
            try
            {
                var subjects = await _subjectRepository.GetSubjectsWithCoursesAsync();
                
                var subjectDTOs = subjects.Select(s => new SubjectDTO
                {
                    Id = s.SubjectId,
                    Name = s.SubjectName,
                    Credits = s.Credits,
                    CourseCount = s.Courses.Count
                }).ToList();

                return new ApiResponse<List<SubjectDTO>>
                {
                    Success = true,
                    Data = subjectDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<SubjectDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<List<SubjectDTO>>> GetSubjectsByNameAsync(string name)
        {
            try
            {
                var subjects = await _subjectRepository.SearchByNameAsync(name);
                
                var subjectDTOs = subjects.Select(s => new SubjectDTO
                {
                    Id = s.SubjectId,
                    Name = s.SubjectName,
                    Credits = s.Credits,
                    CourseCount = s.Courses.Count
                }).ToList();

                return new ApiResponse<List<SubjectDTO>>
                {
                    Success = true,
                    Data = subjectDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<SubjectDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi tìm kiếm môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<SubjectDTO>> GetSubjectByIdAsync(int id)
        {
            try
            {
                var subject = await _subjectRepository.GetSubjectWithCoursesAsync(id);
                
                if (subject == null)
                {
                    return new ApiResponse<SubjectDTO>
                    {
                        Success = false,
                        Message = "Không tìm thấy môn học"
                    };
                }
                
                var subjectDTO = new SubjectDTO
                {
                    Id = subject.SubjectId,
                    Name = subject.SubjectName,
                    Credits = subject.Credits,
                    CourseCount = subject.Courses.Count
                };

                return new ApiResponse<SubjectDTO>
                {
                    Success = true,
                    Data = subjectDTO
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<SubjectDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy thông tin môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<SubjectDTO>> CreateSubjectAsync(SubjectCreateDTO subjectDto)
        {
            try
            {
                // Kiểm tra nếu tên môn học đã tồn tại
                var existingSubjects = await _subjectRepository.GetAllAsync();
                if (existingSubjects.Any(s => s.SubjectName.Equals(subjectDto.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    return new ApiResponse<SubjectDTO>
                    {
                        Success = false,
                        Message = "Tên môn học đã tồn tại"
                    };
                }
                
                var subject = new Subject
                {
                    SubjectName = subjectDto.Name,
                    Credits = subjectDto.Credits
                };
                
                await _subjectRepository.AddAsync(subject);
                
                var newSubject = new SubjectDTO
                {
                    Id = subject.SubjectId,
                    Name = subject.SubjectName,
                    Credits = subject.Credits,
                    CourseCount = 0
                };
                
                return new ApiResponse<SubjectDTO>
                {
                    Success = true,
                    Data = newSubject,
                    Message = "Thêm môn học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<SubjectDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi thêm môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<SubjectDTO>> UpdateSubjectAsync(SubjectUpdateDTO subjectDto)
        {
            try
            {
                var subject = await _subjectRepository.GetByIdAsync(subjectDto.Id);
                
                if (subject == null)
                {
                    return new ApiResponse<SubjectDTO>
                    {
                        Success = false,
                        Message = "Không tìm thấy môn học"
                    };
                }
                
                // Kiểm tra nếu tên môn học đã tồn tại (trừ môn học hiện tại)
                var existingSubjects = await _subjectRepository.GetAllAsync();
                if (existingSubjects.Any(s => s.SubjectId != subjectDto.Id && 
                                        s.SubjectName.Equals(subjectDto.Name, StringComparison.OrdinalIgnoreCase)))
                {
                    return new ApiResponse<SubjectDTO>
                    {
                        Success = false,
                        Message = "Tên môn học đã tồn tại"
                    };
                }
                
                subject.SubjectName = subjectDto.Name;
                subject.Credits = subjectDto.Credits;
                
                await _subjectRepository.UpdateAsync(subject);
                
                var updatedSubject = await _subjectRepository.GetSubjectWithCoursesAsync(subject.SubjectId);
                
                var subjectDTO = new SubjectDTO
                {
                    Id = updatedSubject!.SubjectId,
                    Name = updatedSubject.SubjectName,
                    Credits = updatedSubject.Credits,
                    CourseCount = updatedSubject.Courses.Count
                };
                
                return new ApiResponse<SubjectDTO>
                {
                    Success = true,
                    Data = subjectDTO,
                    Message = "Cập nhật môn học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<SubjectDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi cập nhật môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<bool>> DeleteSubjectAsync(int id)
        {
            try
            {
                var subject = await _subjectRepository.GetSubjectWithCoursesAsync(id);
                
                if (subject == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy môn học"
                    };
                }
                
                if (subject.Courses.Any())
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không thể xóa môn học này vì đã có khóa học liên kết"
                    };
                }
                
                await _subjectRepository.RemoveAsync(subject);
                
                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Xóa môn học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Lỗi khi xóa môn học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<int>> GetSubjectsCountAsync()
        {
            try
            {
                var count = await _subjectRepository.GetCountAsync();
                
                return new ApiResponse<int>
                {
                    Success = true,
                    Data = count
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<int>
                {
                    Success = false,
                    Message = $"Lỗi khi đếm số lượng môn học: {ex.Message}"
                };
            }
        }
    }
} 