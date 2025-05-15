/**
 * Dashboard Module
 * Chứa các chức năng xử lý cho trang tổng quan (dashboard)
 */

const DashboardModule = (function() {
    // Các biến private
    let statsData = {};
    let activityData = [];
    
    // Element references
    const selectors = {
        statsCards: '.stats-card',
        activityList: '.activity-list',
        featureCards: '.feature-card'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Dashboard module initialized');
        
        // Tải dữ liệu thống kê
        loadStats();
        
        // Tải hoạt động gần đây
        loadRecentActivities();
        
        // Thiết lập sự kiện cho các thẻ tính năng
        setupFeatureCards();
    }
    
    /**
     * Tải dữ liệu thống kê
     */
    function loadStats() {
        console.log('Loading stats data');
        
        // Trong triển khai thực tế, đây sẽ là một API call
        // Hiện tại, chúng ta sử dụng dữ liệu giả lập đã được thiết lập trong HTML
        
        // Thêm animation cho các thẻ thống kê
        animateStatsNumbers();
    }
    
    /**
     * Tạo hiệu ứng đếm số cho các thẻ thống kê
     */
    function animateStatsNumbers() {
        const statsNumbers = document.querySelectorAll('.stats-number');
        
        statsNumbers.forEach(statElement => {
            const targetValue = parseInt(statElement.textContent.replace(/,/g, ''));
            let startValue = 0;
            const duration = 1500; // Thời gian hiệu ứng (ms)
            const step = Math.ceil(targetValue / (duration / 16)); // 60fps
            
            function updateNumber() {
                startValue += step;
                if (startValue > targetValue) {
                    startValue = targetValue;
                }
                
                // Sử dụng hàm định dạng số từ CommonModule nếu có
                if (window.CommonModule && typeof CommonModule.formatNumber === 'function') {
                    statElement.textContent = CommonModule.formatNumber(startValue);
                } else {
                    statElement.textContent = startValue.toLocaleString();
                }
                
                if (startValue < targetValue) {
                    requestAnimationFrame(updateNumber);
                }
            }
            
            // Bắt đầu hiệu ứng
            updateNumber();
        });
    }
    
    /**
     * Tải dữ liệu hoạt động gần đây
     */
    function loadRecentActivities() {
        console.log('Loading recent activities');
        
        // Trong triển khai thực tế, đây sẽ là một API call
        // Hiện tại, chúng ta sử dụng dữ liệu giả lập đã được thiết lập trong HTML
        
        // Thiết lập sự kiện click cho các mục hoạt động
        setupActivityItems();
    }
    
    /**
     * Thiết lập sự kiện cho các mục hoạt động
     */
    function setupActivityItems() {
        const activityItems = document.querySelectorAll('.activity-item');
        
        activityItems.forEach(item => {
            item.addEventListener('click', function() {
                const title = item.querySelector('h4').textContent;
                const details = item.querySelector('p').textContent;
                
                console.log('Activity clicked:', title);
                
                // Hiển thị thông báo sử dụng CommonModule nếu có
                if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                    CommonModule.showNotification(details, 'info');
                } else {
                    alert(details);
                }
            });
        });
    }
    
    /**
     * Thiết lập sự kiện cho các thẻ tính năng
     */
    function setupFeatureCards() {
        const featureCards = document.querySelectorAll(selectors.featureCards);
        
        featureCards.forEach(card => {
            // Thêm hiệu ứng hover
            card.addEventListener('mouseenter', function() {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', function() {
                card.style.transform = 'translateY(0)';
            });
        });
    }
    
    /**
     * Tạo biểu đồ thống kê (nếu cần)
     * Trong một triển khai thực tế, có thể sử dụng thư viện như Chart.js
     */
    function createCharts() {
        console.log('Creating dashboard charts');
        
        // Đây là nơi để thêm code tạo biểu đồ cho dashboard
        // Ví dụ: biểu đồ người dùng mới theo tháng, biểu đồ hoạt động, v.v.
    }
    
    // API công khai của module
    return {
        init: init
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    DashboardModule.init();
}); 