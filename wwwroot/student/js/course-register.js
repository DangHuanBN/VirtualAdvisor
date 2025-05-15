// Quản lý đăng ký khóa học

document.addEventListener('DOMContentLoaded', function() {
    // Lấy nút đăng ký khóa học và thiết lập sự kiện click
    const registerTab = document.querySelector('.register-tab');
    if (registerTab) {
        registerTab.addEventListener('click', loadAvailableCourses);
    }
    
    // Nếu có nút đăng ký trong danh sách khóa học
    setupRegisterButtons();
    
    // Kiểm tra kết nối API khi trang được tải
    checkApiConnection();
    
    // Debug - kiểm tra thông tin người dùng
    debugUserInfo();
});

// Kiểm tra thông tin người dùng trong localStorage
function debugUserInfo() {
    console.log('DEBUG - Toàn bộ localStorage:', {...localStorage});
    console.log('currentUser:', localStorage.getItem('currentUser'));
    console.log('user:', localStorage.getItem('user'));
    console.log('userData:', localStorage.getItem('userData'));
    console.log('userInfo:', localStorage.getItem('userInfo'));
    console.log('auth:', localStorage.getItem('auth'));
    console.log('token:', localStorage.getItem('token'));
}

// Lấy ID của người dùng từ localStorage
function getCurrentUserId() {
    // Kiểm tra các key phổ biến
    const possibleKeys = ['currentUser', 'user', 'userData', 'userInfo', 'auth'];
    let userId = null;
    
    // Thử từng key để tìm thông tin người dùng
    for (const key of possibleKeys) {
        const userStr = localStorage.getItem(key);
        if (!userStr) continue;
        
        try {
            const userData = JSON.parse(userStr);
            
            // Kiểm tra các trường có thể chứa userId
            if (userData.userId) {
                console.log(`Tìm thấy userId trong key "${key}": ${userData.userId}`);
                return userData.userId;
            } else if (userData.user_id) {
                console.log(`Tìm thấy user_id trong key "${key}": ${userData.user_id}`);
                return userData.user_id;
            } else if (userData.id) {
                console.log(`Tìm thấy id trong key "${key}": ${userData.id}`);
                return userData.id;
            } else if (userData.user && userData.user.id) {
                console.log(`Tìm thấy user.id trong key "${key}": ${userData.user.id}`);
                return userData.user.id;
            }
        } catch (error) {
            console.log(`Không thể parse dữ liệu từ key "${key}":`, error);
            continue;
        }
    }
    
    // Nếu không tìm thấy, chuyển hướng đến trang đăng nhập
    console.error('Không tìm thấy ID người dùng trong localStorage.');
    window.location.href = '/main/login.html';
    throw new Error('Vui lòng đăng nhập để tiếp tục');
}

