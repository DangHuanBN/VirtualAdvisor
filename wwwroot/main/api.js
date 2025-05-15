// API Endpoints
const API_URL = '/api';

// Helper để gọi API
async function callApi(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        // Thêm credentials để đảm bảo cookie được gửi đi
        credentials: 'include'
    };

    // Thêm token xác thực nếu có
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Thêm dữ liệu nếu có
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        console.log(`Gọi API: ${method} ${API_URL}/${endpoint}`, options);
        const response = await fetch(`${API_URL}/${endpoint}`, options);
        
        // Log thông tin response
        console.log(`Phản hồi từ API ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers])
        });
        
        let result;
        const responseText = await response.text();
        
        // Kiểm tra nếu response có dữ liệu JSON
        try {
            result = responseText ? JSON.parse(responseText) : {};
            console.log(`Dữ liệu phản hồi từ ${endpoint}:`, result);
        } catch (parseError) {
            console.error(`Không thể parse JSON từ ${endpoint}:`, responseText);
            result = { success: false, message: `Lỗi định dạng dữ liệu: ${parseError.message}` };
        }
        
        if (!response.ok) {
            console.error(`API ${endpoint} trả về lỗi:`, result);
            throw new Error(result.message || `Lỗi từ server: ${response.status} ${response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error(`Lỗi khi gọi API ${endpoint}:`, error);
        throw new Error(`Lỗi kết nối: ${error.message}`);
    }
}

// Auth API
const AuthAPI = {
    // Đăng nhập
    login: async (username, password) => {
        try {
            const response = await callApi('auth/login', 'POST', { username, password });
            
            if (response.success) {
                console.log("===== ĐĂNG NHẬP THÀNH CÔNG =====");
                console.log("Response gốc:", response);
                console.log("User từ server:", response.user);
                console.log("Role từ server:", response.user?.role);
                
                // Đảm bảo role được chuẩn hóa trước khi lưu
                if (response.user) {
                    // TẠO BẢN SAO ĐỂ TRÁNH THAM CHIẾU
                    const normalizedUser = JSON.parse(JSON.stringify(response.user));
                    
                    // Xử lý vai trò để đảm bảo đúng định dạng
                    if (normalizedUser.role !== undefined) {
                        // CHÚ Ý: ƯU TIÊN KIỂM TRA ADMIN
                        if (normalizedUser.role === 0 || 
                            (typeof normalizedUser.role === 'string' && normalizedUser.role.toLowerCase() === 'admin')) {
                            normalizedUser.role = 'Admin';
                            console.log("✓ Đã xác định người dùng là ADMIN");
                        }
                        // Các vai trò khác
                        else if (normalizedUser.role === 1 || 
                                (typeof normalizedUser.role === 'string' && normalizedUser.role.toLowerCase() === 'teacher')) {
                            normalizedUser.role = 'Teacher';
                            console.log("✓ Đã xác định người dùng là TEACHER");
                        }
                        else if (normalizedUser.role === 2 || 
                                (typeof normalizedUser.role === 'string' && normalizedUser.role.toLowerCase() === 'student')) {
                            normalizedUser.role = 'Student';
                            console.log("✓ Đã xác định người dùng là STUDENT");
                        }
                        else if (normalizedUser.role === 3 || 
                                (typeof normalizedUser.role === 'string' && normalizedUser.role.toLowerCase() === 'other')) {
                            normalizedUser.role = 'Other';
                            console.log("✓ Đã xác định người dùng là OTHER");
                        }
                        else {
                            console.warn("⚠️ Không xác định được vai trò, mặc định là Student");
                            normalizedUser.role = 'Student';
                        }
                    }
                    
                    console.log("User ĐÃ CHUẨN HÓA:", normalizedUser);
                    console.log("Role ĐÃ CHUẨN HÓA:", normalizedUser.role);
                    
                    // LƯU THÔNG TIN - Đảm bảo localStorage được xóa trước
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // Lưu token và người dùng đã chuẩn hóa vào localStorage
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(normalizedUser));
                    
                    // Kiểm tra lại dữ liệu đã lưu
                    const savedUser = localStorage.getItem('user');
                    console.log("Dữ liệu đã lưu:", savedUser);
                    console.log("Kiểm tra Admin trong dữ liệu:", savedUser.includes('"role":"Admin"'));
                } else {
                    console.warn("⚠️ Không có thông tin người dùng từ server");
                    localStorage.setItem('token', response.token);
                }
            } else {
                console.error("Đăng nhập thất bại:", response.message);
            }
            
            return response;
        } catch (error) {
            console.error("Lỗi nghiêm trọng khi đăng nhập:", error);
            throw error;
        }
    },
    
    // Đăng ký
    register: async (userData) => {
        try {
            console.log("===== BẮT ĐẦU ĐĂNG KÝ =====");
            console.log("Dữ liệu gửi đến server:", userData);
            
            // Gửi request đăng ký đến server
            const response = await callApi('auth/register', 'POST', userData);
            
            console.log("Phản hồi từ server:", response);
            
            if (response.success) {
                console.log("Đăng ký thành công, dữ liệu nhận về:", response);
                
                // Không lưu thông tin vào localStorage sau khi đăng ký
                // Người dùng sẽ cần đăng nhập lại sau khi đăng ký
                console.log("Đăng ký thành công, người dùng cần đăng nhập để tiếp tục");
            } else {
                console.error("Đăng ký thất bại:", response.message);
            }
            
            return response;
        } catch (error) {
            console.error("Lỗi nghiêm trọng khi đăng ký:", error);
            throw error;
        }
    },
    
    // Lấy thông tin người dùng hiện tại
    getCurrentUser: () => {
        try {
            const userJson = localStorage.getItem('user');
            if (!userJson) {
                console.warn("Không tìm thấy thông tin người dùng trong localStorage");
                return null;
            }
            
            const user = JSON.parse(userJson);
            console.log("===== THÔNG TIN NGƯỜI DÙNG =====");
            console.log("User từ localStorage:", user);
            console.log("Vai trò:", user.role);
            console.log("Vai trò là Admin:", user.role === 'Admin');
            console.log("Vai trò kiểu dữ liệu:", typeof user.role);
            
            return user;
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            return null;
        }
    },
    
    // Quên mật khẩu
    forgotPassword: async (email) => {
        return await callApi('auth/forgot-password', 'POST', { email });
    },
    
    // Xác thực OTP
    verifyOtp: async (email, otpCode) => {
        return await callApi('auth/verify-otp', 'POST', { email, otpCode });
    },
    
    // Đặt lại mật khẩu
    resetPassword: async (email, otpCode, newPassword, confirmPassword) => {
        return await callApi('auth/reset-password', 'POST', {
            email,
            otpCode,
            newPassword,
            confirmPassword
        });
    },
    
    // Lấy URL chuyển hướng dựa trên vai trò
    getRedirectUrl: async (role) => {
        return await callApi(`auth/redirect?role=${role}`, 'GET');
    },
    
    // Kiểm tra đăng nhập
    isLoggedIn: () => {
        return localStorage.getItem('token') !== null;
    },
    
    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/main/login.html';
    }
};

// Export API
window.AuthAPI = AuthAPI; 