/**
 * File hỗ trợ xác thực và lưu trữ thông tin người dùng
 */

document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị thông tin người dùng trong sidebar
    displayUserInfo();
    
    // Debug thông tin người dùng
    debugUserInfo();
});

/**
 * Xóa thông tin người dùng khỏi localStorage
 */
function clearUserInfo() {
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userData');
    localStorage.removeItem('auth');
    console.log('Đã xóa thông tin người dùng trong localStorage');
}

/**
 * Kiểm tra thông tin người dùng trong localStorage
 */
function debugUserInfo() {
    console.log('DEBUG - Thông tin người dùng:');
    console.log('currentUser:', localStorage.getItem('currentUser'));
    console.log('user:', localStorage.getItem('user'));
    console.log('userData:', localStorage.getItem('userData'));
    console.log('userInfo:', localStorage.getItem('userInfo'));
    console.log('auth:', localStorage.getItem('auth'));
    console.log('token:', localStorage.getItem('token'));
}

/**
 * Lấy ID của người dùng hiện tại
 */
function getCurrentUserId() {
    // Kiểm tra các key phổ biến
    const possibleKeys = ['currentUser', 'user', 'userData', 'userInfo', 'auth'];
    
    // Thử từng key để tìm thông tin người dùng
    for (const key of possibleKeys) {
        const userStr = localStorage.getItem(key);
        if (!userStr) continue;
        
        try {
            const userData = JSON.parse(userStr);
            
            // Kiểm tra các trường có thể chứa userId
            if (userData.userId) {
                return userData.userId;
            } else if (userData.user_id) {
                return userData.user_id;
            } else if (userData.id) {
                return userData.id;
            } else if (userData.user && userData.user.id) {
                return userData.user.id;
            }
        } catch (error) {
            console.log(`Không thể parse dữ liệu từ key "${key}":`, error);
            continue;
        }
    }
    
    // Nếu không tìm thấy ID, chuyển hướng đến trang đăng nhập
    console.error('Không tìm thấy ID người dùng, cần đăng nhập lại');
    
    if (confirm('Bạn cần đăng nhập để tiếp tục. Đến trang đăng nhập?')) {
        window.location.href = '/index.html';
    }
    
    return null;
}

/**
 * Hiển thị thông tin người dùng trong sidebar
 */
function displayUserInfo() {
    // Lấy thông tin người dùng từ localStorage
    let userData = null;
    
    // Thử từng key có thể chứa thông tin người dùng
    const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('userInfo');
    
    if (userStr) {
        try {
            userData = JSON.parse(userStr);
        } catch (error) {
            console.error('Lỗi khi parse thông tin người dùng:', error);
        }
    }
    
    if (!userData) return;
    
    // Cập nhật thông tin người dùng trong sidebar
    const userNameElement = document.querySelector('.student-info h3');
    const userIdElement = document.querySelector('.student-info p');
    
    if (userNameElement && userData.fullName) {
        userNameElement.textContent = userData.fullName;
    }
    
    if (userIdElement && userData.username) {
        userIdElement.textContent = `ID: ${userData.userId}`;
    }
}

// Module helper cho xác thực và quản lý phiên
const AuthHelper = {
    // Lấy token JWT từ localStorage
    getToken: function() {
        return localStorage.getItem('token') || '';
    },
    
    // Lấy ID người dùng từ localStorage
    getCurrentUserId: function() {
        // Kiểm tra từ key chính của hệ thống: 'user'
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                if (userData && userData.userId) {
                    console.log("Tìm thấy ID người dùng trong localStorage['user']:", userData.userId);
                    return userData.userId;
                }
            } catch (error) {
                console.error("Lỗi khi parse dữ liệu từ localStorage['user']:", error);
            }
        }
        
        // Nếu không tìm thấy trong localStorage['user'], thử tìm trong localStorage['userData'] (dự phòng)
        const studentData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (studentData && studentData.userId) {
            console.log("Tìm thấy ID người dùng trong localStorage['userData']:", studentData.userId);
            return studentData.userId;
        }
        
        // Kiểm tra các key phổ biến khác
        const possibleKeys = ['currentUser', 'userInfo', 'auth'];
        for (const key of possibleKeys) {
            const dataStr = localStorage.getItem(key);
            if (!dataStr) continue;
            
            try {
                const data = JSON.parse(dataStr);
                if (data.userId) return data.userId;
                if (data.user_id) return data.user_id;
                if (data.id) return data.id;
                if (data.user && data.user.id) return data.user.id;
            } catch (e) {
                console.log(`Không thể parse dữ liệu từ key "${key}":`, e);
            }
        }
        
        // Nếu không tìm thấy trong bất kỳ key nào, trả về default cho testing
        console.error('Không tìm thấy ID người dùng trong localStorage');
        console.warn('CẢNH BÁO: Sử dụng ID mặc định 12 chỉ để testing. Cần đăng nhập lại!');
        return 12; // ID mặc định chỉ dùng cho testing
    },
    
    // Gửi API request với authentication headers
    fetchWithAuth: async function(url, options = {}) {
        const userId = this.getCurrentUserId();
        
        // Mặc định là GET nếu không chỉ định
        options.method = options.method || 'GET';
        
        // Đảm bảo có headers
        if (!options.headers) {
            options.headers = {};
        }
        
        // Thêm các headers cần thiết
        options.headers['Authorization'] = `Bearer ${this.getToken()}`;
        options.headers['X-User-Id'] = userId.toString();
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        
        // Log request để debug
        console.group(`Auth API Request: ${options.method} ${url}`);
        console.log('Headers:', options.headers);
        if (options.body) console.log('Body:', options.body);
        
        // Thêm userId vào query string
        // Kiểm tra nếu URL đã có query string
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}userId=${userId}`;
        console.log('Final URL:', url);
        console.groupEnd();
        
        try {
            // Gửi request
            const response = await fetch(url, options);
            
            // Log response để debug
            console.group(`Auth API Response: ${options.method} ${url}`);
            console.log('Status:', response.status);
            console.log('OK:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                console.groupEnd();
                throw new Error(`Lỗi API: ${response.status} ${response.statusText}`);
            }
            
            console.groupEnd();
            return response;
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            throw error;
        }
    },
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    isLoggedIn: function() {
        return !!this.getToken() && !!this.getCurrentUserId();
    },
    
    // Đăng xuất
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        window.location.href = '/main/login.html';
    },
    
    // Lưu thông tin người dùng vào localStorage khi đăng nhập
    saveUserData: function(userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('Đã lưu thông tin người dùng vào localStorage', userData);
    }
};

// Export module
window.AuthHelper = AuthHelper; 