// Lấy danh sách các khóa học chưa đăng ký
async function loadAvailableCourses() {
    const userId = getCurrentUserId();
    
    try {
        console.log('Đang tải danh sách khóa học với userId:', userId);
        
        // Hiển thị loading state
        const availableCoursesContainer = document.getElementById('available-courses');
        if (availableCoursesContainer) {
            const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
            if (coursesGrid) {
                coursesGrid.innerHTML = '<div class="loading-courses">Đang tải danh sách khóa học...</div>';
            }
        }
        
        // Kiểm tra kết nối API trước
        const isApiConnected = await checkApiConnection();
        if (!isApiConnected) {
            console.error('API không hoạt động, không thể tải danh sách khóa học');
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            
            // Hiển thị thông báo lỗi trong UI
            if (availableCoursesContainer) {
                const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
                if (coursesGrid) {
                    coursesGrid.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Không thể kết nối đến máy chủ. Vui lòng thử lại sau.</p>
                            <button class="retry-btn" onclick="checkApiConnection().then(connected => { if(connected) loadAvailableCourses(); })">Thử lại</button>
                        </div>
                    `;
                }
            }
            return;
        }
        
        // Gọi API lấy danh sách khóa học
        const response = await fetch(`/api/coursestudent/available/${userId}`);
        console.log('API Response status:', response.status);
        
        // Nếu API trả về lỗi
        if (!response.ok) {
            console.error(`Lỗi API: ${response.status} - ${response.statusText}`);
            
            // Thử đọc thông báo lỗi từ phản hồi
            let errorDetail = '';
            try {
                const errorText = await response.text();
                console.error('Chi tiết lỗi:', errorText);
                
                if (errorText && errorText.trim() !== '') {
                    try {
                        const errorData = JSON.parse(errorText);
                        errorDetail = errorData.message || errorData.title || JSON.stringify(errorData);
                    } catch (parseErr) {
                        errorDetail = errorText;
                    }
                }
            } catch (readErr) {
                errorDetail = response.statusText;
            }
            
            showError(`Không thể kết nối đến máy chủ (${response.status}): ${errorDetail}. Vui lòng thử lại sau.`);
            
            // Hiển thị thông báo lỗi trong UI
            const availableCoursesContainer = document.getElementById('available-courses');
            if (availableCoursesContainer) {
                const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
                if (coursesGrid) {
                    coursesGrid.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Không thể kết nối đến máy chủ. Vui lòng thử lại sau.</p>
                            <button class="retry-btn" onclick="loadAvailableCourses()">Thử lại</button>
                        </div>
                    `;
                }
            }
            return;
        }
        
        // Đảm bảo response là JSON hợp lệ
        let result;
        try {
            const text = await response.text();
            console.log('API response text:', text);
            
            if (!text || text.trim() === '') {
                throw new Error('API trả về kết quả trống');
            }
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Lỗi khi parse JSON:', parseError);
            showError('Dữ liệu không hợp lệ. Vui lòng thử lại sau.');
            
            // Hiển thị thông báo lỗi trong UI
            const availableCoursesContainer = document.getElementById('available-courses');
            if (availableCoursesContainer) {
                const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
                if (coursesGrid) {
                    coursesGrid.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Dữ liệu không hợp lệ. Vui lòng thử lại sau.</p>
                            <button class="retry-btn" onclick="loadAvailableCourses()">Thử lại</button>
                        </div>
                    `;
                }
            }
            return;
        }
        
        if (!result.success) {
            showError(result.message || 'Không thể tải danh sách khóa học khả dụng');
            return;
        }
        
        // Hiển thị danh sách khóa học khả dụng
        displayAvailableCourses(result.data);
    } catch (error) {
        console.error('Lỗi khi tải khóa học khả dụng:', error);
        showError('Đã xảy ra lỗi khi tải danh sách khóa học khả dụng. Vui lòng thử lại sau.');
        
        // Hiển thị thông báo lỗi trong UI
        const availableCoursesContainer = document.getElementById('available-courses');
        if (availableCoursesContainer) {
            const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
            if (coursesGrid) {
                coursesGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Không thể tải danh sách khóa học. Vui lòng thử lại sau.</p>
                        <button class="retry-btn" onclick="loadAvailableCourses()">Thử lại</button>
                    </div>
                `;
            }
        }
    }
}

// Hiển thị danh sách khóa học khả dụng
function displayAvailableCourses(courses) {
    const availableCoursesContainer = document.getElementById('available-courses');
    if (!availableCoursesContainer) return;
    
    const coursesGrid = availableCoursesContainer.querySelector('.courses-grid');
    if (!coursesGrid) return;
    
    // Xóa nội dung hiện tại
    coursesGrid.innerHTML = '';
    
    if (!courses || courses.length === 0) {
        coursesGrid.innerHTML = '<div class="no-courses">Không có khóa học khả dụng để đăng ký</div>';
        return;
    }
    
    // Tạo HTML cho mỗi khóa học
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        courseCard.dataset.courseId = course.courseId;
        
        // Tạo màu nền cố định dựa trên ID khóa học
        const backgroundColor = getColorForCourse(course.courseId);
        
        courseCard.innerHTML = `
            <div class="course-image">
                <div class="course-image-placeholder" style="background-color: ${backgroundColor}">
                    <span>${course.courseName.charAt(0).toUpperCase()}</span>
                </div>
            </div>
            <div class="course-content">
                <h3>${course.courseName}</h3>
                <p class="subject">${course.subjectName}</p>
                <div class="course-meta">
                    <span><i class="fas fa-users"></i> ${course.studentCount || 0} sinh viên</span>
                    <span><i class="fas fa-book-open"></i> ${course.lectureCount || 0} bài học</span>
                </div>
                <div class="course-status not-started">
                    <i class="fas fa-info-circle"></i> Khả dụng
                </div>
                <button class="register-btn" data-course-id="${course.courseId}">Đăng ký ngay</button>
            </div>
        `;
        
        coursesGrid.appendChild(courseCard);
    });
    
    // Thiết lập lại các nút đăng ký
    setupRegisterButtons();
}

