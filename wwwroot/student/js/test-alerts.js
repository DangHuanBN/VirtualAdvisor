/**
 * Module xử lý cảnh báo học tập sau khi sinh viên làm bài kiểm tra hoặc bài thi
 */

/**
 * Gửi yêu cầu tạo cảnh báo học tập
 * @param {number} userId - ID của sinh viên
 * @param {number} lectureId - ID của bài kiểm tra hoặc bài thi
 * @param {number} progress - Tiến độ học tập (0-100)
 * @param {object} answers - Câu trả lời của sinh viên, dạng {"0": "A", "1": "B", ...}
 * @returns {Promise<object>} - Kết quả từ API
 */
async function generateTestAlerts(userId, lectureId, progress, answers) {
    try {
        const response = await fetch('/api/quiz/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                lectureId,
                progress,
                answers
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi gửi yêu cầu tạo cảnh báo:', error);
        return { success: false, message: 'Lỗi kết nối đến server' };
    }
}

/**
 * Hiển thị thông báo cảnh báo học tập
 * @param {number} userId - ID của sinh viên
 */
async function showLatestTestAlert(userId) {
    try {
        const response = await fetch(`/api/notifications/latest/${userId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const notification = data.data;
            
            // Hiển thị thông báo trên giao diện
            const alertElement = document.createElement('div');
            alertElement.className = 'test-alert';
            alertElement.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <strong>Thông báo học tập</strong>
                    <p>${notification.content}</p>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            // Thêm vào trang
            const alertContainer = document.getElementById('alertContainer') || document.body;
            alertContainer.prepend(alertElement);
            
            // Tự động đóng sau 10 giây
            setTimeout(() => {
                const alert = new bootstrap.Alert(alertElement.querySelector('.alert'));
                alert.close();
            }, 10000);
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
    }
}

/**
 * Đăng ký sự kiện khi trang web được tải
 */
document.addEventListener('DOMContentLoaded', () => {
    // Tạo container cho thông báo nếu chưa có
    if (!document.getElementById('alertContainer')) {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'alert-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
    }
    
    // Hiển thị thông báo nếu người dùng đã đăng nhập
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.userId) {
        showLatestTestAlert(currentUser.userId);
    }
});

/**
 * Lấy thông tin người dùng hiện tại từ localStorage hoặc cookie
 * @returns {object|null} Thông tin người dùng
 */
function getCurrentUser() {
    // Lấy từ localStorage (tùy vào cách ứng dụng lưu trữ)
    const userString = localStorage.getItem('currentUser');
    if (userString) {
        try {
            return JSON.parse(userString);
        } catch (e) {
            console.error('Lỗi khi đọc thông tin người dùng:', e);
        }
    }
    return null;
} 