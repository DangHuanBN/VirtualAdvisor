// Xử lý chuyển đổi tab
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Xóa active class khỏi tất cả các tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Thêm active class cho tab button hiện tại
        this.classList.add('active');
        
        // Lấy tab cần hiển thị
        const targetTabId = this.getAttribute('data-tab') + '-courses';
        
        // Ẩn tất cả các tab content
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hiển thị tab content đích
        document.getElementById(targetTabId).classList.add('active');
        
        // Tải dữ liệu khóa học nếu đang ở tab "Đang học"
        if (this.getAttribute('data-tab') === 'current') {
            loadEnrolledCourses();
        }
    });
});

// Tìm kiếm khóa học
document.getElementById('courseSearch').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const activeCourses = document.querySelector('.tab-pane.active');
    const courseCards = activeCourses.querySelectorAll('.course-card');
    
    courseCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const instructor = card.querySelector('.instructor').textContent.toLowerCase();
        
        if (title.includes(searchText) || instructor.includes(searchText)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// Lọc theo môn học
document.getElementById('subjectFilter').addEventListener('change', function(e) {
    const subject = e.target.value;
    const activeCourses = document.querySelector('.tab-pane.active');
    const courseCards = activeCourses.querySelectorAll('.course-card');
    
    if (subject === 'all') {
        courseCards.forEach(card => {
            card.style.display = '';
        });
        return;
    }
    
    // Xử lý lọc theo môn học - trong thực tế cần thêm attribute data-subject vào các thẻ course-card
    courseCards.forEach(card => {
        const courseSubject = card.getAttribute('data-subject') || '';
        
        if (subject === courseSubject) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// Sắp xếp khóa học
document.getElementById('sortFilter').addEventListener('change', function(e) {
    const sortType = e.target.value;
    const activeCourses = document.querySelector('.tab-pane.active');
    const coursesGrid = activeCourses.querySelector('.courses-grid');
    const courseCards = Array.from(coursesGrid.querySelectorAll('.course-card'));
    
    if (sortType === 'newest') {
        // Sắp xếp theo ngày mới nhất (giả định có data-date attribute)
        courseCards.sort((a, b) => {
            const dateA = new Date(a.getAttribute('data-date') || '2024-01-01');
            const dateB = new Date(b.getAttribute('data-date') || '2024-01-01');
            return dateB - dateA;
        });
    } else if (sortType === 'oldest') {
        // Sắp xếp theo ngày cũ nhất
        courseCards.sort((a, b) => {
            const dateA = new Date(a.getAttribute('data-date') || '2024-01-01');
            const dateB = new Date(b.getAttribute('data-date') || '2024-01-01');
            return dateA - dateB;
        });
    } else if (sortType === 'progress') {
        // Sắp xếp theo tiến độ học tập
        courseCards.sort((a, b) => {
            const progressA = parseInt(a.querySelector('.progress-bar')?.style.width || '0');
            const progressB = parseInt(b.querySelector('.progress-bar')?.style.width || '0');
            return progressB - progressA;
        });
    }
    
    // Cập nhật lại DOM
    courseCards.forEach(card => coursesGrid.appendChild(card));
});

// Xử lý đăng ký khóa học - hiển thị modal
const registerCourseModal = document.getElementById('registerCourseModal');
const closeModalBtn = document.querySelector('.close-modal');

// Xử lý đóng modal
if (registerCourseModal && closeModalBtn) {
    // Đóng modal khi click nút đóng
    closeModalBtn.addEventListener('click', function() {
        registerCourseModal.classList.remove('active');
    });
    
    // Đóng modal khi click ra ngoài
    registerCourseModal.addEventListener('click', function(e) {
        if (e.target === registerCourseModal) {
            registerCourseModal.classList.remove('active');
        }
    });
}

// Xử lý nút đăng ký khóa học trong modal
document.querySelectorAll('.register-course-item').forEach(button => {
    button.addEventListener('click', function() {
        const courseItem = this.closest('.course-item');
        const courseName = courseItem.querySelector('h4').textContent;
        
        alert(`Đã đăng ký khóa học: ${courseName}`);
        registerCourseModal.classList.remove('active');
        
        // Trong thực tế, cần gửi request lên server để đăng ký khóa học
        // Sau đó cập nhật UI hoặc chuyển hướng
    });
});

// Xử lý nút đăng ký ngay trong danh sách khóa học khả dụng
document.querySelectorAll('.register-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const courseCard = this.closest('.course-card');
        const courseName = courseCard.querySelector('h3').textContent;
        
        if (confirm(`Bạn có chắc chắn muốn đăng ký khóa học: ${courseName}?`)) {
            alert(`Đã đăng ký khóa học: ${courseName}`);
            // Trong thực tế, cần gửi request lên server để đăng ký khóa học
            // Sau đó cập nhật UI hoặc chuyển hướng
        }
    });
});

// Xử lý bảo lưu khóa học
document.querySelectorAll('.reserve-course').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const courseCard = this.closest('.course-card');
        const courseName = courseCard.querySelector('h3').textContent;
        
        if (confirm(`Bạn có chắc chắn muốn bảo lưu khóa học: ${courseName}?`)) {
            alert(`Đã bảo lưu khóa học: ${courseName}`);
            // Trong thực tế, cần gửi request lên server để bảo lưu khóa học
            // Sau đó cập nhật UI
        }
    });
});

