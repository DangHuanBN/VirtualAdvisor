using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using VirtualAdvisorAPI.Models.DTOs;
using Microsoft.Extensions.Logging;

namespace VirtualAdvisorAPI.Services
{
    public class LectureService : ILectureService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILearningPathService _learningPathService;
        private readonly ILogger<LectureService> _logger;
        private readonly IFileConverterService _fileConverterService;
        private readonly IExamService _examService;

        public LectureService(
            AppDbContext context,
            IWebHostEnvironment webHostEnvironment,
            ILearningPathService learningPathService,
            ILogger<LectureService> logger,
            IFileConverterService fileConverterService,
            IExamService examService)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
            _learningPathService = learningPathService;
            _logger = logger;
            _fileConverterService = fileConverterService;
            _examService = examService;
        }

        public async Task<LectureResponseDTO> UploadLectureAsync(UploadLectureDTO uploadDto, int teacherId)
        {
            // Xử lý file upload
            string uniqueFileName = await SaveFileAsync(uploadDto.File);

            // Lấy thông tin về loại khóa học (tuantu/tudo)
            string courseType = "tudo"; // Mặc định
            try
            {
                _logger.LogInformation($"Gọi GetCourseTypeById cho CourseId: {uploadDto.CourseId}");
                courseType = await _learningPathService.GetCourseTypeById(uploadDto.CourseId);
                _logger.LogInformation($"Loại khóa học: {courseType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy course type: {ex.Message}");
            }

            // Tạo vector path cho AI training
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(uniqueFileName);
            string vectorPath = Path.Combine("vector_store", $"{fileNameWithoutExtension}.pkl");

            // Tự động chuyển đổi file sang PDF nếu là DOCX hoặc PPTX
            string pdfFileName = null;
            string extension = Path.GetExtension(uniqueFileName).ToLowerInvariant();
            string uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "uploads");
            string jsonFilePath = null;
            if (uploadDto.Type == "baigiang")
            {
                if (extension == ".docx" || extension == ".pptx")
                {
                    try
                    {
                        _logger.LogInformation($"Bắt đầu tự động chuyển đổi file {uniqueFileName} sang PDF trong quá trình tải lên");

                        // Đường dẫn đầy đủ đến file gốc
                        string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                        // Gọi service chuyển đổi và đợi kết quả
                        pdfFileName = await _fileConverterService.ConvertToPdfAsync(filePath);

                        if (!string.IsNullOrEmpty(pdfFileName))
                        {
                            _logger.LogInformation($"Đã chuyển đổi thành công file sang PDF: {pdfFileName}");

                            // Kiểm tra file PDF đã được tạo
                            string pdfFullPath = Path.Combine(uploadsFolder, pdfFileName);
                            if (File.Exists(pdfFullPath))
                            {
                                _logger.LogInformation($"Xác nhận file PDF đã tồn tại: {pdfFullPath}");
                            }
                            else
                            {
                                _logger.LogWarning($"Không tìm thấy file PDF sau khi chuyển đổi: {pdfFullPath}");
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"Không thể chuyển đổi file {uniqueFileName} sang PDF khi tải lên");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi chuyển đổi file {uniqueFileName} sang PDF");
                        // Tiếp tục quá trình lưu lecture ngay cả khi chuyển đổi thất bại
                    }
                }
            }
            // Bài kiểm tra và bài thi sẽ được xử lý sau khi lưu lecture

            // Tạo đối tượng Lecture
            var lecture = new Lecture
            {
                CourseId = uploadDto.CourseId,
                TeacherId = teacherId,
                Title = uploadDto.Title ?? string.Empty,
                Content = uploadDto.Content ?? string.Empty,
                Attachment = uniqueFileName,
                UploadDate = DateTime.Now,
                Type = uploadDto.Type ?? string.Empty,
                Status = "chuahuanluyen",
                VectorPath = vectorPath,
                TrainingDate = null,
                MaxHours = (int?)uploadDto.MaxHours
            };

            // Lưu vào database
            _context.Lectures.Add(lecture);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Đã lưu bài giảng mới ID: {lecture.LectureId}");

            // Thêm vào bảng AI_Training
            var aiTraining = new AITraining
            {
                LectureId = lecture.LectureId,
                VectorStorePath = vectorPath,
                Status = "pending",
                TrainingTime = DateTime.Now
            };
            _context.AITrainings.Add(aiTraining);
            await _context.SaveChangesAsync();
            
            // Xử lý file JSON nếu là bài kiểm tra hoặc bài thi
            if (uploadDto.Type == "baikiemtra" || uploadDto.Type == "baithi")
            {
                try
                {
                    _logger.LogInformation($"Xử lý file {uniqueFileName} thành file JSON cho {uploadDto.Type}");

                    // Đường dẫn đầy đủ đến file
                    string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    // Gọi service xử lý đề thi/bài kiểm tra, bây giờ đã có lectureId
                    jsonFilePath = await _examService.ProcessExamLecture(filePath, lecture.LectureId);

                    if (!string.IsNullOrEmpty(jsonFilePath))
                    {
                        _logger.LogInformation($"Đã xử lý thành công file JSON: {jsonFilePath}");
                    }
                    else
                    {
                        _logger.LogWarning($"Không thể xử lý file {uniqueFileName} thành JSON");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Lỗi khi xử lý file {uniqueFileName} thành JSON: {ex.Message}");
                    // Vẫn tiếp tục quá trình mà không ném ngoại lệ
                }
            }

            // Thêm bài giảng vào learning path nếu là khóa học tuần tự
            if (courseType.ToLowerInvariant() == "tuantu")
            {
                _logger.LogInformation($"Gọi AddLectureToLearningPath cho lectureId: {lecture.LectureId}");
                await _learningPathService.AddLectureToLearningPath(lecture.LectureId);
                _logger.LogInformation("Đã thêm bài giảng vào learning path thành công");
            }

            // Tạo response DTO
            return new LectureResponseDTO
            {
                LectureId = lecture.LectureId,
                Title = lecture.Title,
                Content = lecture.Content,
                CourseId = lecture.CourseId,
                TeacherId = lecture.TeacherId,
                UploadDate = lecture.UploadDate,
                LectureType = lecture.Type ?? string.Empty,
                Status = lecture.Status,
                Attachment = lecture.Attachment,
                PdfAttachment = pdfFileName,
                JsonPath = jsonFilePath,
                CourseName = lecture.Course?.CourseName,
                SubjectId = lecture.Course?.Subject?.SubjectId ?? 0,
                SubjectName = lecture.Course?.Subject?.SubjectName,
                MaxHours = (int?)lecture.MaxHours
            };
        }

        private async Task<string> SaveFileAsync(IFormFile file)
        {
            // Tạo tên file duy nhất
            string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";

            // Đường dẫn thư mục lưu trữ
            string uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "uploads");

            // Tạo thư mục nếu chưa tồn tại
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Đường dẫn đầy đủ đến file
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Lưu file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return uniqueFileName;
        }

        public async Task<IEnumerable<LectureResponseDTO>> GetLecturesByTeacherIdAsync(int teacherId)
        {
            try
            {
                if (teacherId <= 0)
                {
                    throw new ArgumentException("TeacherId không hợp lệ");
                }

                // Chỉ kiểm tra ID giảng viên, không kiểm tra role
                var teacherExists = await _context.Users.AnyAsync(u => u.UserId == teacherId);
                if (!teacherExists)
                {
                    // Trả về danh sách rỗng thay vì throw exception
                    return new List<LectureResponseDTO>();
                }

                // Sử dụng left join để lấy thêm thông tin về khóa học và môn học
                var query = from lecture in _context.Lectures
                            where lecture.TeacherId == teacherId
                            join course in _context.Courses
                                on lecture.CourseId equals course.CourseId into courseJoin
                            from course in courseJoin.DefaultIfEmpty()
                            join subject in _context.Subjects
                                on (course != null ? course.SubjectId : 0) equals subject.SubjectId into subjectJoin
                            from subject in subjectJoin.DefaultIfEmpty()
                            select new LectureResponseDTO
                            {
                                LectureId = lecture.LectureId,
                                CourseId = lecture.CourseId,
                                TeacherId = lecture.TeacherId,
                                Title = lecture.Title ?? string.Empty,
                                Content = lecture.Content ?? string.Empty,
                                UploadDate = lecture.UploadDate,
                                LectureType = lecture.Type ?? string.Empty,
                                Status = lecture.Status ?? string.Empty,
                                Attachment = lecture.Attachment ?? string.Empty,
                                // Sửa lại tên thuộc tính cho đúng với model
                                CourseName = course != null ? course.CourseName ?? $"Khóa học ID: {lecture.CourseId}" : $"Khóa học ID: {lecture.CourseId}",
                                SubjectId = subject != null ? subject.SubjectId : 0,
                                SubjectName = subject != null ? subject.SubjectName ?? $"Môn học ID: {(course != null ? course.SubjectId : 0)}" : $"Môn học ID: {(course != null ? course.SubjectId : 0)}",
                                MaxHours = (int?)lecture.MaxHours
                            };

                return await query.ToListAsync();
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                _logger.LogError(ex, $"Lỗi khi lấy bài giảng theo giảng viên ID {teacherId}: {ex.Message}");
                _logger.LogTrace(ex.StackTrace);

                // Rethrow với thông tin rõ ràng hơn
                throw new Exception($"Lỗi khi lấy bài giảng theo giảng viên: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<LectureResponseDTO>> GetFilteredLecturesAsync(int teacherId, LectureFilterDTO filter)
        {
            try
            {
                if (teacherId <= 0)
                {
                    throw new ArgumentException("TeacherId không hợp lệ");
                }

                // Bắt đầu với truy vấn cơ bản
                var query = from lecture in _context.Lectures
                            where lecture.TeacherId == teacherId
                            join course in _context.Courses
                                on lecture.CourseId equals course.CourseId into courseJoin
                            from course in courseJoin.DefaultIfEmpty()
                            join subject in _context.Subjects
                                on (course != null ? course.SubjectId : 0) equals subject.SubjectId into subjectJoin
                            from subject in subjectJoin.DefaultIfEmpty()
                            select new { lecture, course, subject };

                // Áp dụng các bộ lọc
                if (!string.IsNullOrWhiteSpace(filter.SearchText))
                {
                    string searchText = filter.SearchText.ToLower();
                    query = query.Where(x =>
                        (x.lecture.Title != null && x.lecture.Title.ToLower().Contains(searchText)) ||
                        (x.lecture.Content != null && x.lecture.Content.ToLower().Contains(searchText))
                    );
                }

                if (filter.SubjectId.HasValue && filter.SubjectId.Value > 0)
                {
                    query = query.Where(x => x.subject != null && x.subject.SubjectId == filter.SubjectId.Value);
                }

                if (filter.CourseId.HasValue && filter.CourseId.Value > 0)
                {
                    query = query.Where(x => x.lecture.CourseId == filter.CourseId.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.Type))
                {
                    query = query.Where(x => x.lecture.Type == filter.Type);
                }

                // Sắp xếp theo tiêu chí
                if (!string.IsNullOrWhiteSpace(filter.SortBy))
                {
                    switch (filter.SortBy.ToLower())
                    {
                        case "recent":
                            query = query.OrderByDescending(x => x.lecture.UploadDate);
                            break;
                        case "popular":
                            // Giả sử đã có trường lưu số lượt xem
                            // query = query.OrderByDescending(x => x.lecture.ViewCount);
                            // Nếu chưa có trường này, tạm thời sắp xếp theo ID
                            query = query.OrderByDescending(x => x.lecture.LectureId);
                            break;
                        default:
                            query = query.OrderByDescending(x => x.lecture.UploadDate);
                            break;
                    }
                }
                else
                {
                    query = query.OrderByDescending(x => x.lecture.UploadDate);
                }

                // Chuyển đổi kết quả truy vấn thành DTO
                var finalQuery = query.Select(x => new LectureResponseDTO
                {
                    LectureId = x.lecture.LectureId,
                    CourseId = x.lecture.CourseId,
                    TeacherId = x.lecture.TeacherId,
                    Title = x.lecture.Title ?? string.Empty,
                    Content = x.lecture.Content ?? string.Empty,
                    UploadDate = x.lecture.UploadDate,
                    LectureType = x.lecture.Type ?? string.Empty,
                    Status = x.lecture.Status ?? string.Empty,
                    Attachment = x.lecture.Attachment ?? string.Empty,
                    CourseName = x.course != null ? x.course.CourseName ?? $"Khóa học ID: {x.lecture.CourseId}" : $"Khóa học ID: {x.lecture.CourseId}",
                    SubjectId = x.subject != null ? x.subject.SubjectId : 0,
                    SubjectName = x.subject != null ? x.subject.SubjectName ?? $"Môn học ID: {(x.course != null ? x.course.SubjectId : 0)}" : $"Môn học ID: {(x.course != null ? x.course.SubjectId : 0)}",
                    MaxHours = (int?)x.lecture.MaxHours
                });

                return await finalQuery.ToListAsync();
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                _logger.LogError(ex, "Lỗi khi lọc bài giảng");
                _logger.LogTrace(ex.StackTrace);

                // Rethrow với thông tin rõ ràng hơn
                throw new Exception($"Lỗi khi lọc bài giảng: {ex.Message}", ex);
            }
        }

        public async Task<PaginatedResponse<LectureResponseDTO>> GetLecturesByTeacherIdPagedAsync(int teacherId, int pageNumber, int pageSize)
        {
            try
            {
                if (teacherId <= 0)
                {
                    throw new ArgumentException("TeacherId không hợp lệ");
                }

                // Kiểm tra tham số phân trang
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10; // Mặc định 10 bài giảng/trang

                // Truy vấn cơ bản
                var query = from lecture in _context.Lectures
                            where lecture.TeacherId == teacherId
                            join course in _context.Courses
                                on lecture.CourseId equals course.CourseId into courseJoin
                            from course in courseJoin.DefaultIfEmpty()
                            join subject in _context.Subjects
                                on (course != null ? course.SubjectId : 0) equals subject.SubjectId into subjectJoin
                            from subject in subjectJoin.DefaultIfEmpty()
                            select new LectureResponseDTO
                            {
                                LectureId = lecture.LectureId,
                                CourseId = lecture.CourseId,
                                TeacherId = lecture.TeacherId,
                                Title = lecture.Title ?? string.Empty,
                                Content = lecture.Content ?? string.Empty,
                                UploadDate = lecture.UploadDate,
                                LectureType = lecture.Type ?? string.Empty,
                                Status = lecture.Status ?? string.Empty,
                                Attachment = lecture.Attachment ?? string.Empty,
                                CourseName = course != null ? course.CourseName ?? $"Khóa học ID: {lecture.CourseId}" : $"Khóa học ID: {lecture.CourseId}",
                                SubjectId = subject != null ? subject.SubjectId : 0,
                                SubjectName = subject != null ? subject.SubjectName ?? $"Môn học ID: {(course != null ? course.SubjectId : 0)}" : $"Môn học ID: {(course != null ? course.SubjectId : 0)}",
                                MaxHours = (int?)lecture.MaxHours
                            };

                // Sắp xếp mặc định theo ngày tải lên (mới nhất lên đầu)
                query = query.OrderByDescending(x => x.UploadDate);

                // Đếm tổng số bản ghi
                var totalCount = await query.CountAsync();

                // Tính tổng số trang
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                // Lấy dữ liệu cho trang hiện tại
                var items = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Trả về kết quả phân trang
                return new PaginatedResponse<LectureResponseDTO>
                {
                    Items = items,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                _logger.LogError(ex, $"Lỗi khi lấy bài giảng theo giảng viên ID {teacherId}: {ex.Message}");
                _logger.LogTrace(ex.StackTrace);

                // Rethrow với thông tin rõ ràng hơn
                throw new Exception($"Lỗi khi lấy bài giảng theo giảng viên: {ex.Message}", ex);
            }
        }

        public async Task<PaginatedResponse<LectureResponseDTO>> GetFilteredLecturesPagedAsync(int teacherId, LectureFilterDTO filter)
        {
            try
            {
                if (teacherId <= 0)
                {
                    throw new ArgumentException("TeacherId không hợp lệ");
                }

                // Kiểm tra tham số phân trang
                if (filter.PageNumber < 1) filter.PageNumber = 1;
                if (filter.PageSize < 1) filter.PageSize = 10; // Mặc định 10 bài giảng/trang

                // Bắt đầu với truy vấn cơ bản
                var query = from lecture in _context.Lectures
                            where lecture.TeacherId == teacherId
                            join course in _context.Courses
                                on lecture.CourseId equals course.CourseId into courseJoin
                            from course in courseJoin.DefaultIfEmpty()
                            join subject in _context.Subjects
                                on (course != null ? course.SubjectId : 0) equals subject.SubjectId into subjectJoin
                            from subject in subjectJoin.DefaultIfEmpty()
                            select new { lecture, course, subject };

                // Áp dụng các bộ lọc
                if (!string.IsNullOrWhiteSpace(filter.SearchText))
                {
                    string searchText = filter.SearchText.ToLower();
                    query = query.Where(x =>
                        (x.lecture.Title != null && x.lecture.Title.ToLower().Contains(searchText)) ||
                        (x.lecture.Content != null && x.lecture.Content.ToLower().Contains(searchText))
                    );
                }

                if (filter.SubjectId.HasValue && filter.SubjectId.Value > 0)
                {
                    query = query.Where(x => x.subject != null && x.subject.SubjectId == filter.SubjectId.Value);
                }

                if (filter.CourseId.HasValue && filter.CourseId.Value > 0)
                {
                    query = query.Where(x => x.lecture.CourseId == filter.CourseId.Value);
                }

                if (!string.IsNullOrWhiteSpace(filter.Type))
                {
                    query = query.Where(x => x.lecture.Type == filter.Type);
                }

                // Sắp xếp theo tiêu chí
                if (!string.IsNullOrWhiteSpace(filter.SortBy))
                {
                    switch (filter.SortBy.ToLower())
                    {
                        case "recent":
                            query = query.OrderByDescending(x => x.lecture.UploadDate);
                            break;
                        case "popular":
                            // Giả sử đã có trường lưu số lượt xem
                            // query = query.OrderByDescending(x => x.lecture.ViewCount);
                            // Nếu chưa có trường này, tạm thời sắp xếp theo ID
                            query = query.OrderByDescending(x => x.lecture.LectureId);
                            break;
                        default:
                            query = query.OrderByDescending(x => x.lecture.UploadDate);
                            break;
                    }
                }
                else
                {
                    query = query.OrderByDescending(x => x.lecture.UploadDate);
                }

                // Đếm tổng số bản ghi
                var totalCount = await query.CountAsync();

                // Tính tổng số trang
                var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

                // Lấy dữ liệu cho trang hiện tại
                var queryPaged = query
                    .Skip((filter.PageNumber - 1) * filter.PageSize)
                    .Take(filter.PageSize);

                // Chuyển đổi kết quả truy vấn thành DTO
                var finalQuery = queryPaged.Select(x => new LectureResponseDTO
                {
                    LectureId = x.lecture.LectureId,
                    CourseId = x.lecture.CourseId,
                    TeacherId = x.lecture.TeacherId,
                    Title = x.lecture.Title ?? string.Empty,
                    Content = x.lecture.Content ?? string.Empty,
                    UploadDate = x.lecture.UploadDate,
                    LectureType = x.lecture.Type ?? string.Empty,
                    Status = x.lecture.Status ?? string.Empty,
                    Attachment = x.lecture.Attachment ?? string.Empty,
                    CourseName = x.course != null ? x.course.CourseName ?? $"Khóa học ID: {x.lecture.CourseId}" : $"Khóa học ID: {x.lecture.CourseId}",
                    SubjectId = x.subject != null ? x.subject.SubjectId : 0,
                    SubjectName = x.subject != null ? x.subject.SubjectName ?? $"Môn học ID: {(x.course != null ? x.course.SubjectId : 0)}" : $"Môn học ID: {(x.course != null ? x.course.SubjectId : 0)}",
                    MaxHours = (int?)x.lecture.MaxHours
                });

                var items = await finalQuery.ToListAsync();

                // Trả về kết quả phân trang
                return new PaginatedResponse<LectureResponseDTO>
                {
                    Items = items,
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết
                _logger.LogError(ex, "Lỗi khi lọc bài giảng");
                _logger.LogTrace(ex.StackTrace);

                // Rethrow với thông tin rõ ràng hơn
                throw new Exception($"Lỗi khi lọc bài giảng: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteLectureAsync(int lectureId, int teacherId)
        {
            try
            {
                // Kiểm tra bài giảng tồn tại và thuộc về giảng viên này
                var lecture = await _context.Lectures
                    .FirstOrDefaultAsync(l => l.LectureId == lectureId && l.TeacherId == teacherId);

                if (lecture == null)
                {
                    // Không tìm thấy bài giảng hoặc bài giảng không thuộc về giảng viên
                    return false;
                }

                // Xóa file đính kèm nếu có
                if (!string.IsNullOrEmpty(lecture.Attachment))
                {
                    string filePath = Path.Combine(_webHostEnvironment.ContentRootPath, "AI_Training", "uploads", lecture.Attachment);
                    if (File.Exists(filePath))
                    {
                        try
                        {
                            File.Delete(filePath);
                        }
                        catch (Exception ex)
                        {
                            // Log lỗi nhưng vẫn tiếp tục xóa record trong database
                            _logger.LogWarning($"Không thể xóa file đính kèm: {ex.Message}");
                        }
                    }
                }

                // Xóa bài giảng khỏi database
                _context.Lectures.Remove(lecture);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                // Log lỗi
                _logger.LogError(ex, $"Lỗi khi xóa bài giảng ID {lectureId}: {ex.Message}");
                _logger.LogTrace(ex.StackTrace);

                // Trả về false cho biết xóa không thành công
                return false;
            }
        }

        public async Task<LectureResponseDTO> UpdateLectureAsync(int lectureId, LectureUpdateDto updateDto, int teacherId)
        {
            try
            {
                // Kiểm tra bài giảng tồn tại và thuộc về giảng viên này
                var lecture = await _context.Lectures
                    .Include(l => l.Course)
                    .ThenInclude(c => c.Subject)
                    .FirstOrDefaultAsync(l => l.LectureId == lectureId && l.TeacherId == teacherId);

                if (lecture == null)
                {
                    throw new Exception("Không tìm thấy bài giảng hoặc bạn không có quyền chỉnh sửa bài giảng này");
                }

                // Cập nhật thông tin bài giảng
                lecture.Title = updateDto.Title ?? string.Empty;
                lecture.Content = updateDto.Content ?? string.Empty;
                lecture.Type = updateDto.Type ?? string.Empty;
                lecture.MaxHours = (int?)updateDto.MaxHours;

                // Cập nhật tệp đính kèm nếu có
                if (!string.IsNullOrEmpty(updateDto.Attachment) && updateDto.Attachment != lecture.Attachment)
                {
                    lecture.Attachment = updateDto.Attachment;
                }

                // Lưu thay đổi vào cơ sở dữ liệu
                _context.Lectures.Update(lecture);
                await _context.SaveChangesAsync();

                // Trả về thông tin bài giảng đã cập nhật
                return new LectureResponseDTO
                {
                    LectureId = lecture.LectureId,
                    CourseId = lecture.CourseId,
                    TeacherId = lecture.TeacherId,
                    Title = lecture.Title ?? string.Empty,
                    Content = lecture.Content ?? string.Empty,
                    Attachment = lecture.Attachment ?? string.Empty,
                    UploadDate = lecture.UploadDate,
                    LectureType = lecture.Type ?? string.Empty,
                    Status = lecture.Status ?? string.Empty,
                    MaxHours = (int?)lecture.MaxHours,
                    CourseName = lecture.Course?.CourseName ?? $"Khóa học ID: {lecture.CourseId}",
                    SubjectId = lecture.Course?.Subject?.SubjectId ?? 0,
                    SubjectName = lecture.Course?.Subject?.SubjectName ?? $"Môn học ID: {(lecture.Course?.SubjectId ?? 0)}"
                };
            }
            catch (Exception ex)
            {
                // Log lỗi
                _logger.LogError(ex, $"Lỗi khi cập nhật bài giảng ID {lectureId}: {ex.Message}");
                _logger.LogTrace(ex.StackTrace);

                // Rethrow với thông tin rõ ràng hơn
                throw new Exception($"Lỗi khi cập nhật bài giảng: {ex.Message}", ex);
            }
        }
    }
}