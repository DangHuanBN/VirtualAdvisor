/**
 * Module chứa các chức năng dùng chung cho tất cả các phần trong khu vực giáo viên
 */

const CommonModule = (function() {
    /**
     * Hiển thị/ẩn trạng thái loading
     * @param {HTMLElement} container - Phần tử chứa nội dung cần hiển thị/ẩn loading
     * @param {boolean} isLoading - true nếu hiển thị loading, false nếu ẩn
     */
    function toggleLoading(container, isLoading) {
        if (!container) return;
        
        // Kiểm tra xem loading placeholder đã tồn tại chưa
        let loadingEl = container.querySelector('.loading-placeholder');
        
        if (isLoading) {
            if (!loadingEl) {
                // Tạo loading placeholder nếu chưa tồn tại
                loadingEl = document.createElement('div');
                loadingEl.className = 'loading-placeholder';
                loadingEl.innerHTML = `
                    <div class="loading-spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                `;
                container.appendChild(loadingEl);
            } else {
                // Hiển thị loading placeholder nếu đã tồn tại
                loadingEl.style.display = 'flex';
            }
        } else if (loadingEl) {
            // Ẩn loading placeholder
            loadingEl.style.display = 'none';
        }
    }
    
    /**
     * Format datetime thành chuỗi dễ đọc
     * @param {Date} date - Đối tượng Date cần format
     * @return {string} Chuỗi datetime đã format
     */
    function formatDateTime(date) {
        if (!date) return '';
        
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        // Format: DD/MM/YYYY HH:MM
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    /**
     * Format một số thành chuỗi có định dạng số
     * @param {number} number - Số cần format
     * @return {string} Chuỗi số đã format
     */
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    /**
     * Hiển thị thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        if (typeof TeacherApp !== 'undefined' && TeacherApp.showNotification) {
            TeacherApp.showNotification(message, type);
        } else {
            // Fallback khi TeacherApp không có sẵn
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    /**
     * Đánh dấu đã đọc cho một thông báo
     * @param {string} notificationId - ID của thông báo
     */
    function markNotificationAsRead(notificationId) {
        console.log(`Đánh dấu đã đọc cho thông báo ID: ${notificationId}`);
        // Trong môi trường thực tế, gửi yêu cầu API để đánh dấu đã đọc
    }
    
    /**
     * Xác nhận từ người dùng trước khi thực hiện hành động
     * @param {string} message - Thông báo xác nhận
     * @param {Function} callback - Hàm callback khi người dùng xác nhận
     */
    function confirmAction(message, callback) {
        if (confirm(message) && typeof callback === 'function') {
            callback();
        }
    }
    
    /**
     * Tạo URL có tham số tìm kiếm
     * @param {string} baseUrl - URL cơ sở
     * @param {Object} params - Các tham số tìm kiếm
     * @return {string} URL đầy đủ
     */
    function buildUrl(baseUrl, params) {
        const url = new URL(baseUrl, window.location.origin);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.append(key, value);
            }
        });
        
        return url.toString();
    }
    
    // API công khai
    return {
        toggleLoading: toggleLoading,
        formatDateTime: formatDateTime,
        formatNumber: formatNumber,
        showNotification: showNotification,
        markNotificationAsRead: markNotificationAsRead,
        confirmAction: confirmAction,
        buildUrl: buildUrl
    };
})();