// Xử lý hủy khóa học
document.querySelectorAll('.cancel-course').forEach(link => {
    link.addEventListener('click', async function(e) {
        e.preventDefault();
        const courseCard = this.closest('.course-card');
        const courseId = courseCard.dataset.courseId;
        const courseName = courseCard.querySelector('h3').textContent;
        
        if (confirm(`Bạn có chắc chắn muốn hủy khóa học: ${courseName}? Hành động này không thể hoàn tác và mọi dữ liệu học tập sẽ bị xóa.`)) {
            // Hiển thị loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
            this.style.pointerEvents = 'none';
            
            try {
                const userId = getCurrentUserId();
                
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
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Không thể hủy đăng ký khóa học');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // Xóa khóa học khỏi giao diện
                    courseCard.remove();
                    
                    // Kiểm tra nếu không còn khóa học nào
                    const coursesGrid = document.querySelector('#current-courses .courses-grid');
                    if (coursesGrid && !coursesGrid.querySelector('.course-card')) {
                        coursesGrid.innerHTML = '<div class="no-courses">Bạn chưa đăng ký khóa học nào</div>';
                    }
                    
                    // Hiển thị thông báo thành công
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = `
                            <div class="message success">
                                <i class="fas fa-check-circle"></i>
                                <span>Hủy đăng ký khóa học thành công</span>
                            </div>
                        `;
                        
                        // Tự động ẩn thông báo sau 5 giây
                        setTimeout(() => {
                            messagesContainer.innerHTML = '';
                        }, 5000);
                    }
                } else {
                    throw new Error(result.message || 'Không thể hủy đăng ký khóa học');
                }
            } catch (error) {
                console.error('Lỗi khi hủy đăng ký khóa học:', error);
                
                // Hiển thị thông báo lỗi
                const messagesContainer = document.getElementById('messages-container');
                if (messagesContainer) {
                    messagesContainer.innerHTML = `
                        <div class="message error">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>${error.message || 'Đã xảy ra lỗi khi hủy đăng ký khóa học'}</span>
                        </div>
                    `;
                    
                    // Tự động ẩn thông báo sau 5 giây
                    setTimeout(() => {
                        messagesContainer.innerHTML = '';
                    }, 5000);
                }
                
                // Khôi phục nút
                this.innerHTML = originalText;
                this.style.pointerEvents = 'auto';
            }
        }
    });
});

// Đảm bảo dropdown menu hiển thị khi click (thay vì chỉ hover)
document.querySelectorAll('.dropdown-toggle').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Đóng tất cả các dropdown menu khác
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu !== this.nextElementSibling) {
                menu.classList.remove('show');
            }
        });
        
        // Toggle menu hiện tại
        this.nextElementSibling.classList.toggle('show');
    });
});

// Đóng dropdown menu khi click bên ngoài
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Hàm lấy thông tin người dùng hiện tại
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
                return userData.userId;
            } else if (userData.user_id) {
                return userData.user_id;
            } else if (userData.id) {
                return userData.id;
            } else if (userData.user && userData.user.id) {
                return userData.user.id;
            }
        } catch (error) {
            console.log(`Không thể parse dữ liệu từ key "${key}":`, error);
            continue;
        }
    }
    
    // Nếu không tìm thấy, đưa người dùng đến trang đăng nhập
    console.error('Không tìm thấy ID người dùng trong localStorage.');
    window.location.href = '/main/login.html';
    throw new Error('Vui lòng đăng nhập để tiếp tục');
}

