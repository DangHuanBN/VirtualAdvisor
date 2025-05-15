document.addEventListener('DOMContentLoaded', () => {
    // KHẮC PHỤC TRỰC TIẾP: Thêm nút fix role cho admin nếu đã đăng nhập
    if (AuthAPI.isLoggedIn()) {
        const fixAdminButton = document.createElement('button');
        fixAdminButton.textContent = 'Khắc phục lỗi Admin';
        fixAdminButton.style.position = 'fixed';
        fixAdminButton.style.top = '10px';
        fixAdminButton.style.right = '10px';
        fixAdminButton.style.zIndex = '9999';
        fixAdminButton.style.padding = '10px';
        fixAdminButton.style.backgroundColor = '#ff5722';
        fixAdminButton.style.color = 'white';
        fixAdminButton.style.border = 'none';
        fixAdminButton.style.borderRadius = '5px';
        fixAdminButton.style.cursor = 'pointer';
        
        fixAdminButton.addEventListener('click', () => {
            try {
                // Lấy thông tin user từ localStorage
                const userJson = localStorage.getItem('user');
                if (!userJson) {
                    alert('Không tìm thấy thông tin người dùng!');
                    return;
                }
                
                // Parse và sửa vai trò
                const user = JSON.parse(userJson);
                const oldRole = user.role;
                
                // Cập nhật role thành "Admin"
                user.role = 'Admin';
                
                // Lưu lại
                localStorage.setItem('user', JSON.stringify(user));
                
                alert(`Đã sửa vai trò từ "${oldRole}" thành "Admin".\nNhấn OK để chuyển hướng đến trang admin.`);
                
                // Chuyển hướng
                window.location.href = '/admin/index.html';
            } catch (error) {
                alert('Lỗi khi khắc phục: ' + error.message);
                console.error(error);
            }
        });
        
        document.body.appendChild(fixAdminButton);
    }

    // Kiểm tra nếu đã đăng nhập thì chuyển hướng
    if (AuthAPI.isLoggedIn()) {
        redirectBasedOnRole();
        return;
    }

    // Lấy form đăng nhập
    const loginForm = document.getElementById('loginForm');
    
    // Thêm sự kiện submit cho form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Lấy dữ liệu từ form
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Xác thực dữ liệu
            if (!username || !password) {
                showMessage('Vui lòng nhập đầy đủ thông tin', 'error');
                return;
            }
            
            try {
                // Gọi API đăng nhập
                const response = await AuthAPI.login(username, password);
                
                if (response.success) {
                    showMessage('Đăng nhập thành công, đang chuyển hướng...', 'success');
                    
                    // Hiển thị thông báo chuyển hướng với vai trò
                    showRedirectInfo(response.user?.role);
                    
                    // Chuyển hướng dựa trên vai trò
                    setTimeout(() => redirectBasedOnRole(), 1000);
                } else {
                    showMessage(response.message || 'Đăng nhập thất bại', 'error');
                }
            } catch (error) {
                showMessage(error.message || 'Có lỗi xảy ra khi đăng nhập', 'error');
            }
        });
    }

    // Đặt sự kiện cho liên kết quên mật khẩu
    const forgotPasswordLink = document.querySelector('.forgot-password a');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'forgotpassword.html';
        });
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

// Hiển thị thông báo chuyển hướng
function showRedirectInfo(role) {
    const redirectInfo = document.getElementById('redirectInfo');
    const roleTarget = document.getElementById('roleTarget');
    
    if (!redirectInfo || !roleTarget) return;
    
    // Xác định văn bản vai trò
    let roleText = 'người dùng';
    if (role) {
        // Chuyển đổi vai trò thành văn bản dễ đọc
        switch(typeof role === 'string' ? role.toLowerCase() : role) {
            case 'admin':
            case 0:
                roleText = 'quản trị viên';
                break;
            case 'teacher':
            case 1:
                roleText = 'giáo viên';
                break;
            case 'student':
            case 2:
                roleText = 'sinh viên';
                break;
            default:
                roleText = 'người dùng';
        }
    }
    
    // Thiết lập văn bản và hiển thị
    roleTarget.textContent = roleText;
    redirectInfo.style.display = 'block';
    
    // Thêm CSS cho animation nếu chưa có
    if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
}

// Chuyển hướng dựa trên vai trò
async function redirectBasedOnRole() {
    try {
        const user = AuthAPI.getCurrentUser();
        
        if (!user) {
            showMessage('Không tìm thấy thông tin người dùng', 'error');
            return;
        }
        
        // ===== DEBUG SUPER DETAIL =====
        console.log('====== DEBUG SIÊU CHI TIẾT ======');
        console.log('User đầy đủ:', user);
        console.log('Role gốc:', user.role);
        console.log('Kiểu dữ liệu role:', typeof user.role);
        
        // Kiểm tra chính xác chuỗi JSON
        const userString = JSON.stringify(user);
        console.log('User dạng JSON string:', userString);
        
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
        console.log('Vai trò mặc định hoặc Student - chuyển đến trang sinh viên');
        window.location.href = '/student/index.html';
        
    } catch (error) {
        console.error('LỖI NGHIÊM TRỌNG KHI CHUYỂN HƯỚNG:', error);
        showMessage('Lỗi khi chuyển hướng: ' + error.message, 'error');
        
        // Tự động đăng xuất nếu lỗi
        setTimeout(() => {
            console.log('Đăng xuất do lỗi...');
            localStorage.clear(); // Xóa hết localStorage để đảm bảo
            window.location.href = '/main/login.html';
        }, 3000);
    }
} 