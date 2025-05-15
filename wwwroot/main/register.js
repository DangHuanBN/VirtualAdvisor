document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra nếu đã đăng nhập thì chuyển hướng
    if (AuthAPI.isLoggedIn()) {
        redirectBasedOnRole();
        return;
    }

    // Lấy form đăng ký
    const registerForm = document.getElementById('registerForm');
    
    // Thêm sự kiện submit cho form
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Hiển thị thông báo đang xử lý
            showMessage('Đang xử lý đăng ký...', 'info');

            try {
                // Lấy dữ liệu từ form
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone')?.value;
                const dob = document.getElementById('dob')?.value;
                
                // Xử lý giới tính
                const genderMale = document.getElementById('male');
                const gender = genderMale && genderMale.checked ? true : false;
                
                const address = document.getElementById('address')?.value;
                
                // Luôn đặt vai trò là 'Student' (Sinh viên)
                let role = 'Student';
                
                console.log("===== THÔNG TIN ĐĂNG KÝ =====");
                console.log("Username:", username);
                console.log("Password:", "********");
                console.log("Họ tên:", fullName);
                console.log("Email:", email || "Không có");
                console.log("SĐT:", phone || "Không có");
                console.log("Ngày sinh:", dob || "Không có");
                console.log("Giới tính:", gender ? "Nam" : "Nữ");
                console.log("Địa chỉ:", address || "Không có");
                console.log("Vai trò:", role);
                
                // Xác thực dữ liệu
                if (!username || !password || !confirmPassword || !fullName) {
                    showMessage('Vui lòng nhập đầy đủ thông tin bắt buộc', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showMessage('Mật khẩu xác nhận không khớp', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
                    return;
                }
                
                // Chuẩn bị dữ liệu đăng ký
                const userData = {
                    username,
                    password,
                    confirmPassword,
                    fullName,
                    email: email || null,
                    phone: phone || null,
                    // Chuyển đổi role string sang enum number
                    role: convertRoleToEnum(role),
                    dob: dob ? new Date(dob).toISOString() : null,
                    gender,
                    address: address || null
                };
                
                console.log("Dữ liệu gửi đi:", JSON.stringify(userData));
                console.log("Role (number):", userData.role);
                
                // TEST TRƯỚC KHI GỬI
                try {
                    // Kiểm tra dữ liệu hợp lệ
                    if (email && !validateEmail(email)) {
                        showMessage('Email không đúng định dạng', 'error');
                        return;
                    }
                    
                    if (phone && !validatePhone(phone)) {
                        showMessage('Số điện thoại không đúng định dạng', 'error');
                        return;
                    }
                    
                    // Kiểm tra định dạng JSON
                    JSON.stringify(userData);

                    // Kiểm tra xem role có phải là số nguyên từ 0-3 không
                    if (typeof userData.role !== 'number' || userData.role < 0 || userData.role > 3) {
                        console.error("Lỗi role không hợp lệ:", userData.role);
                        userData.role = 2; // Default to Student
                        console.log("Đã sửa role thành Student (2)");
                    }
                } catch (validationError) {
                    console.error("Lỗi định dạng dữ liệu:", validationError);
                    showMessage('Dữ liệu không hợp lệ: ' + validationError.message, 'error');
                    return;
                }
                
                console.log("Bắt đầu gửi yêu cầu đăng ký...");
                
                // Gọi API đăng ký
                const response = await AuthAPI.register(userData);
                
                console.log("Phản hồi từ server:", response);
                
                if (response && response.success) {
                    showMessage('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
                    
                    // Chuyển hướng đến trang đăng nhập sau 2 giây
                    setTimeout(() => {
                        window.location.href = '/main/login.html';
                    }, 2000);
                } else {
                    const errorMsg = response?.message || 'Đăng ký thất bại, vui lòng thử lại';
                    showMessage(errorMsg, 'error');
                }
            } catch (error) {
                console.error("LỖI NGHIÊM TRỌNG KHI ĐĂNG KÝ:", error);
                showMessage('Lỗi đăng ký: ' + error.message, 'error');
                
                // Hiển thị thông tin lỗi chi tiết trong console
                console.group("Chi tiết lỗi đăng ký");
                console.error("Message:", error.message);
                console.error("Stack:", error.stack);
                console.groupEnd();
            }
        });
    } else {
        console.error("Không tìm thấy form đăng ký!");
    }
});

// Hiển thị thông báo
function showMessage(message, type = 'info') {
    const messageContainer = document.querySelector('.message-container') || createMessageContainer();
    
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 3000);
}

// Tạo container thông báo nếu chưa có
function createMessageContainer() {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.style.display = 'none';
    
    // Thêm style cho container
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '20px';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translateX(-50%)';
    messageContainer.style.padding = '10px 20px';
    messageContainer.style.borderRadius = '5px';
    messageContainer.style.zIndex = '1000';
    
    // Thêm vào body
    document.body.appendChild(messageContainer);
    
    return messageContainer;
}

// Chuyển hướng dựa trên vai trò
async function redirectBasedOnRole() {
    try {
        const user = AuthAPI.getCurrentUser();
        
        if (!user) {
            showMessage('Không tìm thấy thông tin người dùng', 'error');
            return;
        }
        
        console.log("User sau khi đăng ký:", user);
        console.log("Role:", user.role);
        
        // HARD-CODE ADMIN FIRST - Ưu tiên kiểm tra Admin trước
        if (user.role === 'Admin' || 
            (typeof user.role === 'string' && user.role.toLowerCase() === 'admin') ||
            user.role === 0) {
            console.log('PHÁT HIỆN ADMIN! Chuyển hướng đến trang admin');
            window.location.href = '/admin/index.html';
            return;
        }
        
        // Kiểm tra Teacher
        if (user.role === 'Teacher' || 
            (typeof user.role === 'string' && user.role.toLowerCase() === 'teacher') ||
            user.role === 1) {
            console.log('PHÁT HIỆN TEACHER! Chuyển hướng đến trang teacher');
            window.location.href = '/teacher/index.html';
            return;
        }
        
        // Các trường hợp còn lại (Student, Other hoặc không xác định)
        console.log('Vai trò Student - chuyển đến trang sinh viên');
        window.location.href = '/student/index.html';
    } catch (error) {
        console.error("Lỗi khi chuyển hướng:", error);
        showMessage('Lỗi khi chuyển hướng: ' + error.message, 'error');
    }
}

// Hàm kiểm tra email
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Hàm kiểm tra số điện thoại
function validatePhone(phone) {
    const re = /^[0-9]{10,15}$/;
    return re.test(String(phone).trim());
}

// Hàm chuyển đổi role từ string sang enum number
function convertRoleToEnum(roleString) {
    // Luôn trả về giá trị 2 (Student) bất kể đầu vào
    return 2;
} 