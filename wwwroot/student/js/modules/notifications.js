// Khởi tạo biến global
let currentUser = null;
const API_URL = '/api';
const READ_NOTIFICATIONS_KEY = 'read_notifications'; // Key để lưu danh sách thông báo đã đọc trong localStorage

// Lấy thông tin người dùng đã đăng nhập
const getCurrentUser = () => {
    try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
            console.warn("Không tìm thấy thông tin người dùng trong localStorage");
            return null;
        }
        
        return JSON.parse(userJson);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        return null;
    }
};

// Lấy token xác thực
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Lấy danh sách thông báo đã đọc từ localStorage
const getReadNotifications = () => {
    try {
        const readNotificationsJson = localStorage.getItem(READ_NOTIFICATIONS_KEY);
        if (!readNotificationsJson) {
            return [];
        }
        
        return JSON.parse(readNotificationsJson);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thông báo đã đọc:", error);
        return [];
    }
};

// Lưu danh sách thông báo đã đọc vào localStorage
const saveReadNotifications = (readNotifications) => {
    try {
        localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotifications));
    } catch (error) {
        console.error("Lỗi khi lưu danh sách thông báo đã đọc:", error);
    }
};

// Kiểm tra thông báo đã đọc chưa
const isNotificationRead = (notificationId) => {
    const readNotifications = getReadNotifications();
    return readNotifications.includes(notificationId);
};

// Đánh dấu thông báo đã đọc
const markNotificationAsRead = (notificationId) => {
    const readNotifications = getReadNotifications();
    if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        saveReadNotifications(readNotifications);
    }
};

// Đánh dấu tất cả thông báo đã đọc
const markAllNotificationsAsRead = (notificationIds) => {
    const readNotifications = getReadNotifications();
    let updated = false;
    
    notificationIds.forEach(id => {
        if (!readNotifications.includes(id)) {
            readNotifications.push(id);
            updated = true;
        }
    });
    
    if (updated) {
        saveReadNotifications(readNotifications);
    }
    
    return updated;
};

// Khởi tạo khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo
    init();
    
    // Lọc theo loại thông báo
    document.getElementById('typeFilter').addEventListener('change', function(e) {
        const type = e.target.value;
        filterNotifications(type);
    });

    // Đánh dấu tất cả đã đọc
    document.querySelector('.mark-all-read').addEventListener('click', function() {
        markAllAsRead();
    });
});

/**
 * Khởi tạo module
 */
async function init() {
    console.log('Module thông báo đã được khởi tạo');
    
    // Lấy thông tin người dùng
    currentUser = getCurrentUser();
    if (currentUser) {
        console.log('Người dùng đã đăng nhập:', currentUser.fullName);
        console.log('ID người dùng:', currentUser.userId);
        
        // Hiển thị thông tin sinh viên
        const studentNameElement = document.querySelector('.student-info h3');
        const studentIdElement = document.querySelector('.student-info p');
        
        if (studentNameElement && studentIdElement) {
            studentNameElement.textContent = currentUser.fullName;
            studentIdElement.textContent = `ID: ${currentUser.userId}`;
        }
        
        // Tải danh sách thông báo
        await loadNotifications();
    } else {
        console.warn('Người dùng chưa đăng nhập!');
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/login';
    }
}

/**
 * Tải danh sách thông báo từ API
 */
async function loadNotifications() {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (currentUser) {
            headers['X-User-Id'] = currentUser.userId.toString();
        }
        
        // Gọi API lấy thông báo
        const response = await fetch(`${API_URL}/notification`, {
            method: 'GET',
            headers: headers
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Lỗi khi tải thông báo:', result.message);
            return;
        }

        // Cập nhật trạng thái đã đọc từ localStorage
        const readNotifications = getReadNotifications();
        result.data.forEach(notification => {
            notification.isRead = readNotifications.includes(notification.notificationId);
        });
        
        // Hiển thị thông báo
        displayNotifications(result.data);
    } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
    }
}

/**
 * Hiển thị danh sách thông báo
 */
