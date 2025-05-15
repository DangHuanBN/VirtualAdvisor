using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;
using VirtualAdvisorAPI.Repositories;

namespace VirtualAdvisorAPI.Services
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ILearningPathService _learningPathService;

        public CourseService(
            ICourseRepository courseRepository, 
            ISubjectRepository subjectRepository,
            ILearningPathService learningPathService)
        {
            _courseRepository = courseRepository;
            _subjectRepository = subjectRepository;
            _learningPathService = learningPathService;
        }

        public async Task<ApiResponse<List<CourseDTO>>> GetAllCoursesAsync()
        {
            try
            {
                var courses = await _courseRepository.GetCoursesWithSubjectsAsync();
                
                var courseDTOs = courses.Select(c => new CourseDTO
                {
                    Id = c.CourseId,
                    Name = c.CourseName,
                    SubjectId = c.SubjectId,
                    SubjectName = c.Subject?.SubjectName ?? string.Empty,
                    Type = c.Type,
                    LecturesCount = c.Lectures.Count
                }).ToList();

                return new ApiResponse<List<CourseDTO>>
                {
                    Success = true,
                    Data = courseDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CourseDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách khóa học: {ex.Message}"
                };
            }
        }

        public async Task<ApiResponse<List<CourseDTO>>> GetCoursesBySubjectIdAsync(int subjectId)
        {
            try
            {
                var courses = await _courseRepository.GetCoursesBySubjectIdAsync(subjectId);
                
                // Lấy thông tin môn học
                var subject = await _subjectRepository.GetByIdAsync(subjectId);
                if (subject == null)
                {
                    return new ApiResponse<List<CourseDTO>>
                    {
                        Success = false,
                        Message = "Không tìm thấy môn học"
                    };
                }
                
                var courseDTOs = courses.Select(c => new CourseDTO
                {
                    Id = c.CourseId,
                    Name = c.CourseName,
                    SubjectId = c.SubjectId,
                    SubjectName = subject.SubjectName,
                    Type = c.Type,
                    LecturesCount = c.Lectures?.Count ?? 0
                }).ToList();

                return new ApiResponse<List<CourseDTO>>
                {
                    Success = true,
                    Data = courseDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CourseDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy danh sách khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<CourseDetailDTO>> GetCourseByIdAsync(int courseId)
        {
            try
            {
                var course = await _courseRepository.GetCourseWithLecturesAsync(courseId);
                
                if (course == null)
                {
                    return new ApiResponse<CourseDetailDTO>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học"
                    };
                }
                
                // Lấy thông tin môn học
                var subject = await _subjectRepository.GetByIdAsync(course.SubjectId);
                
                var courseDetail = new CourseDetailDTO
                {
                    Id = course.CourseId,
                    Name = course.CourseName,
                    SubjectId = course.SubjectId,
                    SubjectName = subject?.SubjectName ?? string.Empty,
                    Type = course.Type,
                    LecturesCount = course.Lectures.Count,
                    Subjects = new List<SubjectDTO>
                    {
                        new SubjectDTO
                        {
                            Id = subject!.SubjectId,
                            Name = subject.SubjectName,
                            Credits = subject.Credits
                        }
                    }
                };

                return new ApiResponse<CourseDetailDTO>
                {
                    Success = true,
                    Data = courseDetail
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CourseDetailDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi lấy thông tin khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<List<CourseDTO>>> SearchCoursesByNameAsync(string name)
        {
            try
            {
                var courses = await _courseRepository.SearchCoursesByNameAsync(name);
                
                var courseDTOs = courses.Select(c => new CourseDTO
                {
                    Id = c.CourseId,
                    Name = c.CourseName,
                    SubjectId = c.SubjectId,
                    SubjectName = c.Subject?.SubjectName ?? string.Empty,
                    Type = c.Type,
                    LecturesCount = c.Lectures?.Count ?? 0
                }).ToList();

                return new ApiResponse<List<CourseDTO>>
                {
                    Success = true,
                    Data = courseDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CourseDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi tìm kiếm khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<List<CourseDTO>>> SearchCoursesByNameAndSubjectAsync(string name, int subjectId)
        {
            try
            {
                // Kiểm tra Subject tồn tại
                var subject = await _subjectRepository.GetByIdAsync(subjectId);
                if (subject == null)
                {
                    return new ApiResponse<List<CourseDTO>>
                    {
                        Success = false,
                        Message = "Môn học không tồn tại"
                    };
                }
                
                // Tìm khóa học theo tên và môn học
                var courses = await _courseRepository.SearchCoursesByNameAsync(name);
                
                // Lọc theo môn học
                courses = courses.Where(c => c.SubjectId == subjectId).ToList();
                
                var courseDTOs = courses.Select(c => new CourseDTO
                {
                    Id = c.CourseId,
                    Name = c.CourseName,
                    SubjectId = c.SubjectId,
                    SubjectName = subject.SubjectName,
                    Type = c.Type,
                    LecturesCount = c.Lectures?.Count ?? 0
                }).ToList();

                return new ApiResponse<List<CourseDTO>>
                {
                    Success = true,
                    Data = courseDTOs
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CourseDTO>>
                {
                    Success = false,
                    Message = $"Lỗi khi tìm kiếm khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<CourseDTO>> CreateCourseAsync(CourseCreateDTO model)
        {
            try
            {
                // Kiểm tra Subject tồn tại
                var subject = await _subjectRepository.GetByIdAsync(model.SubjectId);
                if (subject == null)
                {
                    return new ApiResponse<CourseDTO>
                    {
                        Success = false,
                        Message = "Môn học không tồn tại"
                    };
                }
                
                // Tạo khóa học mới
                var newCourse = new Course
                {
                    CourseName = model.Name,
                    SubjectId = model.SubjectId,
                    Type = model.Type
                };
                
                var createdCourse = await _courseRepository.AddAsync(newCourse);
                
                // Tự động tạo learning path cho khóa học mới
                try
                {
                    await _learningPathService.CreateLearningPathWhenCourseCreated(createdCourse.CourseId);
                }
                catch (Exception ex)
                {
                    // Log lỗi nhưng không ảnh hưởng đến việc tạo khóa học
                    Console.WriteLine($"Lỗi khi tạo learning path: {ex.Message}");
                }
                
                var courseDTO = new CourseDTO
                {
                    Id = createdCourse.CourseId,
                    Name = createdCourse.CourseName,
                    SubjectId = createdCourse.SubjectId,
                    SubjectName = subject.SubjectName,
                    Type = createdCourse.Type,
                    LecturesCount = 0
                };

                return new ApiResponse<CourseDTO>
                {
                    Success = true,
                    Data = courseDTO,
                    Message = "Tạo khóa học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CourseDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi tạo khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<CourseDTO>> UpdateCourseAsync(CourseUpdateDTO model)
        {
            try
            {
                // Kiểm tra khóa học tồn tại
                var existingCourse = await _courseRepository.GetByIdAsync(model.Id);
                if (existingCourse == null)
                {
                    return new ApiResponse<CourseDTO>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học"
                    };
                }
                
                // Kiểm tra Subject tồn tại
                var subject = await _subjectRepository.GetByIdAsync(model.SubjectId);
                if (subject == null)
                {
                    return new ApiResponse<CourseDTO>
                    {
                        Success = false,
                        Message = "Môn học không tồn tại"
                    };
                }
                
                // Cập nhật thông tin
                existingCourse.CourseName = model.Name;
                existingCourse.SubjectId = model.SubjectId;
                existingCourse.Type = model.Type;
                
                await _courseRepository.UpdateAsync(existingCourse);
                
                var courseDTO = new CourseDTO
                {
                    Id = existingCourse.CourseId,
                    Name = existingCourse.CourseName,
                    SubjectId = existingCourse.SubjectId,
                    SubjectName = subject.SubjectName,
                    Type = existingCourse.Type,
                    LecturesCount = existingCourse.Lectures?.Count ?? 0
                };

                return new ApiResponse<CourseDTO>
                {
                    Success = true,
                    Data = courseDTO,
                    Message = "Cập nhật khóa học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<CourseDTO>
                {
                    Success = false,
                    Message = $"Lỗi khi cập nhật khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<bool>> DeleteCourseAsync(int courseId)
        {
            try
            {
                // Kiểm tra khóa học tồn tại
                var existingCourse = await _courseRepository.GetByIdAsync(courseId);
                if (existingCourse == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Không tìm thấy khóa học"
                    };
                }
                
                // Xóa khóa học
                await _courseRepository.RemoveAsync(existingCourse);
                
                return new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Xóa khóa học thành công"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = $"Lỗi khi xóa khóa học: {ex.Message}"
                };
            }
        }
        
        public async Task<ApiResponse<int>> GetCoursesCountAsync()
        {
            try
            {
                var count = await _courseRepository.CountAsync();
                
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
                    Message = $"Lỗi khi đếm số lượng khóa học: {ex.Message}"
                };
            }
        }
    }
} 