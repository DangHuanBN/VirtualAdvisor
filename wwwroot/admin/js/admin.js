/**
 * Admin Panel Main JavaScript
 * File JavaScript chính cho Admin Panel
 * 
 * Quản lý việc tải các module cần thiết dựa vào trang hiện tại
 */

document.addEventListener('DOMContentLoaded', function() {
    // Xác định trang hiện tại
    const currentPage = getCurrentPage();
    
    // Khởi tạo các module chung trước
    if (window.CommonModule) {
        CommonModule.init();
    }
    
    // Khởi tạo module tương ứng với trang
    initModuleForPage(currentPage);
    
    // Thiết lập các tab sau khi các module đã được khởi tạo
    setupTabs();
    
    console.log('Admin Panel initialized for page:', currentPage);
});

/**
 * Lấy tên trang hiện tại từ URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    // Lấy tên file từ đường dẫn
    const filename = path.split('/').pop();
    
    if (!filename || filename === '' || filename === 'index.html') {
        return 'dashboard';
    }
    
    return filename.replace('.html', '');
}

/**
 * Khởi tạo module tương ứng với trang
 */
function initModuleForPage(page) {
    switch(page) {
        case 'dashboard':
            if (window.DashboardModule) {
                DashboardModule.init();
            }
            break;
            
        case 'courses':
            // Khởi tạo cả 2 module: Subjects và Courses
            if (window.SubjectsModule) {
                SubjectsModule.init();
            }
            
            if (window.CoursesModule) {
                CoursesModule.init();
            }
            break;
            
        case 'database':
            if (window.DatabaseModule) {
                DatabaseModule.init();
            }
            break;
            
        case 'users':
            if (window.UsersModule) {
                UsersModule.init();
            }
            break;
            
        case 'permissions':
            if (window.PermissionsModule) {
                PermissionsModule.init();
            }
            break;
            
        default:
            console.log('No specific module for page:', page);
    }
}

/**
 * Thiết lập tabs - Di chuyển từ courses.js ra đây để quản lý tập trung
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Xóa active class khỏi tất cả tabs và tab contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Thêm active class cho tab được chọn
                this.classList.add('active');
                
                // Hiển thị tab content tương ứng
                const tabId = this.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
}

/**
 * Xử lý lỗi khi tải module
 */
window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'SCRIPT') {
        console.error('Failed to load script:', e.target.src);
    }
});

/**
 * Toàn cục / Common Module
 */
const CommonModule = (function() {
    
    /**
     * Hiển thị thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo (success, error, warning, info)
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    function showNotification(message, type = 'info', duration = 3000) {
        const notificationId = 'notification-' + Date.now();
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Thêm vào DOM
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Hiệu ứng hiển thị
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Tự động đóng sau một khoảng thời gian
        const timeout = setTimeout(() => {
            closeNotification(notificationId);
        }, duration);
        
        // Xử lý sự kiện đóng thủ công
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                clearTimeout(timeout);
                closeNotification(notificationId);
            });
        }
    }
    
    /**
     * Đóng thông báo
     * @param {string} id - ID của thông báo cần đóng
     */
    function closeNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }
    
    /**
     * Hiển thị loading indicator
     */
    function showLoading() {
        let loadingEl = document.getElementById('global-loading');
        
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'global-loading';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            `;
            document.body.appendChild(loadingEl);
        }
        
        loadingEl.style.display = 'flex';
    }
    
    /**
     * Ẩn loading indicator
     */
    function hideLoading() {
        const loadingEl = document.getElementById('global-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    
    // Thêm CSS vào head
    function addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                min-width: 300px;
                padding: 15px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                opacity: 0;
                transform: translateX(30px);
                transition: all 0.3s ease;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification.success {
                background-color: #d4edda;
                border-left: 4px solid #28a745;
                color: #155724;
            }
            
            .notification.error {
                background-color: #f8d7da;
                border-left: 4px solid #dc3545;
                color: #721c24;
            }
            
            .notification.warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                color: #856404;
            }
            
            .notification.info {
                background-color: #d1ecf1;
                border-left: 4px solid #17a2b8;
                color: #0c5460;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            #global-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255,255,255,0.7);
                z-index: 9999;
                display: none;
                justify-content: center;
                align-items: center;
            }
            
            .loading-spinner {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100px;
                height: 100px;
            }
            
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(styleEl);
    }
    
    // Khởi tạo module
    function init() {
        addStyles();
    }
    
    // Tự động khởi tạo khi trang tải
    document.addEventListener('DOMContentLoaded', init);
    
    // API công khai
    return {
        showNotification: showNotification,
        showLoading: showLoading,
        hideLoading: hideLoading
    };
})();

/**
 * Xử lý các chức năng chung cho trang admin
 */
document.addEventListener('DOMContentLoaded', function() {
    // Xử lý active menu
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.sidebar-nav li a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && currentPath.includes(href)) {
            item.parentElement.classList.add('active');
        }
    });
    
    // Phát hiện người dùng đăng nhập
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            const adminInfoEl = document.querySelector('.admin-info h3');
            if (adminInfoEl && user.fullName) {
                adminInfoEl.textContent = user.fullName;
            }
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }
});