// Tạo màu nền cố định cho khóa học dựa trên ID
function getColorForCourse(courseId) {
    const colors = [
        '#3498db', // xanh dương
        '#2ecc71', // xanh lá
        '#e74c3c', // đỏ
        '#f39c12', // cam
        '#9b59b6', // tím
        '#1abc9c', // xanh ngọc
        '#34495e', // xanh đen
        '#e67e22'  // cam đất
    ];
    
    // Dùng modulo để đảm bảo luôn có màu trong phạm vi mảng
    return colors[courseId % colors.length];
}

// Thiết lập sự kiện click cho các nút đăng ký
function setupRegisterButtons() {
    document.querySelectorAll('.register-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const courseId = this.getAttribute('data-course-id');
            const courseName = this.closest('.course-card').querySelector('h3').textContent;
            
            if (confirm(`Bạn có chắc chắn muốn đăng ký khóa học: ${courseName}?`)) {
                await registerCourse(courseId);
            }
        });
    });
    
    // Thiết lập lại các nút đăng ký trong modal (nếu có)
    document.querySelectorAll('.register-course-item').forEach(button => {
        button.addEventListener('click', async function() {
            const courseItem = this.closest('.course-item');
            const courseName = courseItem.querySelector('h4').textContent;
            const courseId = courseItem.getAttribute('data-course-id');
            
            if (confirm(`Bạn có chắc chắn muốn đăng ký khóa học: ${courseName}?`)) {
                await registerCourse(courseId);
                
                // Đóng modal nếu có
                const modal = document.getElementById('registerCourseModal');
                if (modal) {
                    modal.classList.remove('active');
                }
            }
        });
    });
}