// Hàm tải và hiển thị danh sách khóa học đang học
async function loadEnrolledCourses() {
    const userId = getCurrentUserId();
    const currentCoursesContainer = document.querySelector('#current-courses .courses-grid');
    
    if (!currentCoursesContainer) return;
    
    try {
        // Hiển thị trạng thái đang tải
        currentCoursesContainer.innerHTML = '<div class="loading-courses">Đang tải danh sách khóa học...</div>';
        
        // Log thông tin debug
        console.log('Đang tải khóa học của user ID:', userId);
        
        // Thử gọi API endpoint "mycourses" trước (đường dẫn cũ)
        let response;
        let result = null;
        
        try {
            response = await fetch(`/api/coursestudent/mycourses/${userId}`);
            
            if (response.ok) {
                // Xử lý an toàn khi parse JSON
                try {
                    const text = await response.text();
                    console.log('Response text từ API mycourses:', text);
                    
                    if (text && text.trim() !== '') {
                        result = JSON.parse(text);
                        console.log('Dữ liệu từ API mycourses:', result);
                    } else {
                        console.log('API mycourses trả về kết quả trống');
                    }
                } catch (parseError) {
                    console.error('Lỗi khi parse dữ liệu từ API mycourses:', parseError);
                }
            } else {
                console.log('API mycourses không trả về dữ liệu, thử endpoint enrolled...');
            }
        } catch (initialError) {
            console.log('Không thể kết nối đến endpoint mycourses:', initialError);
        }
        
        // Nếu không thành công, thử gọi API endpoint "enrolled" (đường dẫn mới)
        if (!result || !result.success) {
            try {
                response = await fetch(`/api/coursestudent/enrolled/${userId}`);
                
                if (!response.ok) {
                    throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
                }
                
                // Xử lý an toàn khi parse JSON
                try {
                    const text = await response.text();
                    console.log('Response text từ API enrolled:', text);
                    
                    if (!text || text.trim() === '') {
                        throw new Error('API enrolled trả về kết quả trống');
                    }
                    
                    result = JSON.parse(text);
                    console.log('Dữ liệu từ API enrolled:', result);
                } catch (parseError) {
                    console.error('Lỗi khi parse dữ liệu từ API enrolled:', parseError);
                    throw new Error(`Không thể xử lý dữ liệu: ${parseError.message}`);
                }
            } catch (fallbackError) {
                throw fallbackError; // Chuyển lỗi để xử lý bên ngoài
            }
        }
        
        if (!result || !result.success) {
            throw new Error(result?.message || 'Không thể tải danh sách khóa học');
        }
        
        // Kiểm tra xem dữ liệu có đúng định dạng không
        if (!Array.isArray(result.data)) {
            console.warn('Dữ liệu API không phải là mảng:', result.data);
            
            // Nếu không phải mảng, thử chuyển đổi
            let coursesArray = [];
            if (result.data && typeof result.data === 'object') {
                // Nếu là object, thử chuyển thành mảng
                coursesArray = [result.data];
            } else {
                // Nếu không phải object, hiển thị lỗi
                throw new Error('Dữ liệu khóa học không hợp lệ');
            }
            
            // Hiển thị danh sách khóa học
            displayEnrolledCourses(coursesArray, currentCoursesContainer);
        } else {
            // Hiển thị danh sách khóa học
            displayEnrolledCourses(result.data, currentCoursesContainer);
        }
    } catch (error) {
        console.error('Lỗi khi tải khóa học đang học:', error);
        currentCoursesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể tải danh sách khóa học: ${error.message}</p>
                <p>Hãy đảm bảo API đang chạy tại http://localhost:5261</p>
                <button class="retry-btn" onclick="loadEnrolledCourses()">Thử lại</button>
            </div>
        `;
    }
}

// Hàm hiển thị danh sách khóa học đang học
function displayEnrolledCourses(courses, container) {
    // Xóa nội dung hiện tại
    container.innerHTML = '';
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="no-courses">Bạn chưa đăng ký khóa học nào</div>';
        return;
    }
    
    console.log('Dữ liệu khóa học từ API:', courses);
    
    // Tạo HTML cho mỗi khóa học
    courses.forEach(course => {
        // Tạo màu nền ngẫu nhiên cho khóa học
        const backgroundColor = getColorForCourse(course.courseId);
        
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card square-card';
        courseCard.dataset.courseId = course.courseId;
        courseCard.style.setProperty('--card-color', backgroundColor);
        
        // Tính tổng thời gian học (giả định mỗi bài học là 1 giờ)
        const totalHours = course.lectureCount || 0;
        
        courseCard.innerHTML = `
            <div class="course-content">
                <h3>${course.courseName}</h3>
                <div class="course-meta">
                    <span><i class="fas fa-clock"></i> ${totalHours} giờ học</span>
                    <span><i class="fas fa-book-open"></i> ${course.lectureCount || 0} bài học</span>
                </div>
                <div class="course-status in-progress">
                    <i class="fas fa-spinner"></i> Đang học
                </div>
                <div class="course-actions-container">
                    <a href="#" class="continue-btn">Tiếp tục học</a>
                    <div class="dropdown">
                        <button class="dropdown-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu">
                            <a href="#" class="dropdown-item reserve-course"><i class="fas fa-pause"></i> Bảo lưu khóa học</a>
                            <a href="#" class="dropdown-item cancel-course"><i class="fas fa-times"></i> Hủy khóa học</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(courseCard);
    });
    
    // Thiết lập lại các sự kiện
    setupCourseEvents();
}

// Thiết lập các sự kiện cho khóa học
function setupCourseEvents() {
    // Xử lý nút tiếp tục học
    document.querySelectorAll('.continue-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const courseCard = this.closest('.course-card');
            const courseId = courseCard.dataset.courseId;
            const courseName = courseCard.querySelector('h3').textContent;
            
            // Hiển thị modal bài giảng
            showLectureModal(courseId, courseName);
        });
    });
    
    // Thiết lập lại các sự kiện dropdown
    setupDropdowns();
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

// Thiết lập dropdown menu
function setupDropdowns() {
    // Đảm bảo dropdown menu hiển thị khi click (thay vì chỉ hover)
    document.querySelectorAll('.dropdown-toggle').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Đóng tất cả các dropdown menu khác
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== this.nextElementSibling) {
                    menu.classList.remove('show');
                }
            });
            
            // Toggle menu hiện tại
            this.nextElementSibling.classList.toggle('show');
        });
    });
    
    // Xử lý bảo lưu khóa học
    document.querySelectorAll('.reserve-course').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const courseCard = this.closest('.course-card');
            const courseName = courseCard.querySelector('h3').textContent;
            
            if (confirm(`Bạn có chắc chắn muốn bảo lưu khóa học: ${courseName}?`)) {
                alert(`Đã bảo lưu khóa học: ${courseName}`);
                // Trong thực tế, cần gửi request lên server để bảo lưu khóa học
                // Sau đó cập nhật UI
            }
        });
    });
    
    // Xử lý hủy khóa học
    document.querySelectorAll('.cancel-course').forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const courseCard = this.closest('.course-card');
            const courseId = courseCard.dataset.courseId;
            const courseName = courseCard.querySelector('h3').textContent;
            
            if (confirm(`Bạn có chắc chắn muốn hủy khóa học: ${courseName}? Hành động này không thể hoàn tác và mọi dữ liệu học tập sẽ bị xóa.`)) {
                // Hiển thị loading state
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
                this.style.pointerEvents = 'none';
                
                try {
                    const userId = getCurrentUserId();
                    
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
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Không thể hủy đăng ký khóa học');
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Xóa khóa học khỏi giao diện
                        courseCard.remove();
                        
                        // Kiểm tra nếu không còn khóa học nào
                        const coursesGrid = document.querySelector('#current-courses .courses-grid');
                        if (coursesGrid && !coursesGrid.querySelector('.course-card')) {
                            coursesGrid.innerHTML = '<div class="no-courses">Bạn chưa đăng ký khóa học nào</div>';
                        }
                        
                        // Hiển thị thông báo thành công
                        const messagesContainer = document.getElementById('messages-container');
                        if (messagesContainer) {
                            messagesContainer.innerHTML = `
                                <div class="message success">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Hủy đăng ký khóa học thành công</span>
                                </div>
                            `;
                            
                            // Tự động ẩn thông báo sau 5 giây
                            setTimeout(() => {
                                messagesContainer.innerHTML = '';
                            }, 5000);
                        }
                    } else {
                        throw new Error(result.message || 'Không thể hủy đăng ký khóa học');
                    }
                } catch (error) {
                    console.error('Lỗi khi hủy đăng ký khóa học:', error);
                    
                    // Hiển thị thông báo lỗi
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = `
                            <div class="message error">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>${error.message || 'Đã xảy ra lỗi khi hủy đăng ký khóa học'}</span>
                            </div>
                        `;
                        
                        // Tự động ẩn thông báo sau 5 giây
                        setTimeout(() => {
                            messagesContainer.innerHTML = '';
                        }, 5000);
                    }
                    
                    // Khôi phục nút
                    this.innerHTML = originalText;
                    this.style.pointerEvents = 'auto';
                }
            }
        });
    });
}

