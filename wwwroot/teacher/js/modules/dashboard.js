/**
 * Module cho trang Dashboard (Trang chủ) của giáo viên
 */

const DashboardModule = (function() {
    // Lưu trữ dữ liệu
    const data = {
        currentTeacher: null,
        recentActivities: [],
        upcomingLectures: [],
        myCourses: [],
        ungraded: 0
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('DashboardModule đã được khởi tạo');
        loadDashboardData();
        setupEventListeners();
    }
    
    /**
     * Thiết lập các sự kiện lắng nghe
     */
    function setupEventListeners() {
        // Xử lý sự kiện cho các thẻ trong thống kê
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                handleCardClick(type);
            });
        });
        
        // Nút xem tất cả các hoạt động gần đây
        const viewAllActivitiesBtn = document.getElementById('viewAllActivities');
        if (viewAllActivitiesBtn) {
            viewAllActivitiesBtn.addEventListener('click', function() {
                // Chuyển đến trang lịch sử hoạt động
                window.location.href = 'pages/activities.html';
            });
        }
        
        // Nút xem tất cả bài giảng sắp tới
        const viewAllLecturesBtn = document.getElementById('viewAllLectures');
        if (viewAllLecturesBtn) {
            viewAllLecturesBtn.addEventListener('click', function() {
                // Chuyển đến trang quản lý bài giảng
                window.location.href = 'pages/lectures.html';
            });
        }
    }
    
    /**
     * Xử lý khi click vào thẻ thống kê
     * @param {string} type - Loại thẻ được click
     */
    function handleCardClick(type) {
        switch (type) {
            case 'lectures':
                // Chuyển đến trang quản lý bài giảng
                window.location.href = 'pages/lectures.html';
                break;
            case 'quizzes':
                // Chuyển đến trang quản lý bài kiểm tra (lọc theo type)
                window.location.href = 'pages/lectures.html?type=baikiemtra';
                break;
            case 'exams':
                // Chuyển đến trang quản lý bài thi (lọc theo type)
                window.location.href = 'pages/lectures.html?type=baithi';
                break;
            case 'students':
                // Chuyển đến trang đánh giá sinh viên
                window.location.href = 'pages/student-evaluation.html';
                break;
        }
    }
    
    /**
     * Tải dữ liệu cho Dashboard
     */
    function loadDashboardData() {
        // Trong môi trường thực tế, đây sẽ là các yêu cầu AJAX
        // Cho mục đích demo, chúng ta sẽ sử dụng dữ liệu mẫu
        
        // Kiểm tra CommonModule đã tồn tại chưa
        if (typeof CommonModule === 'undefined') {
            console.error('CommonModule chưa được tải. Đang tải trực tiếp dữ liệu...');
            // Vẫn tiếp tục tải dữ liệu ngay lập tức thay vì đợi
            loadTeacherProfile();
            loadStatistics();
            loadCurrentCourses();
            
            // Xóa placeholder loading nếu có
            const loadingPlaceholder = document.querySelector('.loading-placeholder');
            if (loadingPlaceholder) {
                loadingPlaceholder.style.display = 'none';
            }
            
            return;
        }
        
        // Hiển thị trạng thái loading
        try {
            CommonModule.toggleLoading(document.querySelector('.dashboard-content'), true);
            
            // Mô phỏng yêu cầu API
            setTimeout(() => {
                loadTeacherProfile();
                loadStatistics();
                loadCurrentCourses();
                
                // Ẩn trạng thái loading
                CommonModule.toggleLoading(document.querySelector('.dashboard-content'), false);
            }, 1000);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dashboard:', error);
            // Nếu có lỗi vẫn tiếp tục tải dữ liệu
            loadTeacherProfile();
            loadStatistics();
            loadCurrentCourses();
            
            // Xóa placeholder loading nếu có
            const loadingPlaceholder = document.querySelector('.loading-placeholder');
            if (loadingPlaceholder) {
                loadingPlaceholder.style.display = 'none';
            }
        }
    }
    
    /**
     * Tải thông tin hồ sơ giáo viên
     */
    function loadTeacherProfile() {
        // Mô phỏng dữ liệu từ API
        data.currentTeacher = {
            id: 'T12345',
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.edu.vn',
            department: 'Khoa Công nghệ Thông tin',
            position: 'Giảng viên',
            avatar: 'assets/images/user.jpg', // Thay bằng đường dẫn thực tế
            lastLogin: new Date()
        };
        
        // Cập nhật giao diện người dùng
        updateTeacherProfileUI();
    }
    
    /**
     * Cập nhật giao diện hồ sơ giáo viên
     */
    function updateTeacherProfileUI() {
        const teacher = data.currentTeacher;
        if (!teacher) return;
        
        // Cập nhật tên giáo viên
        const teacherNameEl = document.getElementById('teacherName');
        if (teacherNameEl) {
            teacherNameEl.textContent = teacher.name;
        }
        
        // Cập nhật thông tin giáo viên trong welcome card
        const welcomeCardEl = document.querySelector('.welcome-card');
        if (welcomeCardEl) {
            const welcomeContentEl = welcomeCardEl.querySelector('.welcome-content');
            if (welcomeContentEl) {
                welcomeContentEl.innerHTML = `
                    <h4>Xin chào, ${teacher.name}!</h4>
                    <p>Chức vụ: ${teacher.position}</p>
                    <p>Khoa: ${teacher.department}</p>
                    <p>Đăng nhập lần cuối: ${CommonModule.formatDateTime(teacher.lastLogin)}</p>
                `;
            }
            
            const welcomeAvatarEl = welcomeCardEl.querySelector('.welcome-avatar img');
            if (welcomeAvatarEl && teacher.avatar) {
                welcomeAvatarEl.src = teacher.avatar;
                welcomeAvatarEl.alt = teacher.name;
            }
        }
    }
    
    /**
     * Tải dữ liệu thống kê
     */
    function loadStatistics() {
        // Trong ứng dụng thực tế, bạn sẽ gửi request đến API để lấy dữ liệu
        // từ CSDL. Dưới đây là mô phỏng với dữ liệu mẫu.
        
        // Mô phỏng dữ liệu từ API dựa trên cấu trúc CSDL
        const stats = {
            lectures: 0,    // Số bài giảng (type = 'baigiang')
            quizzes: 0,     // Số bài kiểm tra (type = 'baikiemtra')
            exams: 0,       // Số bài thi (type = 'baithi')
            students: 0     // Số sinh viên đã đăng ký khóa học
        };
        
        // Trong môi trường thực tế, bạn sẽ thực hiện các truy vấn SQL sau:
        // 1. Đếm bài giảng: SELECT COUNT(*) FROM Lecture WHERE teacher_id = ? AND type = 'baigiang'
        // 2. Đếm bài kiểm tra: SELECT COUNT(*) FROM Lecture WHERE teacher_id = ? AND type = 'baikiemtra'
        // 3. Đếm bài thi: SELECT COUNT(*) FROM Lecture WHERE teacher_id = ? AND type = 'baithi'
        // 4. Đếm sinh viên: SELECT COUNT(DISTINCT user_id) FROM StudentEnrollment 
        //    WHERE course_id IN (SELECT course_id FROM Lecture WHERE teacher_id = ?)
        
        // Mô phỏng kết quả truy vấn
        stats.lectures = 24;   // Số bài giảng
        stats.quizzes = 8;     // Số bài kiểm tra
        stats.exams = 4;       // Số bài thi
        stats.students = 128;  // Số sinh viên
        
        // Lưu dữ liệu thống kê
        Object.assign(data, stats);
        
        // Cập nhật giao diện thống kê
        updateStatisticsUI(stats);
    }
    
    /**
     * Cập nhật giao diện thống kê
     * @param {Object} stats - Dữ liệu thống kê
     */
    function updateStatisticsUI(stats) {
        // Cập nhật các thẻ thống kê
        
        // Số bài giảng
        const lecturesCountEl = document.querySelector('[data-stat="lectures"]');
        if (lecturesCountEl) {
            lecturesCountEl.textContent = stats.lectures;
        }
        
        // Số bài kiểm tra
        const quizzesCountEl = document.querySelector('[data-stat="quizzes"]');
        if (quizzesCountEl) {
            quizzesCountEl.textContent = stats.quizzes;
        }
        
        // Số bài thi
        const examsCountEl = document.querySelector('[data-stat="exams"]');
        if (examsCountEl) {
            examsCountEl.textContent = stats.exams;
        }
        
        // Số sinh viên
        const studentsCountEl = document.querySelector('[data-stat="students"]');
        if (studentsCountEl) {
            studentsCountEl.textContent = stats.students;
        }
    }
    
    /**
     * Tải danh sách khóa học đang dạy
     */
    function loadCurrentCourses() {
        // Trong môi trường thực tế, đây sẽ là truy vấn SQL:
        // SELECT c.course_id, c.course_name, c.type, s.subject_name, 
        //        COUNT(DISTINCT se.user_id) as student_count,
        //        COUNT(l.lecture_id) as lecture_count,
        //        MAX(l.created_at) as upload_date
        // FROM Course c
        // JOIN Subjects s ON c.subject_id = s.subject_id
        // LEFT JOIN StudentEnrollment se ON c.course_id = se.course_id
        // LEFT JOIN Lecture l ON c.course_id = l.course_id AND l.teacher_id = ?
        // WHERE EXISTS (SELECT 1 FROM Lecture WHERE course_id = c.course_id AND teacher_id = ?)
        // GROUP BY c.course_id, c.course_name, c.type, s.subject_name
        
        // Mô phỏng dữ liệu từ API
        const coursesData = [
            {
                id: 1,
                name: 'Khóa học OOP nâng cao',
                subject: 'Lập trình hướng đối tượng',
                type: 'tuantu',
                typeLabel: 'Tuần tự',
                students: 45,
                lectures: 12,
                uploadDate: '2025-05-15'
            },
            {
                id: 3,
                name: 'SQL cơ bản và nâng cao',
                subject: 'Cơ sở dữ liệu',
                type: 'tudo',
                typeLabel: 'Tự do',
                students: 38,
                lectures: 8,
                uploadDate: '2025-06-01'
            },
            {
                id: 5,
                name: 'Web Development với HTML, CSS và JavaScript',
                subject: 'Lập trình Web',
                type: 'tuantu',
                typeLabel: 'Tuần tự',
                students: 42,
                lectures: 10,
                uploadDate: '2025-05-20'
            },
            {
                id: 6,
                name: 'Phân tích và thiết kế CSDL',
                subject: 'Cơ sở dữ liệu',
                type: 'tuantu',
                typeLabel: 'Tuần tự',
                students: 35,
                lectures: 6,
                uploadDate: '2025-06-10'
            }
        ];
        
        // Lưu dữ liệu vào biến data
        data.myCourses = coursesData;
        
        // Cập nhật giao diện
        updateCurrentCoursesUI(coursesData);
    }
    
    /**
     * Cập nhật giao diện khóa học đang dạy
     * @param {Array} courses - Danh sách khóa học
     */
    function updateCurrentCoursesUI(courses) {
        const coursesContainer = document.getElementById('currentCourses');
        if (!coursesContainer) return;
        
        let coursesHTML = '';
        
        if (courses.length === 0) {
            coursesContainer.innerHTML = '<div class="empty-state">Không có khóa học nào.</div>';
            return;
        }
        
        courses.forEach(course => {
            // Định dạng ngày tải lên
            const uploadDate = new Date(course.uploadDate).toLocaleDateString('vi-VN');
            
            coursesHTML += `
                <div class="course-card" data-id="${course.id}">
                    <div class="course-header">
                        <h3>${course.name}</h3>
                        <span class="course-type">${course.typeLabel}</span>
                    </div>
                    <div class="course-body">
                        <div class="course-info">
                            <div><i class="fas fa-book"></i> ${course.subject}</div>
                            <div><i class="fas fa-users"></i> ${course.students} sinh viên</div>
                            <div><i class="fas fa-file-alt"></i> ${course.lectures} bài giảng</div>
                            <div><i class="fas fa-calendar-plus"></i> Ngày tải lên: ${uploadDate}</div>
                        </div>
                    </div>
                    <div class="course-footer">
                        <button class="course-action" data-action="view" data-id="${course.id}">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="course-action" data-action="edit" data-id="${course.id}">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </button>
                    </div>
                </div>
            `;
        });
        
        coursesContainer.innerHTML = coursesHTML;
        
        // Thêm sự kiện cho các nút
        setupCourseActionButtons();
    }
    
    /**
     * Thiết lập sự kiện cho các nút hành động trên khóa học
     */
    function setupCourseActionButtons() {
        // Lấy tất cả các nút hành động
        const actionButtons = document.querySelectorAll('.course-action');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const courseId = this.getAttribute('data-id');
                const action = this.getAttribute('data-action');
                
                // Xử lý hành động tương ứng
                if (action === 'view') {
                    // Chuyển đến trang chi tiết khóa học
                    window.location.href = `pages/lectures.html?course=${courseId}`;
                } else if (action === 'edit') {
                    // Chuyển đến trang chỉnh sửa khóa học
                    window.location.href = `pages/lectures.html?course=${courseId}&edit=true`;
                }
            });
        });
        
        // Thêm sự kiện click cho toàn bộ khóa học card
        const courseCards = document.querySelectorAll('.course-card');
        courseCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Chỉ kích hoạt khi click vào phần không phải là nút
                if (!e.target.closest('.course-action')) {
                    const courseId = this.getAttribute('data-id');
                    window.location.href = `pages/lectures.html?course=${courseId}`;
                }
            });
        });
    }
    
    // API công khai
    return {
        init: init
    };
})();

// Tự động khởi tạo module khi được tải
document.addEventListener('DOMContentLoaded', function() {
    DashboardModule.init();
}); 