// Đăng ký khóa học
async function registerCourse(courseId) {
    const userId = getCurrentUserId();
    if (!userId) {
        showError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
    }
    
    try {
        // Kiểm tra dữ liệu trước khi gửi
        if (!courseId) {
            showError('Mã khóa học không hợp lệ');
            return;
        }
        
        const parsedCourseId = parseInt(courseId);
        if (isNaN(parsedCourseId)) {
            showError('Mã khóa học phải là số');
            return;
        }
        
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) {
            showError('ID người dùng phải là số');
            return;
        }
        
        // Kiểm tra kết nối API trước
        const isApiConnected = await checkApiConnection();
        if (!isApiConnected) {
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            return;
        }
        
        // Log dữ liệu gửi đi để debug
        const requestData = {
            userId: parsedUserId, // Đảm bảo là số nguyên
            courseId: parsedCourseId // Đảm bảo là số nguyên
        };
        console.log('Đăng ký khóa học - Dữ liệu gửi đi:', JSON.stringify(requestData));
        
        // Hiển thị trạng thái đang đăng ký
        showMessage('Đang đăng ký khóa học...', 'info');
        
        // Sử dụng fetch API với các options đầy đủ
        const response = await fetch('/api/coursestudent/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData),
            credentials: 'include' // Gửi kèm cookie nếu có
        });
        
        console.log('API Response status:', response.status);
        
        // Xử lý lỗi HTTP
        if (!response.ok) {
            // Cố gắng lấy thông báo lỗi từ API (nếu có)
            let errorDetail = '';
            try {
                const errorText = await response.text();
                console.error('Chi tiết lỗi từ API:', errorText);
                
                if (errorText && errorText.trim() !== '') {
                    const errorResponse = JSON.parse(errorText);
                    
                    if (errorResponse.errors) {
                        // Xử lý lỗi validation từ ASP.NET Core
                        const errorMessages = [];
                        for (const key in errorResponse.errors) {
                            errorMessages.push(`${key}: ${errorResponse.errors[key].join(', ')}`);
                        }
                        errorDetail = errorMessages.join('; ');
                    } else if (errorResponse.message) {
                        errorDetail = errorResponse.message;
                    } else if (errorResponse.title) {
                        errorDetail = errorResponse.title;
                    } else {
                        errorDetail = JSON.stringify(errorResponse);
                    }
                } else {
                    errorDetail = `HTTP ${response.status}: ${response.statusText}`;
                }
            } catch (parseError) {
                // Nếu không parse được JSON, sử dụng thông báo mặc định
                console.error('Không thể đọc chi tiết lỗi:', parseError);
                errorDetail = response.statusText;
            }
            
            const errorMessage = `Lỗi khi đăng ký khóa học: ${errorDetail}`;
            console.error(`Lỗi API (${response.status}): ${errorMessage}`);
            showError(errorMessage);
            return;
        }
        
        // Đảm bảo response là JSON hợp lệ
        let result;
        try {
            const text = await response.text();
            console.log('API response text:', text);
            
            if (!text || text.trim() === '') {
                throw new Error('API trả về kết quả trống');
            }
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Lỗi khi parse JSON:', parseError);
            showError('Dữ liệu không hợp lệ. Vui lòng thử lại sau.');
            return;
        }
        
        if (!result.success) {
            showError(result.message || 'Không thể đăng ký khóa học');
            return;
        }
        
        showSuccess('Đăng ký khóa học thành công!');
        
        // Reload danh sách khóa học khả dụng
        loadAvailableCourses();
        
        // Chuyển sang tab "Đang học" sau khi đăng ký thành công
        const currentTab = document.querySelector('[data-tab="current"]');
        if (currentTab) {
            currentTab.click();
        }
    } catch (error) {
        console.error('Lỗi khi đăng ký khóa học:', error);
        showError(`Đã xảy ra lỗi khi đăng ký khóa học: ${error.message}`);
    }
}

// Hủy đăng ký khóa học
async function unregisterCourse(courseId) {
    const userId = getCurrentUserId();
    
    try {
        console.log('Đang hủy đăng ký khóa học:', courseId, 'cho người dùng:', userId);
        
        // Gọi API để hủy đăng ký khóa học
        const response = await fetch('/api/coursestudent/unregister', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                courseId: parseInt(courseId)
            })
        });
        
        // Nếu API trả về lỗi
        if (!response.ok) {
            // Xử lý an toàn khi parse JSON
            let errorMessage = `Lỗi HTTP: ${response.status} - ${response.statusText}`;
            try {
                const errorText = await response.text();
                console.error('Chi tiết lỗi:', errorText);
                
                if (errorText && errorText.trim() !== '') {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (parseError) {
                console.error('Không thể đọc chi tiết lỗi:', parseError);
            }
            
            showError(errorMessage);
            return false;
        }
        
        // Xử lý an toàn khi parse JSON
        let result;
        try {
            const text = await response.text();
            console.log('Phản hồi từ API unregister:', text);
            
            if (!text || text.trim() === '') {
                throw new Error('API trả về kết quả trống');
            }
            
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Lỗi khi parse JSON:', parseError);
            showError(`Không thể xử lý dữ liệu từ server: ${parseError.message}`);
            return false;
        }
        
        if (result.success) {
            showSuccess('Hủy đăng ký khóa học thành công!');
            
            // Cập nhật lại giao diện - xóa khóa học khỏi danh sách đang học
            const courseElement = document.querySelector(`.course-card[data-course-id="${courseId}"]`);
            if (courseElement) {
                courseElement.remove();
                
                // Kiểm tra nếu không còn khóa học nào
                const coursesGrid = document.querySelector('#current-courses .courses-grid');
                if (coursesGrid && !coursesGrid.querySelector('.course-card')) {
                    coursesGrid.innerHTML = '<div class="no-courses">Bạn chưa đăng ký khóa học nào</div>';
                }
            }
            
            return true;
        } else {
            showError(result.message || 'Không thể hủy đăng ký khóa học. Vui lòng thử lại sau.');
            return false;
        }
    } catch (error) {
        console.error('Lỗi khi hủy đăng ký khóa học:', error);
        showError('Đã xảy ra lỗi khi hủy đăng ký khóa học. Vui lòng thử lại sau.');
        return false;
    }
}