// Hiển thị modal danh sách bài giảng
async function showLectureModal(courseId, courseName) {
    const lectureModal = document.getElementById('lectureCourseModal');
    if (!lectureModal) return;
    
    // Lưu courseId vào dataset của modal
    lectureModal.dataset.courseId = courseId;
    
    // Hiển thị modal
    lectureModal.classList.add('active');
    
    // Cập nhật tiêu đề khóa học
    const modalCourseName = document.getElementById('modal-course-name');
    if (modalCourseName) {
        modalCourseName.textContent = courseName;
    }
    
    // Hiển thị trạng thái đang tải
    const lecturesContainer = document.getElementById('lectures-container');
    if (lecturesContainer) {
        lecturesContainer.innerHTML = '<div class="loading-lectures">Đang tải danh sách bài học...</div>';
    }
    
    try {
        // Tải thông tin khóa học
        await loadCourseInfo(courseId);
        
        // Kiểm tra kết nối API trước khi tải bài giảng
        const isConnected = await checkApiConnection();
        if (!isConnected) {
            throw new Error("Không thể kết nối đến API. Vui lòng kiểm tra kết nối máy chủ.");
        }
        
        // Tải danh sách bài giảng
        await loadCourseLectures(courseId);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu khóa học:', error);
        if (lecturesContainer) {
            lecturesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không thể tải danh sách bài học: ${error.message}</p>
                    <p>Hãy đảm bảo API đang chạy tại http://localhost:5261</p>
                    <button class="retry-btn" onclick="loadCourseLectures(${courseId})">Thử lại</button>
                </div>
            `;
        }
    }
    
    // Thiết lập sự kiện đóng modal
    const closeButton = document.querySelector('.lecture-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            lectureModal.classList.remove('active');
        });
    }
    
    // Đóng modal khi click bên ngoài
    lectureModal.addEventListener('click', function(e) {
        if (e.target === lectureModal) {
            lectureModal.classList.remove('active');
        }
    });
}

// Tải thông tin chi tiết của khóa học
async function loadCourseInfo(courseId) {
    try {
        const response = await fetch(`/api/coursestudent/lectures/${courseId}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Thông tin khóa học:', result);
        
        if (!result.success) {
            // Thêm thông tin mặc định nếu không có dữ liệu
            const defaultCourseInfo = {
                courseId: courseId,
                courseName: "Khóa học " + courseId,
                description: "Chưa có mô tả",
                lectureCount: 0,
                studentCount: 0,
                subjectName: "Chưa xác định"
            };
            
            updateCourseModalInfo(defaultCourseInfo);
            console.warn('Không lấy được thông tin khóa học, sử dụng dữ liệu mặc định');
            return;
        }
        
        // Cập nhật thông tin khóa học trong modal
        updateCourseModalInfo(result.data);
    } catch (error) {
        console.error('Lỗi khi tải thông tin khóa học:', error);
        // Vẫn tiếp tục thay vì throw lỗi
        const defaultCourseInfo = {
            courseId: courseId,
            courseName: "Khóa học " + courseId,
            description: "Chưa có mô tả",
            lectureCount: 0,
            studentCount: 0,
            subjectName: "Chưa xác định"
        };
        
        updateCourseModalInfo(defaultCourseInfo);
    }
}

// Cập nhật thông tin khóa học trong modal
function updateCourseModalInfo(courseData) {
    const courseDescription = document.getElementById('modal-course-description');
    const lectureCount = document.getElementById('modal-lecture-count');
    const courseDuration = document.getElementById('modal-course-duration');
    const studentCount = document.getElementById('modal-student-count');
    const subjectName = document.getElementById('modal-subject-name');
    
    if (courseDescription && courseData.description) {
        courseDescription.textContent = courseData.description || 'Không có mô tả';
    }
    
    if (lectureCount) {
        lectureCount.textContent = courseData.lectureCount || 0;
    }
    
    if (courseDuration) {
        // Tổng thời gian của khóa học (giờ)
        const duration = courseData.lectureCount || 0;
        courseDuration.textContent = duration;
    }
    
    if (studentCount) {
        studentCount.textContent = courseData.studentCount || 0;
    }
    
    if (subjectName) {
        subjectName.textContent = courseData.subjectName || 'Chưa xác định';
    }
}

// Tải danh sách bài giảng của khóa học
async function loadCourseLectures(courseId) {
    const lecturesContainer = document.getElementById('lectures-container');
    const userId = getCurrentUserId();
    if (!lecturesContainer) return;
    
    try {
        console.log(`Tải bài giảng cho khóa học ID=${courseId}`);
        
        // Gọi API lấy danh sách bài giảng
        const response = await fetch(`/api/coursestudent/lectures/${courseId}`);
        
        if (!response.ok) {
            const statusText = response.statusText;
            const status = response.status;
            
            console.error(`API trả về lỗi: ${status} - ${statusText}`);
            
            // Log toàn bộ response để debug
            try {
                const errorText = await response.text();
                console.error('Chi tiết phản hồi lỗi:', errorText);
            } catch (e) {
                console.error('Không thể đọc chi tiết lỗi');
            }
            
            throw new Error(`Lỗi API: ${status} - ${statusText}`);
        }
        
        // Xử lý an toàn khi parse JSON
        let result;
        try {
            const text = await response.text();
            console.log('Raw response text:', text);
            
            if (!text || text.trim() === '') {
                throw new Error('Empty response from server');
            }
            
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Lỗi khi parse JSON:', parseError);
            throw new Error(`Không thể xử lý dữ liệu: ${parseError.message}`);
        }
        
        console.log('Dữ liệu bài giảng từ API:', result);
        
        if (!result.success || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
            lecturesContainer.innerHTML = '<div class="no-lectures">Khóa học này chưa có bài giảng nào</div>';
            return;
        }
        
        // Debug: Hiển thị chi tiết về loại bài học đầu tiên
        if (result.data.length > 0) {
            const firstLecture = result.data[0];
            console.log("THÔNG TIN CHI TIẾT BÀI HỌC ĐẦU TIÊN:", {
                id: firstLecture.lectureId || firstLecture.id,
                title: firstLecture.title || firstLecture.lectureName,
                type: firstLecture.type,
                fileType: firstLecture.fileType,
                allProperties: firstLecture
            });
            
            // Cập nhật tiêu đề modal ngay khi có dữ liệu
            updateModalTitle(result.data);
        }
        
        // Lấy thông tin tiến độ học tập của sinh viên cho khóa học này
        let progressData = null;
        try {
            const progressResponse = await fetch(`/api/tracking/course/${courseId}/user/${userId}`);
            
            if (progressResponse.ok) {
                const progressText = await progressResponse.text();
                if (progressText && progressText.trim() !== '') {
                    const progressResult = JSON.parse(progressText);
                    if (progressResult.success && progressResult.data) {
                        progressData = progressResult.data;
                        console.log('Dữ liệu tiến độ khóa học:', progressData);
                    }
                }
            }
        } catch (progressError) {
            console.error('Lỗi khi lấy tiến độ khóa học:', progressError);
            // Tiếp tục mà không có dữ liệu tiến độ
        }
        
        // Hiển thị danh sách bài giảng
        displayLectures(result.data, lecturesContainer, progressData);
    } catch (error) {
        console.error('Lỗi khi tải danh sách bài giảng:', error);
        lecturesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể tải danh sách bài học: ${error.message}</p>
                <p>Hãy đảm bảo API đang chạy tại http://localhost:5261</p>
                <button class="retry-btn" onclick="loadCourseLectures(${courseId})">Thử lại</button>
            </div>
        `;
    }
}

// Hàm mới: Cập nhật tiêu đề modal dựa trên loại bài học
function updateModalTitle(lectures) {
    if (!lectures || lectures.length === 0) return;
    
    let mainLectureTypeLabel = "Bài giảng";
    const firstLecture = lectures[0];
    const lectureType = (firstLecture.type || firstLecture.fileType || "").toLowerCase();
    
    console.log(`Cập nhật tiêu đề modal dựa trên loại: ${lectureType}`);
    
    if (lectureType === "baikiemtra") {
        mainLectureTypeLabel = "Bài kiểm tra";
    } else if (lectureType === "baithi") {
        mainLectureTypeLabel = "Bài thi";
    }
    
    // Cập nhật tiêu đề modal
    const modalHeader = document.querySelector('.lecture-modal-header h2');
    if (modalHeader) {
        modalHeader.textContent = `Danh sách ${mainLectureTypeLabel.toLowerCase()}`;
        console.log(`Đã cập nhật tiêu đề modal thành: ${modalHeader.textContent}`);
    }
    
    // Cập nhật tiêu đề section
    const lecturesHeader = document.querySelector('.lectures-header h3');
    if (lecturesHeader) {
        lecturesHeader.textContent = `Nội dung ${mainLectureTypeLabel.toLowerCase()}`;
        console.log(`Đã cập nhật tiêu đề section thành: ${lecturesHeader.textContent}`);
    }
    
    // Cập nhật tab label
    const tabLabel = document.querySelector('.course-info span:first-child');
    if (tabLabel) {
        const icon = lectureType === "baikiemtra" ? "fa-tasks" : 
                    lectureType === "baithi" ? "fa-edit" : "fa-book";
        
        tabLabel.innerHTML = `<i class="fas ${icon}"></i> <span id="modal-lecture-count">${lectures.length}</span> ${mainLectureTypeLabel.toLowerCase()}`;
        console.log(`Đã cập nhật tab label thành: ${tabLabel.innerHTML}`);
    }
}

// Hiển thị danh sách bài giảng
function displayLectures(lectures, container, progressData) {
    // Xóa nội dung hiện tại
    container.innerHTML = '';
    
    if (!lectures || lectures.length === 0) {
        container.innerHTML = '<div class="no-lectures">Khóa học này chưa có bài học nào</div>';
        return;
    }
    
    console.log("Danh sách bài học:", lectures);
    
    // Xác định loại bài học chính trong khóa học (lấy loại đầu tiên)
    let mainLectureType = "baigiang"; // mặc định là bài giảng
    let mainLectureTypeLabel = "Bài giảng";
    if (lectures.length > 0) {
        // Log toàn bộ dữ liệu bài giảng đầu tiên để debug
        console.log("Chi tiết bài giảng đầu tiên:", lectures[0]);
        
        // Xác định loại từ bản ghi đầu tiên - sửa để đọc cả type và fileType
        const firstLecture = lectures[0];
        const lectureType = (firstLecture.type || firstLecture.fileType || "").toLowerCase();
        console.log(`Loại bài học đầu tiên: ${lectureType}`);
        
        if (lectureType === "baikiemtra") {
            mainLectureType = "baikiemtra";
            mainLectureTypeLabel = "Bài kiểm tra";
            
            // Cập nhật tiêu đề tab trong modal
            const tabLabel = document.querySelector('.course-info span:first-child');
            if (tabLabel) {
                tabLabel.innerHTML = `<i class="fas fa-tasks"></i> <span id="modal-lecture-count">${lectures.length}</span> bài kiểm tra`;
            }
        } else if (lectureType === "baithi") {
            mainLectureType = "baithi";
            mainLectureTypeLabel = "Bài thi";
            
            // Cập nhật tiêu đề tab trong modal
            const tabLabel = document.querySelector('.course-info span:first-child');
            if (tabLabel) {
                tabLabel.innerHTML = `<i class="fas fa-edit"></i> <span id="modal-lecture-count">${lectures.length}</span> bài thi`;
            }
        }
    }
    
    // Xác định loại khóa học: tuần tự (tuantu) hoặc tự do (tudo)
    const courseType = progressData ? progressData.courseType : 'tudo';
    console.log("Loại khóa học:", courseType);
    
    // Thêm thông tin về loại khóa học (thêm UI mới)
    const courseTypeInfo = document.createElement('div');
    courseTypeInfo.className = 'course-type-info';
    
    if (courseType === 'tuantu') {
        courseTypeInfo.innerHTML = `
            <i class="fas fa-info-circle"></i>
            Đây là khóa học <strong>tuần tự</strong>. Bạn cần hoàn thành mỗi bài học trước khi học phần tiếp theo.
        `;
    } else {
        courseTypeInfo.innerHTML = `
            <i class="fas fa-info-circle"></i>
            Đây là khóa học <strong>tự do</strong>. Bạn có thể học bất kỳ bài học nào theo thứ tự mong muốn.
        `;
    }
    container.appendChild(courseTypeInfo);
    
    // Cập nhật tiêu đề modal dựa trên loại bài học chính
    const modalHeader = document.querySelector('.lecture-modal-header h2');
    if (modalHeader) {
        modalHeader.textContent = `Danh sách ${mainLectureTypeLabel.toLowerCase()}`;
    }
    
    // Cập nhật tiêu đề section trong modal
    const lecturesHeader = document.querySelector('.lectures-header h3');
    if (lecturesHeader) {
        lecturesHeader.textContent = `Nội dung ${mainLectureTypeLabel.toLowerCase()}`;
    }
    
    // Tạo mapping tiến độ học tập từ API response
    const lectureProgressMap = {};
    if (progressData && progressData.lectureProgress) {
        progressData.lectureProgress.forEach(item => {
            lectureProgressMap[item.lectureId] = {
                progress: item.progress,
                status: item.status
            };
        });
    }
    
    // Biến để theo dõi nếu có bài học trước đó chưa hoàn thành (dùng cho khóa học tuần tự)
    let previousLectureCompleted = true;
    
    // Tạo container cho danh sách bài học
    const lectureList = document.createElement('div');
    lectureList.className = 'lecture-list';
    container.appendChild(lectureList);
    
    // Tạo HTML cho mỗi bài học
    lectures.forEach((lecture, index) => {
        const lectureItem = document.createElement('div');
        lectureItem.className = 'lecture-item';
        
        // Lấy thông tin tiến độ của bài học hiện tại
        const currentProgress = lectureProgressMap[lecture.lectureId || lecture.id] || { progress: 0, status: 'chuahoanthanh' };
        
        // Kiểm tra xem có thể tiếp tục học bài học này không
        const canAccess = courseType === 'tudo' || // Khóa học tự do luôn được truy cập
                         index === 0 || // Bài đầu tiên luôn được truy cập
                         previousLectureCompleted; // Bài tiếp theo nếu bài trước đã hoàn thành
        
        // Cập nhật trạng thái hoàn thành cho bài học tiếp theo
        if (courseType === 'tuantu') {
            previousLectureCompleted = currentProgress.status === 'hoanthanh';
        }
        
        // Định dạng thời lượng
        const duration = formatDuration(lecture.duration);
        
        // Hiển thị loại bài học (bài giảng, bài thi, hoặc bài kiểm tra)
        let contentTypeIcon = 'fa-book';
        let contentTypeLabel = 'Bài giảng';
        
        // Log ra thông tin chi tiết về bài giảng để debug
        console.log(`Bài giảng ID=${lecture.lectureId || lecture.id}, Tên=${lecture.title || lecture.lectureName}, Type=${lecture.type || lecture.fileType || 'không có'}`);
        
        // Xác định loại bài học dựa trên trường type nếu có
        const lectureType = (lecture.type || lecture.fileType || "").toLowerCase();
        let isQuiz = false;

        if (lectureType) {
            console.log(`Loại bài học: ${lectureType}`);
            
            // Xử lý chính xác các giá trị enum của type trong CSDL
            switch(lectureType) {
                case 'baithi':
                    contentTypeIcon = 'fa-edit';
                    contentTypeLabel = 'Bài thi';
                    lectureItem.classList.add('exam-lecture');
                    isQuiz = true;
                    break;
                case 'baikiemtra':
                    contentTypeIcon = 'fa-tasks';
                    contentTypeLabel = 'Bài kiểm tra';
                    lectureItem.classList.add('quiz-lecture');
                    isQuiz = true;
                    break;
                case 'baigiang':
                default:
                    contentTypeIcon = 'fa-book';
                    contentTypeLabel = 'Bài giảng';
                    lectureItem.classList.add('theory-lecture');
                    break;
            }
        } else {
            // Nếu không có trường type hoặc giá trị rỗng, mặc định là bài giảng
            contentTypeIcon = 'fa-book';
            contentTypeLabel = 'Bài giảng';
            lectureItem.classList.add('theory-lecture');
            
            // Thêm code phán đoán từ tiêu đề (không còn cần thiết nhưng giữ để an toàn)
            const title = (lecture.title || lecture.lectureName || '').toLowerCase();
            if (title.includes('thi') || title.includes('exam')) {
                contentTypeIcon = 'fa-edit';
                contentTypeLabel = 'Bài thi';
                lectureItem.classList.remove('theory-lecture');
                lectureItem.classList.add('exam-lecture');
                isQuiz = true;
            } else if (title.includes('kiểm tra') || title.includes('quiz') || title.includes('test')) {
                contentTypeIcon = 'fa-tasks';
                contentTypeLabel = 'Bài kiểm tra';
                lectureItem.classList.remove('theory-lecture');
                lectureItem.classList.add('quiz-lecture');
                isQuiz = true;
            }
        }
        
        // Hiển thị file dựa trên loại file
        let fileTypeIcon = 'fa-file';
        let fileTypeLabel = 'Tài liệu';
        
        if (lecture.attachment) {
            const attachment = lecture.attachment.toLowerCase();
            
            if (attachment.includes('.pdf')) {
                fileTypeIcon = 'fa-file-pdf';
                fileTypeLabel = 'PDF';
            } else if (attachment.includes('.docx') || attachment.includes('.doc')) {
                fileTypeIcon = 'fa-file-word';
                fileTypeLabel = 'Word';
            } else if (attachment.includes('.pptx') || attachment.includes('.ppt')) {
                fileTypeIcon = 'fa-file-powerpoint';
                fileTypeLabel = 'PowerPoint';
            }
        }
        
        // Hiển thị tiến độ học tập
        const progressPercentage = currentProgress.progress || 0;
        const progressStatus = currentProgress.status === 'hoanthanh' ? 'Hoàn thành' : 'Chưa hoàn thành';
        const progressClass = currentProgress.status === 'hoanthanh' ? 'completed' : 'in-progress';
        
        // Xác định đường dẫn tệp
        const filePath = lecture.attachment || lecture.filePath || '';
        
        // Hiển thị nút xem bài học phù hợp với loại file và quyền truy cập
        let viewButtonHTML = '';
        
        if (isQuiz) {
            // Đối với bài kiểm tra hoặc bài thi
            if (canAccess) {
                const lectureId = lecture.lectureId || lecture.id;
                const courseId = document.getElementById('lectureCourseModal')?.dataset?.courseId || '';
                const lectureTitle = lecture.title || lecture.lectureName || contentTypeLabel;
                
                viewButtonHTML = `<button class="view-lecture-btn" onclick="openQuiz(${lectureId}, '${lectureTitle}', ${courseId})">Làm ${contentTypeLabel}</button>`;
            } else {
                viewButtonHTML = `<button class="view-lecture-btn disabled" disabled>Hoàn thành bài trước</button>`;
            }
        } else if (filePath) {
            const fileExt = getFileExtension(filePath);
            
            if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'pptx') {
                // PDF, DOCX, PPTX: Mở trong document viewer
                if (canAccess) {
                    viewButtonHTML = `<button class="view-lecture-btn" onclick="openDocumentViewer('${filePath}', ${lecture.lectureId || lecture.id}, '${lecture.title || lecture.lectureName}')">Học ${contentTypeLabel}</button>`;
                } else {
                    viewButtonHTML = `<button class="view-lecture-btn disabled" disabled>Hoàn thành bài trước</button>`;
                }
            } else if (fileExt === 'mp4' || fileExt === 'webm' || fileExt === 'ogg') {
                // Video: Mở trong modal video
                if (canAccess) {
                    viewButtonHTML = `<button class="view-lecture-btn" onclick="openVideoModal('${filePath}')">Xem ${contentTypeLabel}</button>`;
                } else {
                    viewButtonHTML = `<button class="view-lecture-btn disabled" disabled>Hoàn thành bài trước</button>`;
                }
            } else {
                // Các loại file khác: Download
                if (canAccess) {
                    viewButtonHTML = `<a href="${filePath}" class="download-lecture-btn" download>Tải xuống</a>`;
                } else {
                    viewButtonHTML = `<button class="download-lecture-btn disabled" disabled>Hoàn thành bài trước</button>`;
                }
            }
        } else {
            // Không có file: hiển thị thông báo lỗi
            viewButtonHTML = `<button class="view-lecture-btn error" disabled>File không khả dụng</button>`;
        }
        
        // Tạo HTML cho item bài học
        lectureItem.innerHTML = `
            <div class="lecture-item-header">
                <div class="lecture-type">
                    <i class="fas ${contentTypeIcon}"></i>
                    <span>${contentTypeLabel}</span>
                </div>
                <div class="lecture-title">
                    <h4>${lecture.title || lecture.lectureName || 'Không có tiêu đề'}</h4>
                </div>
            </div>
            <div class="lecture-item-body">
                <div class="lecture-meta">
                    <span><i class="fas fa-clock"></i> ${duration || 'Không xác định'}</span>
                    <span><i class="fas ${fileTypeIcon}"></i> ${fileTypeLabel}</span>
                </div>
                <div class="lecture-progress ${progressClass}">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${progressPercentage}% - ${progressStatus}</span>
                </div>
            </div>
            <div class="lecture-item-footer">
                ${viewButtonHTML}
            </div>
        `;
        
        lectureList.appendChild(lectureItem);
    });
}

/**
 * Lấy phần mở rộng của file
 * @param {string} filePath Đường dẫn file
 * @returns {string} Phần mở rộng
 */
function getFileExtension(filePath) {
    if (!filePath) return '';
    return filePath.split('.').pop().toLowerCase();
}

// Hàm mở tài liệu trong document viewer
function openDocumentViewer(filePath, lectureId, title) {
    if (!filePath) {
        alert('Không tìm thấy đường dẫn tệp tin');
        return;
    }
    
    const extension = getFileExtension(filePath);
    
    // Xác định các định dạng tệp tin hỗ trợ
    if (['pdf', 'docx', 'pptx'].includes(extension)) {
        // Lấy thông tin khóa học từ modal hiện tại
        const courseId = document.querySelector('#lectureCourseModal')?.dataset?.courseId || '';
        const courseName = document.getElementById('modal-course-name')?.textContent || '';
        
        const viewerUrl = `document-viewer.html?file=${encodeURIComponent(filePath)}&lectureId=${lectureId}&title=${encodeURIComponent(title || '')}&source=default&returnUrl=courses.html&courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`;
        window.location.href = viewerUrl;
    } else {
        console.error('Không hỗ trợ xem loại file: ' + extension);
        // Mở file bằng URL trực tiếp nếu không có trình xem riêng
        window.open(filePath, '_blank');
    }
}

// Định dạng thời lượng từ giây sang phút:giây
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) {
        return '1 giờ'; // Giá trị mặc định
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} phút`;
    } else {
        return 'Dưới 1 phút';
    }
}

// Hàm mở modal xem video
function openVideoModal(videoUrl) {
    // Kiểm tra URL video
    if (!videoUrl) {
        alert('Không tìm thấy video này!');
        return;
    }
    
    // Tạm thời chuyển đến trang video
    window.open(videoUrl, '_blank');
}

// Tải khóa học khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra nếu tab "Đang học" đang active, tải danh sách khóa học
    if (document.querySelector('.tab-btn[data-tab="current"]').classList.contains('active')) {
        loadEnrolledCourses();
    }
    
    // Kiểm tra URL để xem có quay lại từ document-viewer không
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const courseName = urlParams.get('courseName');
    
    if (courseId) {
        // Nếu có courseId trong URL, mở lại modal bài giảng
        console.log('Mở lại modal bài giảng cho khóa học:', courseId, courseName);
        setTimeout(() => {
            showLectureModal(courseId, courseName || '');
        }, 500); // Đợi 500ms để đảm bảo trang đã tải xong
    }
});

