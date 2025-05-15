using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using VirtualAdvisorAPI.Data;
using VirtualAdvisorAPI.Services;
using VirtualAdvisorAPI.Repositories;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Thêm CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.SetIsOriginAllowed(origin => true) // Cho phép tất cả origin trong development
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

// Thêm Memory Cache
builder.Services.AddMemoryCache();

// Thêm kết nối cơ sở dữ liệu
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(builder.Configuration.GetConnectionString("DefaultConnection")));

// Đăng ký dịch vụ xác thực và các dịch vụ khác
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<ILectureService, LectureService>();
builder.Services.AddScoped<ILearningPathService, LearningPathService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<IFileConverterService, FileConverterService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBackupService, BackupService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IExamService, ExamService>();

// Đăng ký repositories
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISubjectCourseRepository, SubjectCourseRepository>();

// Đăng ký services
builder.Services.AddScoped<ISubjectService, SubjectService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ICourseStudentService, CourseStudentService>();
builder.Services.AddScoped<ISubjectCourseService, SubjectCourseService>();

// Đăng ký HttpClient
builder.Services.AddHttpClient();

// Thêm xác thực JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration.GetSection("AppSettings:Token").Value)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "VirtualAdvisor API", Version = "v1" });
    
    // Cấu hình Swagger để sử dụng JWT
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Sử dụng CORS
app.UseCors();

// Phục vụ các tệp tĩnh từ wwwroot
app.UseStaticFiles();

// Phục vụ tệp từ thư mục AI_Training
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "AI_Training");
if (Directory.Exists(uploadsPath))
{
    Console.WriteLine($"Thư mục AI_Training tồn tại: {uploadsPath}");
    var uploadsSubdir = Path.Combine(uploadsPath, "uploads");
    if (Directory.Exists(uploadsSubdir))
    {
        Console.WriteLine($"Thư mục uploads tồn tại: {uploadsSubdir}");
        var files = Directory.GetFiles(uploadsSubdir);
        Console.WriteLine($"Số lượng file trong thư mục uploads: {files.Length}");
        foreach (var file in files)
        {
            Console.WriteLine($"File: {file}");
        }
    }
    else
    {
        Console.WriteLine($"CẢNH BÁO: Không tìm thấy thư mục uploads: {uploadsSubdir}");
    }
    
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath = "/AI_Training"
    });
}
else
{
    Console.WriteLine($"CẢNH BÁO: Không tìm thấy thư mục AI_Training: {uploadsPath}");
}

// Thêm middleware theo đúng thứ tự - đây là phần sửa chính
app.UseRouting();

// QUAN TRỌNG: UseAuthentication phải đứng trước UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

// Chuyển hướng đến trang chủ khi truy cập gốc
app.MapGet("/", context =>
{
    context.Response.Redirect("/main/index.html");
    return Task.CompletedTask;
});

// Cấu hình API Endpoints
app.UseEndpoints(endpoints =>
{
    // Add API routes here
    endpoints.MapControllers();

    // Thêm endpoint cho studytracking API
    endpoints.MapControllerRoute(
        name: "studytracking",
        pattern: "api/studytracking",
        defaults: new { controller = "Progress", action = "GetStudyTracking" }
    );

    endpoints.MapControllerRoute(
        name: "studytrackingByStudent",
        pattern: "api/studytracking/student/{studentId}/course/{courseId}",
        defaults: new { controller = "Progress", action = "GetStudyTrackingByStudentAndCourse" }
    );

    endpoints.MapControllerRoute(
        name: "trackingAlternative",
        pattern: "api/tracking/{studentId}/{courseId}",
        defaults: new { controller = "Progress", action = "GetTrackingAlternative" }
    );

    endpoints.MapControllerRoute(
        name: "trackingAlternative2",
        pattern: "api/tracking",
        defaults: new { controller = "Progress", action = "GetTrackingAlternative2" }
    );

    endpoints.MapControllerRoute(
        name: "lecturetracking",
        pattern: "api/lectures/{lectureId}/tracking/{userId}",
        defaults: new { controller = "Lecture", action = "GetLectureTrackingForUser" }
    );
    
    // Thêm endpoint cho tracking update API
    endpoints.MapControllerRoute(
        name: "updateTracking",
        pattern: "api/tracking/update",
        defaults: new { controller = "Tracking", action = "UpdateStudyTracking" }
    );
    
    // Thêm endpoint cho file conversion API
    endpoints.MapControllerRoute(
        name: "convertFile",
        pattern: "api/fileconverter/convert",
        defaults: new { controller = "FileConverter", action = "ConvertToPdf" }
    );
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
