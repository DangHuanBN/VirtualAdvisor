/**
 * Module quản lý đánh giá bài giảng của sinh viên
 */
const FeedbackModule = (function() {
    // Cấu hình API
    const API_URL = '/api';
    
    // Cache DOM
    const courseFilter = document.getElementById('courseFilter');
    const pendingFeedbackList = document.getElementById('pendingFeedbackList');
    const submittedFeedbackList = document.getElementById('submittedFeedbackList');
    const pendingFeedbackTemplate = document.getElementById('pendingFeedbackTemplate');
    const submittedFeedbackTemplate = document.getElementById('submittedFeedbackTemplate');
    
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
    
    // Hiển thị thông tin sinh viên
    function displayStudentInfo() {
        const studentNameElement = document.getElementById('studentName');
        const studentIdElement = document.getElementById('studentId');
        if (!studentNameElement || !studentIdElement) return;

        const currentUser = getCurrentUser();
        if (currentUser) {
            studentNameElement.textContent = currentUser.fullName || 'Chưa có tên';
            studentIdElement.textContent = `ID: ${currentUser.userId || 'Chưa có ID'}`;
        } else {
            studentNameElement.textContent = 'Chưa đăng nhập';
            studentIdElement.textContent = 'ID: Chưa đăng nhập';
        }
    }
    
    // Tải danh sách khóa học cho bộ lọc
    async function loadCourseFilter() {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                console.warn("Không thể tải khóa học vì chưa đăng nhập");
                courseFilter.innerHTML = '<option value="">Vui lòng đăng nhập</option>';
                return;
            }
            
            const studentId = currentUser.userId;
            if (!studentId) {
                console.warn("Không tìm thấy ID sinh viên");
                courseFilter.innerHTML = '<option value="">ID sinh viên không hợp lệ</option>';
                return;
            }
            
            // Hiển thị trạng thái đang tải
            courseFilter.innerHTML = '<option value="">Đang tải...</option>';
            
            // Thay đổi endpoint để sử dụng tham số query thay vì tham số path
            const response = await fetch(`${API_URL}/courses/enrolled?studentId=${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'X-Student-Id': studentId.toString() // Thêm header X-Student-Id
                }
            });
            
            if (!response.ok) {
                console.error(`Lỗi HTTP: ${response.status}`);
                
                // Hiển thị thông báo lỗi chi tiết
                let errorMessage = `Lỗi khi tải khóa học (HTTP ${response.status})`;
                
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch(e) {
                    // Ignore JSON parsing error
                }
                
                courseFilter.innerHTML = `<option value="">Lỗi: ${errorMessage}</option>`;
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                console.error("Lỗi khi tải khóa học:", data.message);
                courseFilter.innerHTML = `<option value="">Lỗi: ${data.message}</option>`;
                return;
            }
            
            // Xóa tất cả các option cũ trừ option mặc định đầu tiên
            courseFilter.innerHTML = '<option value="">Tất cả khóa học</option>';
            
            // Thêm các khóa học mới
            if (data.data && data.data.length > 0) {
                data.data.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.courseId;
                    option.textContent = course.courseName;
                    courseFilter.appendChild(option);
                });
                console.log("Đã tải xong danh sách khóa học");
            } else {
                console.log("Không có khóa học nào");
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Không có khóa học nào";
                option.disabled = true;
                courseFilter.appendChild(option);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách khóa học:", error);
            // Thêm xử lý hiển thị lỗi cho người dùng nếu cần
            if (courseFilter.options.length <= 1) {
                courseFilter.innerHTML = `<option value="">Lỗi: ${error.message || 'Không thể tải khóa học'}</option>`;
            }
        }
    }
    
    // Tải danh sách bài giảng đã hoàn thành
    async function loadCompletedLectures() {
        try {
            pendingFeedbackList.innerHTML = '<div class="loading-message">Đang tải bài giảng...</div>';
            
            const currentUser = getCurrentUser();
            const studentId = currentUser ? currentUser.userId : null;
            
            // Kiểm tra nếu không có studentId hợp lệ
            if (!studentId) {
                pendingFeedbackList.innerHTML = '<div class="error-message">Vui lòng đăng nhập để xem bài giảng đã hoàn thành</div>';
                return;
            }
            
            const courseId = courseFilter.value;
            let url = `${API_URL}/student-feedback/completed-lectures?studentId=${studentId}`;
            
            if (courseId) {
                url += `&courseId=${courseId}`;
            }
                
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'X-Student-Id': studentId.toString() // Thêm header X-Student-Id
                }
            });
            
            if (!response.ok) {
                console.error(`Lỗi HTTP: ${response.status}`);
                
                // Hiển thị thông báo lỗi chi tiết
                let errorMessage = `Lỗi khi tải bài giảng đã hoàn thành (HTTP ${response.status})`;
                
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch(e) {
                    // Ignore JSON parsing error
                }
                
                pendingFeedbackList.innerHTML = `<div class="error-message">${errorMessage}</div>`;
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            pendingFeedbackList.innerHTML = '';
            
            if (!data.success || !data.data || data.data.length === 0) {
                pendingFeedbackList.innerHTML = '<div class="empty-message">Không có bài giảng nào cần đánh giá</div>';
                return;
            }
            
            // Lọc bài giảng chưa có feedback
            const pendingLectures = data.data.filter(lecture => !lecture.hasFeedback);
            
            if (pendingLectures.length === 0) {
                pendingFeedbackList.innerHTML = '<div class="empty-message">Bạn đã đánh giá tất cả bài giảng</div>';
                return;
            }
            
            // Hiển thị các bài giảng chưa có feedback
            pendingLectures.forEach(lecture => {
                const clone = document.importNode(pendingFeedbackTemplate.content, true);
                
                const card = clone.querySelector('.feedback-card');
                card.setAttribute('data-lecture-id', lecture.lectureId);
                
                clone.querySelector('h4').textContent = lecture.title;
                clone.querySelector('.course-name').textContent = `Khóa học: ${lecture.courseName}`;
                clone.querySelector('.teacher-name').textContent = `Giảng viên: ${lecture.teacherName}`;
                
                const completionDate = lecture.completionDate ? 
                    new Date(lecture.completionDate).toLocaleDateString('vi-VN') : 'Chưa xác định';
                clone.querySelector('.completion-date').textContent = `Hoàn thành: ${completionDate}`;
                
                // Thiết lập sự kiện cho các sao
                const stars = clone.querySelectorAll('.star-rating i');
                stars.forEach(star => {
                    star.addEventListener('mouseover', function() {
                        const rating = this.getAttribute('data-rating');
                        highlightStars(stars, rating);
                    });
                    
                    star.addEventListener('mouseout', function() {
                        const ratingContainer = this.closest('.star-rating');
                        const selectedRating = ratingContainer.getAttribute('data-selected');
                        if (selectedRating) {
                            highlightStars(stars, selectedRating);
                        } else {
                            resetStars(stars);
                        }
                    });
                    
                    star.addEventListener('click', function() {
                        const rating = this.getAttribute('data-rating');
                        const ratingContainer = this.closest('.star-rating');
                        ratingContainer.setAttribute('data-selected', rating);
                        highlightStars(stars, rating);
                    });
                });
                
                // Thiết lập sự kiện cho nút gửi đánh giá
                const submitButton = clone.querySelector('.submit-feedback');
                submitButton.addEventListener('click', function() {
                    submitFeedback(this);
                });
                
                pendingFeedbackList.appendChild(clone);
            });
            
            console.log("Đã tải xong danh sách bài giảng cần đánh giá");
        } catch (error) {
            console.error("Lỗi khi tải danh sách bài giảng đã hoàn thành:", error);
            pendingFeedbackList.innerHTML = `<div class="error-message">Không thể tải danh sách bài giảng: ${error.message || 'Đã xảy ra lỗi'}</div>`;
        }
    }
    
    // Tải lịch sử đánh giá
    async function loadFeedbackHistory() {
        try {
            submittedFeedbackList.innerHTML = '<div class="loading-message">Đang tải đánh giá...</div>';
            
            const courseId = courseFilter.value;
            const url = courseId ? 
                `${API_URL}/student-feedback/history?courseId=${courseId}` : 
                `${API_URL}/student-feedback/history`;
                
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error("Lỗi khi tải lịch sử đánh giá");
            }
            
            const data = await response.json();
            
            submittedFeedbackList.innerHTML = '';
            
            if (!data.success || !data.data || data.data.length === 0) {
                submittedFeedbackList.innerHTML = '<div class="empty-message">Bạn chưa gửi đánh giá nào</div>';
                return;
            }
            
            // Hiển thị các đánh giá đã gửi
            data.data.forEach(feedback => {
                const clone = document.importNode(submittedFeedbackTemplate.content, true);
                
                // Trích xuất ID bài giảng và nội dung từ chuỗi feedback
                const feedbackContent = feedback.content;
                const match = feedbackContent.match(/Đánh giá bài giảng (\d+): (.*)/);
                
                if (match) {
                    const lectureId = match[1];
                    const content = match[2];
                    
                    clone.querySelector('h4').textContent = `Đánh giá bài giảng #${lectureId}`;
                    clone.querySelector('.feedback-text').textContent = content;
                } else {
                    clone.querySelector('h4').textContent = 'Đánh giá bài giảng';
                    clone.querySelector('.feedback-text').textContent = feedbackContent;
                }
                
                clone.querySelector('.course-name').textContent = `Khóa học: ${feedback.courseName}`;
                
                // Hiển thị số sao dựa trên điểm
                const stars = Math.round(feedback.diem / 2);
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    starsHtml += `<i class="${i <= stars ? 'fas' : 'far'} fa-star"></i>`;
                }
                clone.querySelector('.star-rating').innerHTML = starsHtml;
                
                // Format ngày
                const date = new Date(feedback.timestamp).toLocaleDateString('vi-VN');
                clone.querySelector('.submitted-date').textContent = `Đã gửi: ${date}`;
                
                submittedFeedbackList.appendChild(clone);
            });
            
            console.log("Đã tải xong lịch sử đánh giá");
        } catch (error) {
            console.error("Lỗi khi tải lịch sử đánh giá:", error);
            submittedFeedbackList.innerHTML = '<div class="error-message">Không thể tải lịch sử đánh giá</div>';
        }
    }
    
    // Gửi đánh giá mới
    async function submitFeedback(button) {
        try {
            const card = button.closest('.feedback-card');
            const lectureId = card.getAttribute('data-lecture-id');
            const ratingContainer = card.querySelector('.star-rating');
            const rating = ratingContainer.getAttribute('data-selected');
            const comment = card.querySelector('textarea').value.trim();

            if (!rating) {
                alert('Vui lòng chọn số sao đánh giá!');
                return;
            }

            if (!comment) {
                alert('Vui lòng nhập nội dung đánh giá!');
                return;
            }
            
            // Vô hiệu hóa nút gửi để tránh gửi lại
            button.disabled = true;
            button.textContent = 'Đang gửi...';
            
            // Chuẩn bị dữ liệu
            const feedbackData = {
                lectureId: parseInt(lectureId),
                soSao: parseInt(rating),
                noiDung: comment
            };
            
            // Gửi dữ liệu lên server
            const response = await fetch(`${API_URL}/student-feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(feedbackData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Lỗi khi gửi đánh giá");
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || "Gửi đánh giá không thành công");
            }
            
            // Hiển thị thông báo thành công
            alert('Đánh giá của bạn đã được gửi thành công!');
            
            // Tải lại dữ liệu
            await loadCompletedLectures();
            await loadFeedbackHistory();
            
        } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            alert(`Lỗi: ${error.message || "Không thể gửi đánh giá"}`);
            
            // Kích hoạt lại nút
            button.disabled = false;
            button.textContent = 'Gửi đánh giá';
        }
    }
    
    // Hàm highlight sao
    function highlightStars(stars, rating) {
        stars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    // Hàm reset sao về trạng thái ban đầu
    function resetStars(stars) {
        stars.forEach(star => {
            star.classList.remove('fas');
            star.classList.add('far');
        });
    }
    
    // Thiết lập sự kiện
    function setupEventListeners() {
        // Lọc theo khóa học
        courseFilter.addEventListener('change', function() {
            loadCompletedLectures();
            loadFeedbackHistory();
        });
        
        // Xử lý đăng xuất
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            });
        }
    }
    
    // Khởi tạo
    function init() {
        console.log('Module đánh giá bài giảng sinh viên đã được khởi tạo');
        displayStudentInfo();
        setupEventListeners();
        loadCourseFilter().then(() => {
            loadCompletedLectures();
            loadFeedbackHistory();
        });
    }
    
    // Giao diện công khai
    return {
        init: init
    };
})();

// Khởi tạo module
document.addEventListener('DOMContentLoaded', function() {
    FeedbackModule.init();
}); 