// Tải thông tin tiến độ học và kiểm tra điều kiện
async function checkCourseProgress(courseId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            console.error('Không thể xác định ID người dùng');
            return null;
        }
        
        console.log(`Đang kiểm tra tiến độ khóa học ID=${courseId} cho người dùng ID=${userId}`);
        
        // Sử dụng endpoint mới đã tạo
        const endpoint = `/api/tracking/course/${courseId}/user/${userId}`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            console.error(`API trả về lỗi: ${response.status} - ${response.statusText}`);
            return null;
        }
        
        const result = await response.json();
        console.log('Kết quả từ API tiến độ:', result);
        
        if (result.success && result.data) {
            return result.data;
        }
        
        return null;
    } catch (error) {
        console.error('Lỗi khi kiểm tra tiến độ khóa học:', error);
        return null;
    }
}

/**
 * Mở trang làm bài kiểm tra/bài thi
 * @param {number} lectureId - ID bài giảng
 * @param {string} title - Tiêu đề bài giảng
 * @param {number} courseId - ID khóa học
 */
function openQuiz(lectureId, title, courseId) {
    if (!lectureId) {
        alert('Không tìm thấy thông tin bài kiểm tra');
        return;
    }
    
    // Mở trang bài kiểm tra với tham số
    const quizUrl = `quiz-test.html?lectureId=${lectureId}&courseId=${courseId}&title=${encodeURIComponent(title)}`;
    window.location.href = quizUrl;
} 