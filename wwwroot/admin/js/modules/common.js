/**
 * Common Module for Admin Panel
 * Chứa các chức năng dùng chung cho tất cả các trang trong Admin Panel
 */

const CommonModule = (function() {
    // Element references
    const selectors = {
        adminPanel: '.admin-panel',
        sidebar: '.sidebar',
        header: 'header',
        footer: 'footer',
        menuToggle: '.menu-toggle',
        adminName: '.admin-info h3',
        logoutBtn: '.logout-btn'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Common module initialized');
        
        // Thêm nút toggle menu cho thiết bị di động
        createMobileMenuToggle();
        
        // Xử lý responsive layout
        handleResponsiveLayout();
        
        // Điều chỉnh chiều cao admin panel
        adjustContentHeight();
        
        // Hiển thị tên người dùng
        displayUserInfo();
        
        // Xử lý sự kiện đăng xuất
        setupLogout();
        
        // Lắng nghe sự kiện resize
        window.addEventListener('resize', function() {
            handleResponsiveLayout();
            adjustContentHeight();
        });
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
        const adminPanel = document.querySelector(selectors.adminPanel);
        const sidebar = document.querySelector(selectors.sidebar);
        const header = document.querySelector(selectors.header);
        
        if (window.innerWidth < 992) {
            if (adminPanel && sidebar) {
                // Thêm lớp mobile cho admin panel
                adminPanel.classList.add('mobile');
                // Đóng sidebar mặc định trên mobile
                sidebar.classList.remove('open');
            }
            
            // Thêm nút toggle menu nếu chưa có
            if (!document.querySelector(selectors.menuToggle) && header) {
                createMobileMenuToggle();
            }
        } else {
            if (adminPanel) {
                // Gỡ bỏ lớp mobile trên màn hình lớn
                adminPanel.classList.remove('mobile');
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
     * Điều chỉnh chiều cao admin panel
     */
    function adjustContentHeight() {
        const header = document.querySelector(selectors.header);
        const footer = document.querySelector(selectors.footer);
        const adminPanel = document.querySelector(selectors.adminPanel);
        
        if (header && footer && adminPanel) {
            const headerHeight = header.offsetHeight;
            const footerHeight = footer.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // Tính toán chiều cao khả dụng cho admin panel
            const availableHeight = windowHeight - (headerHeight + footerHeight);
            adminPanel.style.height = `${availableHeight}px`;
        }
    }
    
    /**
     * Hiển thị thông báo
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
    
    /**
     * Format date theo định dạng Việt Nam
     * @param {string|Date} date - Ngày cần format
     * @returns {string} Ngày đã được format (dd/mm/yyyy)
     */
    function formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
    
    /**
     * Format số
     */
    function formatNumber(number, decimals = 0) {
        return Number(number).toLocaleString('vi-VN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Hiển thị thông tin người dùng đã đăng nhập
     */
    function displayUserInfo() {
        const adminNameElement = document.querySelector(selectors.adminName);
        if (adminNameElement) {
            const user = getCurrentUser();
            if (user && user.fullName) {
                adminNameElement.textContent = user.fullName;
            }
        }
    }
    
    /**
     * Lấy thông tin người dùng đã đăng nhập từ localStorage
     */
    function getCurrentUser() {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) {
                // Nếu không có token, chuyển hướng về trang đăng nhập
                redirectToLogin();
                return null;
            }
            
            const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (userInfo) {
                return JSON.parse(userInfo);
            }
            
            return null;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            return null;
        }
    }
    
    /**
     * Chuyển hướng đến trang đăng nhập
     */
    function redirectToLogin() {
        window.location.href = '/main/login.html';
    }
    
    /**
     * Thiết lập sự kiện đăng xuất
     */
    function setupLogout() {
        const logoutBtn = document.querySelector(selectors.logoutBtn);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    }
    
    /**
     * Xử lý đăng xuất
     */
    function logout() {
        // Xóa token và thông tin người dùng
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('userInfo');
        
        // Hiển thị thông báo
        showNotification('Đăng xuất thành công', 'success');
        
        // Chuyển hướng đến trang đăng nhập sau 1 giây
        setTimeout(() => {
            redirectToLogin();
        }, 1000);
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
    
    // API công khai của module
    return {
        init: init,
        showNotification: showNotification,
        showLoading: showLoading,
        hideLoading: hideLoading,
        formatDate: formatDate,
        formatNumber: formatNumber,
        getCurrentUser: getCurrentUser,
        logout: logout,
        addStyles: addStyles
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    CommonModule.init();
}); 