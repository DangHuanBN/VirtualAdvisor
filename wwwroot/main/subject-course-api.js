// API Endpoints
const API_URL = '/api';

// Helper để gọi API
async function callApi(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
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
        console.log(`Gọi API: ${method} ${API_URL}/${endpoint}`);
        const response = await fetch(`${API_URL}/${endpoint}`, options);
        
        let result;
        const responseText = await response.text();
        
        // Kiểm tra nếu response có dữ liệu JSON
        try {
            result = responseText ? JSON.parse(responseText) : {};
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

// SubjectCourse API
const SubjectCourseAPI = {
    // Lấy danh sách môn học và khóa học phổ biến
    getPopularSubjectsWithCourses: async (limit = 5) => {
        try {
            return await callApi(`SubjectCourses?limit=${limit}`, 'GET');
        } catch (error) {
            console.error("Lỗi khi lấy danh sách môn học và khóa học:", error);
            throw error;
        }
    }
};

// Export API
window.SubjectCourseAPI = SubjectCourseAPI; 