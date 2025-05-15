// Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Đóng mở sidebar
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
            document.querySelector('.student-panel').classList.toggle('sidebar-collapsed');
            
            // Thay đổi icon khi đóng/mở
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Cập nhật thời gian
    function updateDateTime() {
        const currentDateTimeEl = document.getElementById('currentDateTime');
        if (currentDateTimeEl) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            currentDateTimeEl.textContent = now.toLocaleDateString('vi-VN', options);
        }
    }
    
    // Nếu phần tử hiển thị ngày giờ tồn tại, cập nhật nó
    if (document.getElementById('currentDateTime')) {
        updateDateTime();
        setInterval(updateDateTime, 60000); // Cập nhật mỗi phút
    }
}); 