function displayNotifications(notifications) {
    // Xóa nội dung cũ
    const todayContainer = document.querySelector('.notification-group:nth-child(1) .notification-list');
    const earlierContainer = document.querySelector('.notification-group:nth-child(2) .notification-list');
    
    todayContainer.innerHTML = '';
    earlierContainer.innerHTML = '';
    
    // Kiểm tra nếu không có thông báo
    if (!notifications || notifications.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-notifications';
        emptyMessage.innerHTML = `
            <i class="fas fa-bell-slash"></i>
            <p>Không có thông báo nào</p>
        `;
        todayContainer.appendChild(emptyMessage);
        return;
    }
    
    // Nhóm thông báo theo ngày
    const today = new Date().toLocaleDateString('vi-VN');
    const todayNotifications = notifications.filter(n => new Date(n.timestamp).toLocaleDateString('vi-VN') === today);
    const earlierNotifications = notifications.filter(n => new Date(n.timestamp).toLocaleDateString('vi-VN') !== today);
    
    // Hiển thị thông báo hôm nay
    if (todayNotifications.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-notifications';
        emptyMessage.innerHTML = `
            <p>Không có thông báo hôm nay</p>
        `;
        todayContainer.appendChild(emptyMessage);
    } else {
        todayNotifications.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            todayContainer.appendChild(notificationElement);
        });
    }
    
    // Hiển thị thông báo trước đó
    if (earlierNotifications.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-notifications';
        emptyMessage.innerHTML = `
            <p>Không có thông báo trước đó</p>
        `;
        earlierContainer.appendChild(emptyMessage);
    } else {
        earlierNotifications.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            earlierContainer.appendChild(notificationElement);
        });
    }
}

/**
 * Tạo phần tử HTML cho thông báo
 */
function createNotificationElement(notification) {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
    notificationItem.dataset.id = notification.notificationId;
    notificationItem.dataset.type = notification.type;
    
    // Xác định icon dựa trên loại thông báo
    let iconClass = '';
    switch (notification.type) {
        case 'course':
            iconClass = 'fas fa-book';
            break;
        case 'assignment':
            iconClass = 'fas fa-tasks';
            break;
        case 'exam':
            iconClass = 'fas fa-file-alt';
            break;
        case 'evaluation':
            iconClass = 'fas fa-comment';
            break;
        default:
            iconClass = 'fas fa-bell';
    }
    
    // Tạo HTML cho thông báo
    notificationItem.innerHTML = `
        <div class="notification-icon ${notification.type}">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <h4>${getNotificationTitle(notification)}</h4>
                <span class="time">${notification.formattedDate}</span>
            </div>
            <p>${notification.content}</p>
            <div class="notification-actions">
                ${!notification.isRead ? `<button class="mark-read" data-id="${notification.notificationId}"><i class="fas fa-check"></i></button>` : ''}
            </div>
        </div>
    `;
    
    // Thêm sự kiện click cho nút đánh dấu đã đọc
    const markReadBtn = notificationItem.querySelector('.mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', function() {
            markAsRead(notification.notificationId);
        });
    }
    
    return notificationItem;
}

/**
 * Lấy tiêu đề thông báo dựa trên loại
 */
function getNotificationTitle(notification) {
    switch (notification.type) {
        case 'course':
            return 'Khóa học';
        case 'assignment':
            return 'Bài tập';
        case 'exam':
            return 'Kiểm tra';
        case 'evaluation':
            return 'Đánh giá từ giảng viên';
        default:
            return 'Thông báo hệ thống';
    }
}

/**
 * Lọc thông báo theo loại
 */
function filterNotifications(type) {
    const notifications = document.querySelectorAll('.notification-item');
    
    notifications.forEach(notification => {
        if (type === 'all' || notification.dataset.type === type) {
            notification.style.display = '';
        } else {
            notification.style.display = 'none';
        }
    });
}

/**
 * Đánh dấu thông báo đã đọc
 */
async function markAsRead(notificationId) {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (currentUser) {
            headers['X-User-Id'] = currentUser.userId.toString();
        }
        
        // Gọi API đánh dấu đã đọc
        const response = await fetch(`${API_URL}/notification/mark-read/${notificationId}`, {
            method: 'POST',
            headers: headers
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Lỗi khi đánh dấu đã đọc:', result.message);
            return;
        }
        
        // Đánh dấu đã đọc trong localStorage
        markNotificationAsRead(notificationId);
        
        // Cập nhật UI
        const notification = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notification) {
            notification.classList.remove('unread');
            const markReadBtn = notification.querySelector('.mark-read');
            if (markReadBtn) markReadBtn.remove();
        }
    } catch (error) {
        console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
}

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
async function markAllAsRead() {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (currentUser) {
            headers['X-User-Id'] = currentUser.userId.toString();
        }
        
        // Gọi API đánh dấu tất cả đã đọc
        const response = await fetch(`${API_URL}/notification/mark-all-read`, {
            method: 'POST',
            headers: headers
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Lỗi khi đánh dấu tất cả đã đọc:', result.message);
            return;
        }
        
        // Lấy tất cả ID thông báo chưa đọc
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        const unreadIds = Array.from(unreadNotifications).map(item => 
            parseInt(item.dataset.id)
        );
        
        // Đánh dấu tất cả đã đọc trong localStorage
        markAllNotificationsAsRead(unreadIds);
        
        // Cập nhật UI
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
            const markReadBtn = notification.querySelector('.mark-read');
            if (markReadBtn) markReadBtn.remove();
        });
    } catch (error) {
        console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
} 