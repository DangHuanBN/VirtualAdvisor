using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Models;
using VirtualAdvisorAPI.Models.DTOs;

namespace VirtualAdvisorAPI.Services
{
    public class ProgressService : IProgressService
    {
        private readonly AppDbContext _context;

        public ProgressService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Subject>> GetAllSubjectsAsync()
        {
            return await _context.Subjects.ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetCoursesBySubjectAsync(int subjectId)
        {
            return await _context.Courses
                .Where(c => c.SubjectId == subjectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentBasicDto>> GetStudentsByCourseAsync(int courseId)
        {
            try
            {
                // Kiểm tra khóa học có tồn tại không
                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == courseId);
                if (!courseExists)
                {
                    throw new ArgumentException($"Khóa học có ID {courseId} không tồn tại");
                }

                // Lấy danh sách sinh viên trong khóa học - cách đơn giản hơn
                var studentIds = await _context.StudentEnrollments
                    .Where(se => se.CourseId == courseId)
                    .Select(se => se.UserId)
                    .ToListAsync();

                var students = new List<StudentBasicDto>();

                // Lấy thông tin sinh viên từ bảng Users
                if (studentIds.Any())
                {
                    var userDetails = await _context.Users
                        .Where(u => studentIds.Contains(u.UserId))
                        .Select(u => new { u.UserId, u.FullName })
                        .ToListAsync();

                    students = new List<StudentBasicDto>();

                    // Tính tiến độ cho từng sinh viên
                    foreach (var user in userDetails)
                    {
                        var progressDetails = await CalculateStudentProgress(courseId, user.UserId);
                        students.Add(new StudentBasicDto
                        {
                            UserId = user.UserId,
                            FullName = user.FullName,
                            OverallProgress = progressDetails.OverallProgress,
                            AttendanceProgress = progressDetails.AttendanceProgress,
                            AssignmentProgress = progressDetails.AssignmentProgress
                        });
                    }
                }

                return students;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi khi lấy danh sách sinh viên: {ex.Message}");
                throw; // Rethrow để controller có thể xử lý
            }
        }

        // Phương thức mới để tính toán tiến độ của sinh viên
        private async Task<(decimal OverallProgress, decimal AttendanceProgress, decimal AssignmentProgress)> 
            CalculateStudentProgress(int courseId, int studentId)
        {
            // Lấy tất cả bài giảng trong khóa học
            var lectures = await _context.Lectures
                .Where(l => l.CourseId == courseId)
                .Select(l => new Lecture
                {
                    LectureId = l.LectureId,
                    Title = l.Title ?? string.Empty,
                    Content = l.Content ?? string.Empty,
                    Attachment = l.Attachment ?? string.Empty,
                    Type = l.Type ?? string.Empty,
                    Status = l.Status ?? string.Empty,
                    VectorPath = l.VectorPath ?? string.Empty,
                    CourseId = l.CourseId,
                    TeacherId = l.TeacherId,
                    UploadDate = l.UploadDate,
                    TrainingDate = l.TrainingDate,
                    MaxHours = l.MaxHours
                })
                .ToListAsync();

            if (!lectures.Any())
            {
                return (0, 0, 0);
            }

            // Lấy dữ liệu theo dõi cho sinh viên này
            var trackingData = await _context.Set<StudyTracking>()
                .Where(st => st.UserId == studentId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                .ToListAsync();

            int totalLectures = lectures.Count;
            int completedLectures = trackingData.Count(t => t.Status == "hoanthanh");
            
            // Đếm số bài giảng theo loại
            int attendanceLectures = lectures.Count(l => l.Type == "baigiang");
            int assignmentLectures = lectures.Count(l => l.Type == "baikiemtra" || l.Type == "baithi");
            
            // Đếm số bài đã hoàn thành theo loại
            int completedAttendance = trackingData.Count(t => 
                t.Status == "hoanthanh" && 
                lectures.FirstOrDefault(l => l.LectureId == t.LectureId)?.Type == "baigiang");
            
            int completedAssignment = trackingData.Count(t => 
                t.Status == "hoanthanh" && 
                (lectures.FirstOrDefault(l => l.LectureId == t.LectureId)?.Type == "baikiemtra" || 
                 lectures.FirstOrDefault(l => l.LectureId == t.LectureId)?.Type == "baithi"));

            // Tính toán tỷ lệ phần trăm
            decimal overallProgress = totalLectures > 0 ? Math.Round((decimal)completedLectures / totalLectures * 100, 1) : 0;
            decimal attendanceProgress = attendanceLectures > 0 ? Math.Round((decimal)completedAttendance / attendanceLectures * 100, 1) : 0;
            decimal assignmentProgress = assignmentLectures > 0 ? Math.Round((decimal)completedAssignment / assignmentLectures * 100, 1) : 0;

            return (overallProgress, attendanceProgress, assignmentProgress);
        }

        public async Task<StudentProgressDto> GetStudentProgressAsync(int courseId, int studentId)
        {
            // Kiểm tra sinh viên có đăng ký khóa học không
            var enrollment = await _context.StudentEnrollments
                .FirstOrDefaultAsync(se => se.CourseId == courseId && se.UserId == studentId);
            
            if (enrollment == null)
            {
                throw new ArgumentException($"Sinh viên {studentId} không đăng ký khóa học {courseId}");
            }

            // Tính toán tiến độ
            var (overallProgress, attendanceProgress, assignmentProgress) = await CalculateStudentProgress(courseId, studentId);

            // Lấy thông tin khóa học
            var course = await _context.Courses
                .Include(c => c.Subject)
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            // Trả về kết quả
            return new StudentProgressDto
            {
                StudentId = studentId,
                CourseId = courseId,
                CourseName = course?.CourseName ?? $"Khóa học ID: {courseId}",
                SubjectId = course?.SubjectId ?? 0,
                SubjectName = course?.Subject?.SubjectName ?? $"Môn học ID: {course?.SubjectId ?? 0}",
                OverallProgress = overallProgress,
                AttendanceProgress = attendanceProgress,
                AssignmentProgress = assignmentProgress
            };
        }

        public async Task<IEnumerable<ProgressDetailDto>> GetProgressDetailsAsync(int courseId, int studentId)
        {
            // Kiểm tra sinh viên có đăng ký khóa học không
            var enrollment = await _context.StudentEnrollments
                .FirstOrDefaultAsync(se => se.CourseId == courseId && se.UserId == studentId);
            
            if (enrollment == null)
            {
                throw new ArgumentException($"Sinh viên {studentId} không đăng ký khóa học {courseId}");
            }

            // Lấy tất cả bài giảng trong khóa học
            var lectures = await _context.Lectures
                .Where(l => l.CourseId == courseId)
                .Select(l => new Lecture
                {
                    LectureId = l.LectureId,
                    Title = l.Title ?? string.Empty,
                    Content = l.Content ?? string.Empty,
                    Attachment = l.Attachment ?? string.Empty,
                    Type = l.Type ?? string.Empty,
                    Status = l.Status ?? string.Empty,
                    VectorPath = l.VectorPath ?? string.Empty,
                    CourseId = l.CourseId,
                    TeacherId = l.TeacherId,
                    UploadDate = l.UploadDate,
                    TrainingDate = l.TrainingDate,
                    MaxHours = l.MaxHours
                })
                .ToListAsync();

            // Lấy dữ liệu theo dõi cho sinh viên này
            var trackingData = await _context.Set<StudyTracking>()
                .Where(st => st.UserId == studentId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                .ToListAsync();

            var result = new List<ProgressDetailDto>();

            // Tạo dữ liệu chi tiết tiến độ cho từng bài giảng
            foreach (var lecture in lectures)
            {
                var tracking = trackingData.FirstOrDefault(t => t.LectureId == lecture.LectureId);
                
                result.Add(new ProgressDetailDto
                {
                    LectureId = lecture.LectureId,
                    Title = lecture.Title,
                    Progress = tracking?.Progress ?? 0,
                    Status = tracking?.Status ?? "chuahoanthanh",
                    StartDate = tracking?.StartDate,
                    EndDate = tracking?.EndDate
                });
            }

            return result;
        }

        public async Task<IEnumerable<StudentCourseDto>> GetStudentCoursesAsync(int studentId)
        {
            // Kiểm tra sinh viên có tồn tại không
            var userExists = await _context.Users.AnyAsync(u => u.UserId == studentId);
            if (!userExists)
            {
                throw new ArgumentException($"Sinh viên có ID {studentId} không tồn tại");
            }

            // Lấy danh sách khóa học mà sinh viên đã đăng ký
            var enrollments = await _context.StudentEnrollments
                .Where(se => se.UserId == studentId)
                .Select(se => se.CourseId)
                .ToListAsync();

            var result = new List<StudentCourseDto>();

            foreach (var courseId in enrollments)
            {
                // Lấy thông tin khóa học
                var course = await _context.Courses
                    .FirstOrDefaultAsync(c => c.CourseId == courseId);

                if (course == null) continue;

                // Lấy thông tin giảng viên
                var teacherId = await _context.Lectures
                    .Where(l => l.CourseId == courseId)
                    .Select(l => l.TeacherId)
                    .FirstOrDefaultAsync();

                // Sửa lỗi: thay toán tử ?? bằng điều kiện
                var teacherIdValue = teacherId == 0 ? 0 : teacherId;

                var teacher = await _context.Users
                    .Where(u => u.UserId == teacherIdValue)
                    .FirstOrDefaultAsync();

                // Tính toán tiến độ và điểm số
                var (overallProgress, _, _) = await CalculateStudentProgress(courseId, studentId);
                var finalGrade = await CalculateStudentFinalGrade(courseId, studentId);
                var gradeLevel = GetGradeLevel(finalGrade);
                var courseStatus = GetCourseStatus(overallProgress);

                // Tạo DTO
                result.Add(new StudentCourseDto
                {
                    CourseId = courseId,
                    CourseName = course.CourseName ?? string.Empty,
                    TeacherName = teacher?.FullName ?? "Không xác định",
                    TeacherId = teacherIdValue,
                    CourseCode = $"{course.CourseName?.Substring(0, Math.Min(2, course.CourseName.Length)).ToUpper() ?? "CS"}-{courseId:D3}",
                    OverallProgress = overallProgress,
                    FinalGrade = finalGrade,
                    GradeLevel = gradeLevel,
                    CourseStatus = courseStatus,
                    EnrollmentDate = DateTime.Now.AddMonths(-1) // Giả định, trong thực tế cần lưu ngày đăng ký
                });
            }

            return result;
        }

        public async Task<StudentResultsDto> GetStudentResultsAsync(int studentId, int courseId)
        {
            // Kiểm tra sinh viên đã đăng ký khóa học chưa
            var enrollment = await _context.StudentEnrollments
                .FirstOrDefaultAsync(se => se.CourseId == courseId && se.UserId == studentId);

            if (enrollment == null)
            {
                throw new ArgumentException($"Sinh viên {studentId} không đăng ký khóa học {courseId}");
            }

            // Lấy thông tin khóa học
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            if (course == null)
            {
                throw new ArgumentException($"Khóa học {courseId} không tồn tại");
            }

            // Lấy thông tin giảng viên
            var teacherId = await _context.Lectures
                .Where(l => l.CourseId == courseId)
                .Select(l => l.TeacherId)
                .FirstOrDefaultAsync();

            // Sửa lỗi: thay toán tử ?? bằng điều kiện
            var teacherIdValue = teacherId == 0 ? 0 : teacherId; 

            var teacher = await _context.Users
                .Where(u => u.UserId == teacherIdValue)
                .FirstOrDefaultAsync();

            // Lấy tất cả bài giảng trong khóa học
            var lectures = await _context.Lectures
                .Where(l => l.CourseId == courseId)
                .ToListAsync();

            // Lấy dữ liệu theo dõi học tập từ bảng studytracking
            var studyTracking = await _context.Set<StudyTracking>()
                .Where(st => st.UserId == studentId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                .ToListAsync();

            // Tính toán tiến độ và điểm số
            decimal overallProgress = 0;
            int completedLessons = 0;
            
            if (lectures.Any())
            {
                completedLessons = studyTracking.Count(st => st.Status == "hoanthanh");
                // Tính tiến độ tổng thể dựa trên tỷ lệ bài học đã hoàn thành
                overallProgress = lectures.Count > 0 
                    ? Math.Round((decimal)completedLessons / lectures.Count * 100, 2) 
                    : 0;
            }
            
            // Tạo kết quả
            var result = new StudentResultsDto
            {
                CourseId = courseId,
                CourseName = course.CourseName ?? string.Empty,
                TeacherName = teacher?.FullName ?? "Không xác định",
                TeacherId = teacherIdValue,
                CourseCode = $"{course.CourseName?.Substring(0, Math.Min(2, course.CourseName.Length)).ToUpper() ?? "CS"}-{courseId:D3}",
                OverallProgress = overallProgress,
                FinalGrade = 0, // Sẽ tính dựa trên dữ liệu studytracking
                GradeLevel = "", // Sẽ được cập nhật sau
                CourseStatus = GetCourseStatus(overallProgress),
                CompletedLessons = completedLessons,
                TotalLessons = lectures.Count,
                LectureResults = new List<LectureResultDto>(),
                AssessmentResults = new List<AssessmentResultDto>()
            };

            // Tạo kết quả chi tiết cho từng bài giảng dựa trên dữ liệu studytracking
            foreach (var lecture in lectures)
            {
                var tracking = studyTracking.FirstOrDefault(st => st.LectureId == lecture.LectureId);

                // Xử lý bài giảng và bài tập riêng biệt
                if (lecture.Type == "baikiemtra" || lecture.Type == "baithi")
                {
                    // Thêm vào danh sách bài kiểm tra/thi
                    result.AssessmentResults.Add(new AssessmentResultDto
                    {
                        LectureId = lecture.LectureId,
                        Title = lecture.Title ?? string.Empty,
                        AssessmentDate = tracking?.EndDate,
                        Score = tracking?.Progress ?? 0,
                        CorrectAnswers = (int)Math.Round((tracking?.Progress ?? 0) / 10), // Giả định: mỗi 10% tương đương 1 câu đúng
                        TotalQuestions = 10, // Giả định: mỗi bài kiểm tra có 10 câu
                        TimeSpentMinutes = tracking?.EndDate != null && tracking?.StartDate != null ? 
                            (int)Math.Round((tracking.EndDate.Value - tracking.StartDate.Value).TotalMinutes) : 0,
                        Status = tracking?.Status == "hoanthanh" ? "Hoàn thành" : "Chưa hoàn thành",
                        Type = lecture.Type == "baikiemtra" ? "quiz" : "exam"
                    });
                }

                // Thêm vào kết quả chi tiết bài giảng (cho mọi loại bài giảng)
                result.LectureResults.Add(new LectureResultDto
                {
                    LectureId = lecture.LectureId,
                    LectureCode = $"{result.CourseCode}-{lecture.LectureId:D2}",
                    Title = lecture.Title ?? string.Empty,
                    Type = TranslateLectureType(lecture.Type),
                    Progress = tracking?.Progress ?? 0,
                    Grade = tracking?.Progress != null ? tracking.Progress / 10 : null,
                    Status = tracking?.Status == "hoanthanh" ? "Hoàn thành" : "Chưa hoàn thành",
                    StartDate = tracking?.StartDate,
                    EndDate = tracking?.EndDate,
                    CompletionDate = tracking?.EndDate
                });
            }

            // Tính toán điểm tổng kết dựa trên tiến độ các bài học đã hoàn thành
            if (studyTracking.Any(st => st.Status == "hoanthanh"))
            {
                decimal totalProgress = studyTracking.Where(st => st.Status == "hoanthanh").Sum(st => st.Progress);
                int completedCount = studyTracking.Count(st => st.Status == "hoanthanh");
                decimal finalGrade = completedCount > 0 ? Math.Round(totalProgress / (completedCount * 10), 1) : 0;
                
                result.FinalGrade = finalGrade;
                result.GradeLevel = GetGradeLevel(finalGrade);
            }
            else
            {
                result.FinalGrade = 0;
                result.GradeLevel = "F";
            }

            return result;
        }

        // Phương thức hỗ trợ để tính điểm trung bình
        private async Task<decimal> CalculateStudentFinalGrade(int courseId, int studentId)
        {
            // Lấy tất cả bài giảng trong khóa học
            var lectures = await _context.Lectures
                .Where(l => l.CourseId == courseId)
                .Select(l => new { l.LectureId, l.Type })
                .ToListAsync();

            if (!lectures.Any())
            {
                return 0;
            }

            // Lấy dữ liệu theo dõi học tập
            var studyTracking = await _context.Set<StudyTracking>()
                .Where(st => st.UserId == studentId && lectures.Select(l => l.LectureId).Contains(st.LectureId))
                .ToListAsync();

            // Nếu chưa có bài học nào được hoàn thành
            if (!studyTracking.Any(st => st.Status == "hoanthanh"))
            {
                return 0;
            }

            // Tính điểm trung bình dựa trên tiến độ các bài học đã hoàn thành
            decimal totalGrade = 0;
            int completedCount = 0;

            foreach (var tracking in studyTracking.Where(st => st.Status == "hoanthanh"))
            {
                // Chuyển đổi từ phần trăm (0-100) sang thang điểm 10
                var grade = tracking.Progress / 10;
                totalGrade += grade;
                completedCount++;
            }

            return completedCount > 0 ? Math.Round(totalGrade / completedCount, 1) : 0;
        }

        // Phương thức hỗ trợ để lấy xếp loại dựa trên điểm
        private string GetGradeLevel(decimal grade)
        {
            // Sửa lỗi: thêm hậu tố M để chỉ định các số là kiểu decimal
            if (grade >= 9M) return "A+";
            if (grade >= 8.5M) return "A";
            if (grade >= 8M) return "B+";
            if (grade >= 7M) return "B";
            if (grade >= 6.5M) return "C+";
            if (grade >= 5.5M) return "C";
            if (grade >= 5M) return "D+";
            if (grade >= 4M) return "D";
            return "F";
        }

        // Phương thức hỗ trợ để lấy trạng thái khóa học
        private string GetCourseStatus(decimal progress)
        {
            if (progress >= 100) return "Hoàn thành";
            if (progress >= 70) return "Đang học";
            if (progress > 0) return "Mới bắt đầu";
            return "Chưa bắt đầu";
        }

        // Phương thức hỗ trợ để dịch loại bài giảng
        private string TranslateLectureType(string type)
        {
            switch (type)
            {
                case "baigiang": return "Bài giảng";
                case "baikiemtra": return "Bài kiểm tra";
                case "baithi": return "Bài thi";
                default: return type;
            }
        }

        // Phương thức hỗ trợ tạo điểm ngẫu nhiên trong khoảng cho trước
        private decimal GenerateRandomGrade(decimal min, decimal max)
        {
            Random random = new Random();
            return Math.Round((decimal)random.NextDouble() * (max - min) + min, 1);
        }
    }
} 