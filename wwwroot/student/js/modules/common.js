/**
 * Common Module for Student Panel
 * Chứa các chức năng dùng chung cho tất cả các trang trong Student Panel
 */

const CommonModule = (function() {
    // Element references
    const selectors = {
        studentPanel: '.student-panel',
        sidebar: '.sidebar',
        header: 'header',
        footer: 'footer',
        menuToggle: '.menu-toggle'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Common module initialized');
        
        // Kiểm tra trạng thái đăng nhập
        checkAuthStatus();
        
        // Thêm nút toggle menu cho thiết bị di động
        createMobileMenuToggle();
        
        // Xử lý responsive layout
        handleResponsiveLayout();
        
        // Điều chỉnh chiều cao student panel
        adjustContentHeight();
        
        // Lắng nghe sự kiện resize
        window.addEventListener('resize', function() {
            handleResponsiveLayout();
            adjustContentHeight();
        });
    }
    
    /**
     * Kiểm tra trạng thái đăng nhập và xử lý tương ứng
     */
    function checkAuthStatus() {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            // Chưa đăng nhập, chuyển về trang đăng nhập
            if (!window.location.href.includes('/main/login.html')) {
                console.log('Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập');
                window.location.href = '/main/login.html';
            }
            return;
        }
        
        // Đã có token, lấy thông tin người dùng
        const user = getCurrentUser();
        
        // Kiểm tra vai trò người dùng
        if (user && user.role) {
            // Kiểm tra nếu đang ở sai trang dựa trên vai trò
            const currentPath = window.location.pathname;
            
            // Student chỉ được truy cập vào /student/
            if (user.role === 'Student' && !currentPath.includes('/student/') && !currentPath.includes('/main/')) {
                window.location.href = '/student/index.html';
            } 
            // Admin chỉ được truy cập vào /admin/
            else if (user.role === 'Admin' && !currentPath.includes('/admin/') && !currentPath.includes('/main/')) {
                window.location.href = '/admin/index.html';
            }
            // Teacher chỉ được truy cập vào /teacher/
            else if (user.role === 'Teacher' && !currentPath.includes('/teacher/') && !currentPath.includes('/main/')) {
                window.location.href = '/teacher/index.html';
            }
            
            // Hiển thị thông tin người dùng trong sidebar nếu có
            displayUserInfo(user);
        }
    }
    
    /**
     * Lấy thông tin người dùng từ localStorage
     */
    function getCurrentUser() {
        try {
            const userJson = localStorage.getItem('user');
            if (!userJson) {
                return null;
            }
            return JSON.parse(userJson);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            return null;
        }
    }
    
    /**
     * Hiển thị thông tin người dùng trong sidebar
     */
    function displayUserInfo(user) {
        const studentInfo = document.querySelector('.student-info');
        if (studentInfo && user) {
            const nameElement = studentInfo.querySelector('h3');
            const idElement = studentInfo.querySelector('p');
            
            if (nameElement) {
                nameElement.textContent = user.fullName || user.username;
            }
            
            if (idElement) {
                idElement.textContent = user.username ? `ID: ${user.userId}` : '';
            }
        }
    }
    
    /**
     * Đăng xuất người dùng
     */
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/main/login.html';
    }
    
    /**
     * Tạo nút toggle menu cho thiết bị di động
     */
    function createMobileMenuToggle() {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        
        const header = document.querySelector(selectors.header);
        if (header && !document.querySelector(selectors.menuToggle)) {
            header.appendChild(menuToggle);
            
            menuToggle.addEventListener('click', function() {
                const sidebar = document.querySelector(selectors.sidebar);
                if (sidebar) {
                    sidebar.classList.toggle('open');
                }
            });
        }
    }
    
    /**
     * Xử lý responsive layout
     */
    function handleResponsiveLayout() {
        const studentPanel = document.querySelector(selectors.studentPanel);
        const sidebar = document.querySelector(selectors.sidebar);
        const header = document.querySelector(selectors.header);
        
        if (window.innerWidth < 992) {
            if (studentPanel && sidebar) {
                // Thêm lớp mobile cho student panel
                studentPanel.classList.add('mobile');
                // Đóng sidebar mặc định trên mobile
                sidebar.classList.remove('open');
            }
            
            // Thêm nút toggle menu nếu chưa có
            if (!document.querySelector(selectors.menuToggle) && header) {
                createMobileMenuToggle();
            }
        } else {
            if (studentPanel) {
                // Gỡ bỏ lớp mobile trên màn hình lớn
                studentPanel.classList.remove('mobile');
            }
            
            if (sidebar) {
                // Luôn hiển thị sidebar trên màn hình lớn
                sidebar.classList.remove('open');
            }
            
            // Gỡ bỏ nút toggle menu trên màn hình lớn
            const toggle = document.querySelector(selectors.menuToggle);
            if (toggle) {
                toggle.remove();
            }
        }
    }
    
    /**
     * Điều chỉnh chiều cao student panel
     */
    function adjustContentHeight() {
        const header = document.querySelector(selectors.header);
        const footer = document.querySelector(selectors.footer);
        const studentPanel = document.querySelector(selectors.studentPanel);
        
        if (header && footer && studentPanel) {
            const headerHeight = header.offsetHeight;
            const footerHeight = footer.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // Tính toán chiều cao khả dụng cho student panel
            const availableHeight = windowHeight - (headerHeight + footerHeight);
            studentPanel.style.height = `${availableHeight}px`;
        }
    }
    
    /**
     * Format date time
     */
    function formatDateTime(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('vi-VN', options);
    }
    
    /**
     * Hiển thị thông báo
     */
    function showNotification(message, type = 'info', duration = 3000) {
        // Các loại thông báo: info, success, warning, error
        
        // Tạo phần tử thông báo
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon fas ${getIconForType(type)}"></i>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Thêm vào DOM
        document.body.appendChild(notification);
        
        // Hiệu ứng hiển thị
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Tự động đóng sau thời gian chỉ định
        const autoCloseTimeout = setTimeout(() => {
            closeNotification(notification);
        }, duration);
        
        // Xử lý nút đóng
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                clearTimeout(autoCloseTimeout);
                closeNotification(notification);
            });
        }
    }
    
    /**
     * Đóng thông báo với hiệu ứng
     */
    function closeNotification(notification) {
        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * Lấy icon tương ứng với loại thông báo
     */
    function getIconForType(type) {
        switch(type) {
            case 'success':
                return 'fa-check-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'error':
                return 'fa-times-circle';
            case 'info':
            default:
                return 'fa-info-circle';
        }
    }
    
    // Public API
    return {
        init,
        showNotification,
        formatDateTime,
        adjustContentHeight,
        checkAuthStatus,
        getCurrentUser,
        logout
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    CommonModule.init();
    
    // Thiết lập chức năng đăng xuất
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            CommonModule.logout();
        });
    }
}); 