// Thêm hàm xử lý nút hủy khóa học
function setupCancelCourseButtons() {
    document.querySelectorAll('.cancel-course').forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const courseCard = this.closest('.course-card');
            const courseId = courseCard.dataset.courseId;
            const courseName = courseCard.querySelector('h3').textContent;
            
            if (confirm(`Bạn có chắc chắn muốn hủy đăng ký khóa học "${courseName}"? Hành động này không thể hoàn tác và mọi dữ liệu học tập sẽ bị xóa.`)) {
                // Hiển thị loading state
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
                this.style.pointerEvents = 'none';
                
                const success = await unregisterCourse(courseId);
                
                if (!success) {
                    // Khôi phục nút nếu có lỗi
                    this.innerHTML = originalText;
                    this.style.pointerEvents = 'auto';
                }
            }
        });
    });
}

// Hiển thị thông báo lỗi
function showError(message) {
    console.error('ERROR:', message);
    
    // Sử dụng toast hoặc notification system nếu có
    if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        showMessage(message, 'error');
    }
}

// Hiển thị thông báo thành công
function showSuccess(message) {
    console.log('SUCCESS:', message);
    
    // Sử dụng toast hoặc notification system nếu có
    if (window.showToast) {
        window.showToast(message, 'success');
    } else {
        showMessage(message, 'success');
    }
}

// Hiển thị thông báo
function showMessage(message, type = 'info') {
    // Sử dụng toast hoặc notification system nếu có
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    
    // Fallback to alert if no toast system and messages-container doesn't exist
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        if (type === 'error') {
            alert('❌ ' + message);
        } else if (type === 'success') {
            alert('✅ ' + message);
        } else if (type === 'warning') {
            alert('⚠️ ' + message);
        } else {
            alert('ℹ️ ' + message);
        }
        return;
    }
    
    // Thêm thông báo vào UI
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="message-icon fas ${getIconForMessageType(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="message-close">&times;</button>
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // Xóa thông báo sau 5 giây
    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            if (messageElement.parentNode === messagesContainer) {
                messagesContainer.removeChild(messageElement);
            }
        }, 500);
    }, 5000);
    
    // Xử lý nút đóng
    const closeButton = messageElement.querySelector('.message-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                if (messageElement.parentNode === messagesContainer) {
                    messagesContainer.removeChild(messageElement);
                }
            }, 500);
        });
    }
}

// Lấy icon phù hợp với loại thông báo
function getIconForMessageType(type) {
    switch (type) {
        case 'error':
            return 'fa-exclamation-circle';
        case 'success':
            return 'fa-check-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

// Kiểm tra kết nối API
async function checkApiConnection() {
    try {
        console.log('Kiểm tra kết nối API...');
        const response = await fetch('/api/coursestudent/ping');
        
        if (response.ok) {
            try {
                const text = await response.text();
                console.log('Raw ping response:', text);
                
                if (text && text.trim() !== '') {
                    const data = JSON.parse(text);
                    console.log('API kết nối thành công:', data);
                    return true;
                } else {
                    console.error('API ping trả về kết quả trống');
                    return false;
                }
            } catch (parseError) {
                console.error('Lỗi khi parse JSON từ API ping:', parseError);
                return false;
            }
        } else {
            console.error('API không phản hồi:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra kết nối API:', error);
        return false;
    }
} 