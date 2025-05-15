using Microsoft.EntityFrameworkCore;
using VirtualAdvisorAPI.Models;

namespace VirtualAdvisorAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<OtpCode> OtpCodes { get; set; }
        public DbSet<Lecture> Lectures { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<FeedbackHistory> FeedbackHistories { get; set; }
        public DbSet<StudentEnrollment> StudentEnrollments { get; set; }
        public DbSet<StudyTracking> StudyTrackings { get; set; }
        public DbSet<AITraining> AITrainings { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<LearningPath> LearningPaths { get; set; }
        public DbSet<LearningPathDetail> LearningPathDetails { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Thiết lập các ràng buộc cho bảng Users
            modelBuilder.Entity<User>()
                .ToTable("Users")
                .HasKey(u => u.UserId);

            modelBuilder.Entity<User>()
                .Property(u => u.UserId)
                .HasColumnName("user_id");

            modelBuilder.Entity<User>()
                .Property(u => u.Username)
                .HasColumnName("username")
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.Password)
                .HasColumnName("password")
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.FullName)
                .HasColumnName("full_name")
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.Dob)
                .HasColumnName("dob");

            modelBuilder.Entity<User>()
                .Property(u => u.Gender)
                .HasColumnName("gender");

            modelBuilder.Entity<User>()
                .Property(u => u.Address)
                .HasColumnName("address");

            modelBuilder.Entity<User>()
                .Property(u => u.Email)
                .HasColumnName("email");

            modelBuilder.Entity<User>()
                .Property(u => u.Phone)
                .HasColumnName("phone");

            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasColumnName("role")
                .HasConversion<string>()
                .IsRequired();

            // Thêm unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Phone)
                .IsUnique();

            // Thiết lập các ràng buộc cho bảng OtpCodes
            modelBuilder.Entity<OtpCode>()
                .ToTable("OtpCodes")
                .HasKey(o => o.Id);

            modelBuilder.Entity<OtpCode>()
                .Property(o => o.Id)
                .HasColumnName("id");

            modelBuilder.Entity<OtpCode>()
                .Property(o => o.Email)
                .HasColumnName("email")
                .IsRequired();

            modelBuilder.Entity<OtpCode>()
                .Property(o => o.Code)
                .HasColumnName("code")
                .IsRequired();

            modelBuilder.Entity<OtpCode>()
                .Property(o => o.ExpiryTime)
                .HasColumnName("expiry_time")
                .IsRequired();

            modelBuilder.Entity<OtpCode>()
                .Property(o => o.IsUsed)
                .HasColumnName("is_used")
                .IsRequired();
                
            // Thiết lập các ràng buộc cho bảng Lectures
            modelBuilder.Entity<Lecture>()
                .ToTable("lecture")
                .HasKey(l => l.LectureId);
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.LectureId)
                .HasColumnName("lecture_id");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.CourseId)
                .HasColumnName("course_id");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.TeacherId)
                .HasColumnName("teacher_id");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.Title)
                .HasColumnName("title");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.Content)
                .HasColumnName("content");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.Attachment)
                .HasColumnName("attachment");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.UploadDate)
                .HasColumnName("upload_date");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.Type)
                .HasColumnName("type");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.Status)
                .HasColumnName("status");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.VectorPath)
                .HasColumnName("vector_path");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.TrainingDate)
                .HasColumnName("training_date");
                
            modelBuilder.Entity<Lecture>()
                .Property(l => l.MaxHours)
                .HasColumnName("maxhours");
                
            // Thiết lập các ràng buộc cho bảng Subjects
            modelBuilder.Entity<Subject>()
                .ToTable("subjects")
                .HasKey(s => s.SubjectId);
                
            modelBuilder.Entity<Subject>()
                .Property(s => s.SubjectId)
                .HasColumnName("subject_id");
                
            modelBuilder.Entity<Subject>()
                .Property(s => s.SubjectName)
                .HasColumnName("subject_name")
                .IsRequired();
                
            modelBuilder.Entity<Subject>()
                .Property(s => s.Credits)
                .HasColumnName("credits")
                .IsRequired();
                
            // Thiết lập các ràng buộc cho bảng Courses
            modelBuilder.Entity<Course>()
                .ToTable("course")
                .HasKey(c => c.CourseId);
                
            // Thiết lập quan hệ giữa Subject và Course
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Subject)
                .WithMany(s => s.Courses)
                .HasForeignKey(c => c.SubjectId);
                
            // Thiết lập các ràng buộc cho bảng StudentEnrollment
            modelBuilder.Entity<StudentEnrollment>()
                .HasKey(s => new { s.UserId, s.CourseId });
                
            modelBuilder.Entity<StudentEnrollment>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<StudentEnrollment>()
                .HasOne(s => s.Course)
                .WithMany()
                .HasForeignKey(s => s.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Thiết lập các ràng buộc cho bảng FeedbackHistory
            modelBuilder.Entity<FeedbackHistory>()
                .HasKey(f => f.FeedbackId);
                
            modelBuilder.Entity<FeedbackHistory>()
                .Property(f => f.FeedbackId)
                .ValueGeneratedOnAdd();
                
            // Thiết lập các ràng buộc cho bảng StudyTracking
            modelBuilder.Entity<StudyTracking>()
                .ToTable("studytracking")
                .HasKey(st => st.TrackingId);
                
            modelBuilder.Entity<StudyTracking>()
                .Property(st => st.TrackingId)
                .HasColumnName("tracking_id")
                .ValueGeneratedOnAdd();
                
            modelBuilder.Entity<StudyTracking>()
                .HasOne(st => st.User)
                .WithMany()
                .HasForeignKey(st => st.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<StudyTracking>()
                .HasOne(st => st.Lecture)
                .WithMany()
                .HasForeignKey(st => st.LectureId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Thiết lập các ràng buộc cho bảng AITraining
            modelBuilder.Entity<AITraining>()
                .ToTable("AI_Training")
                .HasKey(t => t.TrainingId);
                
            modelBuilder.Entity<AITraining>()
                .Property(t => t.TrainingId)
                .HasColumnName("training_id")
                .ValueGeneratedOnAdd();
                
            modelBuilder.Entity<AITraining>()
                .HasOne(t => t.Lecture)
                .WithMany()
                .HasForeignKey(t => t.LectureId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Thiết lập các ràng buộc cho bảng Chat
            modelBuilder.Entity<Chat>()
                .ToTable("chathistory")
                .HasKey(c => c.ChatId);
                
            modelBuilder.Entity<Chat>()
                .Property(c => c.ChatId)
                .HasColumnName("chat_id")
                .ValueGeneratedOnAdd();

            // Thiết lập các ràng buộc cho bảng LearningPath
            modelBuilder.Entity<LearningPath>()
                .ToTable("learningpath")
                .HasKey(lp => lp.PathId);
                
            modelBuilder.Entity<LearningPath>()
                .Property(lp => lp.PathId)
                .HasColumnName("path_id")
                .ValueGeneratedOnAdd();
                
            modelBuilder.Entity<LearningPath>()
                .Property(lp => lp.CourseId)
                .HasColumnName("course_id");
                
            modelBuilder.Entity<LearningPath>()
                .Property(lp => lp.PathName)
                .HasColumnName("path_name")
                .IsRequired();
                
            modelBuilder.Entity<LearningPath>()
                .HasOne(lp => lp.Course)
                .WithMany()
                .HasForeignKey(lp => lp.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Thiết lập các ràng buộc cho bảng LearningPathDetail
            modelBuilder.Entity<LearningPathDetail>()
                .ToTable("learningpathdetail")
                .HasKey(lpd => lpd.DetailId);
                
            modelBuilder.Entity<LearningPathDetail>()
                .Property(lpd => lpd.DetailId)
                .HasColumnName("detail_id")
                .ValueGeneratedOnAdd();
                
            modelBuilder.Entity<LearningPathDetail>()
                .Property(lpd => lpd.PathId)
                .HasColumnName("path_id");
                
            modelBuilder.Entity<LearningPathDetail>()
                .Property(lpd => lpd.LectureId)
                .HasColumnName("lecture_id");
                
            modelBuilder.Entity<LearningPathDetail>()
                .Property(lpd => lpd.OrderNumber)
                .HasColumnName("order_number");
                
            modelBuilder.Entity<LearningPathDetail>()
                .HasOne(lpd => lpd.LearningPath)
                .WithMany(lp => lp.LearningPathDetails)
                .HasForeignKey(lpd => lpd.PathId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<LearningPathDetail>()
                .HasOne(lpd => lpd.Lecture)
                .WithMany()
                .HasForeignKey(lpd => lpd.LectureId)
                .OnDelete(DeleteBehavior.Cascade);

            // Notification configuration
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
} 