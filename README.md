# VirtualAdvisor API

API xác thực và phân quyền cho ứng dụng VirtualAdvisor.

## Tính năng

- Đăng nhập
- Đăng ký
- Quên mật khẩu
- Phân quyền truy cập (Admin, Teacher, Student, Other)

## Yêu cầu

- .NET SDK 8.0+
- MySQL

## Cài đặt

1. Clone repository
2. Cập nhật chuỗi kết nối trong `appsettings.json` để phù hợp với cấu hình MySQL của bạn
3. Chạy các lệnh sau:

```bash
cd WebAPI/VirtualAdvisorAPI
dotnet restore
dotnet run
```

## Cấu trúc dự án

- `Controllers/`: Chứa các controller API
- `Models/`: Chứa các model dữ liệu
- `Services/`: Chứa các dịch vụ xử lý logic
- `Data/`: Chứa lớp kết nối cơ sở dữ liệu
- `wwwroot/`: Chứa các file tĩnh (HTML, CSS, JavaScript)

## Luồng hoạt động

1. Người dùng truy cập vào trang đăng nhập (`/main/login.html`)
2. Sau khi đăng nhập thành công, hệ thống kiểm tra vai trò:
   - Admin: Chuyển hướng đến `/admin/index.html`
   - Teacher: Chuyển hướng đến `/teacher/index.html`
   - Student/Other: Chuyển hướng đến `/student/index.html`

## API Endpoints

### Xác thực

- POST `/api/auth/login`: Đăng nhập
- POST `/api/auth/register`: Đăng ký
- POST `/api/auth/forgot-password`: Quên mật khẩu
- POST `/api/auth/reset-password`: Đặt lại mật khẩu
- GET `/api/auth/redirect`: Lấy URL chuyển hướng dựa trên vai trò

## Bảo mật

- Mật khẩu được băm an toàn trước khi lưu vào cơ sở dữ liệu
- JWT (JSON Web Token) được sử dụng để xác thực và phân quyền 