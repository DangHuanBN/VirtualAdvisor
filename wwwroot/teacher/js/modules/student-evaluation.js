/**
 * Module quản lý đánh giá sinh viên
 */
const StudentEvaluationModule = (function() {
    // Cấu hình API
    const API_URL = '/api';
    
    // Lấy thông tin người dùng đã đăng nhập
    const getCurrentUser = () => {
        try {
            const userJson = localStorage.getItem('user');
            if (!userJson) {
                console.warn("Không tìm thấy thông tin người dùng trong localStorage");
                return null;
            }
            
            const user = JSON.parse(userJson);
            
            // Đảm bảo userId là kiểu số
            if (user && user.userId) {
                // Chuyển đổi userId sang kiểu số nếu nó là chuỗi
                if (typeof user.userId === 'string') {
                    console.log(`Chuyển đổi userId từ chuỗi "${user.userId}" sang số`);
                    user.userId = parseInt(user.userId, 10);
                }
                
                // Ghi log thông tin ID
                console.log(`Trả về userId: ${user.userId} (${typeof user.userId})`);
            }
            
            return user;
        } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            return null;
        }
    };
    
    // Lấy token xác thực
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    /**
     * Hiển thị thông tin giảng viên
     */
    function displayTeacherInfo() {
        const teacherNameElement = document.getElementById('teacherName');
        if (!teacherNameElement) return;

        const currentUser = getCurrentUser();
        if (currentUser && currentUser.fullName) {
            teacherNameElement.textContent = currentUser.fullName;
        } else {
            teacherNameElement.textContent = 'Chưa đăng nhập';
        }
    }

    /**
     * Xử lý đăng xuất
     */
    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Sử dụng hàm logout từ API
                if (typeof AuthAPI !== 'undefined' && AuthAPI.logout) {
                    AuthAPI.logout();
                } else {
                    // Fallback nếu không có AuthAPI
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            });
        }
    }

    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Module đánh giá sinh viên đã được khởi tạo');
        
        // Kiểm tra chi tiết về người dùng đã đăng nhập
        console.log('Kiểm tra thông tin người dùng trong localStorage...');
        const userJson = localStorage.getItem('user');
        console.log('Dữ liệu thô từ localStorage:', userJson);
        
        try {
            if (userJson) {
                const userObj = JSON.parse(userJson);
                console.log('Dữ liệu người dùng đã parse:', userObj);
                console.log('UserID:', userObj.userId);
                console.log('Tên người dùng:', userObj.fullName);
                console.log('Vai trò:', userObj.role);
                
                // Kiểm tra cấu trúc dữ liệu
                if (typeof userObj.userId !== 'number') {
                    console.warn('Chú ý: userId không phải là kiểu số!', typeof userObj.userId);
                }
                
                // Kiểm tra toàn bộ dữ liệu người dùng
                console.log('Chi tiết đầy đủ người dùng:', JSON.stringify(userObj, null, 2));
            } else {
                console.warn('Không tìm thấy thông tin người dùng trong localStorage');
            }
        } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
        }
        
        // Kiểm tra người dùng bằng hàm getCurrentUser
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('Người dùng đã đăng nhập:', currentUser.fullName);
            console.log('ID người dùng:', currentUser.userId);
            console.log('Vai trò:', currentUser.role);
        } else {
            console.warn('Người dùng chưa đăng nhập!');
        }
        
        displayTeacherInfo();
        setupLogout();
        setupEventListeners();
        setupTabSwitching();
        loadSubjects();
        loadHistoryFilters();
    }

    /**
     * Thiết lập các sự kiện lắng nghe
     */
    function setupEventListeners() {
        // Lắng nghe sự kiện thay đổi môn học
        const subjectSelect = document.getElementById('subjectSelect');
        if (subjectSelect) {
            subjectSelect.addEventListener('change', function() {
                loadCourses(subjectSelect.value);
            });
        }

        // Lắng nghe sự kiện thay đổi khóa học
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) {
            courseSelect.addEventListener('change', function() {
                loadStudents(courseSelect.value);
            });
        }

        // Lắng nghe sự kiện submit form đánh giá
        const evaluationForm = document.getElementById('studentEvaluationForm');
        if (evaluationForm) {
            evaluationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveFeedback();
            });
        }

        // Lắng nghe sự kiện thay đổi bộ lọc lịch sử
        const historyFilters = document.querySelectorAll('#historySubject, #historyCourse, #historyStudent, #historyType, #historyStatus');
        historyFilters.forEach(filter => {
            filter.addEventListener('change', function() {
                loadHistoryData();
            });
        });

        // Lắng nghe sự kiện chuyển tab
        const historyTab = document.querySelector('.tab[data-tab="evaluation-history"]');
        if (historyTab) {
            historyTab.addEventListener('click', function() {
                loadHistoryData();
            });
        }

        // Lắng nghe sự kiện thay đổi môn học trong bộ lọc lịch sử
        const historySubject = document.getElementById('historySubject');
        if (historySubject) {
            historySubject.addEventListener('change', function() {
                loadHistoryCourses(historySubject.value);
            });
        }

        // Lắng nghe sự kiện thay đổi khóa học trong bộ lọc lịch sử
        const historyCourse = document.getElementById('historyCourse');
        if (historyCourse) {
            historyCourse.addEventListener('change', function() {
                loadHistoryStudents(historyCourse.value);
            });
        }
    }

    /**
     * Thiết lập chuyển đổi tab
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');

                // Xóa active class từ tất cả tabs và tab contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Thêm active class vào tab và content được chọn
                this.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    /**
     * Tải danh sách môn học từ API
     */
    async function loadSubjects() {
        try {
            const response = await fetch(`${API_URL}/subjects`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách môn học');
            }

            const data = await response.json();
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            const subjectSelect = document.getElementById('subjectSelect');
            if (!subjectSelect) return;

            // Xóa tất cả các option cũ trừ option mặc định đầu tiên
            subjectSelect.innerHTML = '<option value="">-- Chọn môn học --</option>';

            // Thêm các môn học mới
            data.data.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                subjectSelect.appendChild(option);
            });

            // Reset các select khác
            const courseSelect = document.getElementById('courseSelect');
            const studentSelect = document.getElementById('studentSelect');
            
            if (courseSelect) {
                courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
                courseSelect.disabled = true;
            }
            
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                studentSelect.disabled = true;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách môn học:', error);
        }
    }

    /**
     * Tải danh sách khóa học từ API dựa trên môn học đã chọn
     */
    async function loadCourses(subjectId) {
        if (!subjectId) {
            const courseSelect = document.getElementById('courseSelect');
            const studentSelect = document.getElementById('studentSelect');
            
            if (courseSelect) {
                courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';
                courseSelect.disabled = true;
            }
            
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                studentSelect.disabled = true;
            }
            
            return;
        }

        try {
            console.log(`Đang gọi API: ${API_URL}/courses/by-subject/${subjectId}`);
            const response = await fetch(`${API_URL}/courses/by-subject/${subjectId}`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách khóa học');
            }

            const data = await response.json();
            console.log('Dữ liệu khóa học nhận được:', data);
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            const courseSelect = document.getElementById('courseSelect');
            if (!courseSelect) return;

            // Xóa tất cả các option cũ
            courseSelect.innerHTML = '<option value="">-- Chọn khóa học --</option>';

            // Thêm các khóa học mới
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });

            // Bật select
            courseSelect.disabled = false;

            // Reset student select
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                studentSelect.disabled = true;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách khóa học:', error);
        }
    }

    /**
     * Tải danh sách sinh viên từ API dựa trên khóa học đã chọn
     */
    async function loadStudents(courseId) {
        if (!courseId) {
            const studentSelect = document.getElementById('studentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
                studentSelect.disabled = true;
            }
            return;
        }

        try {
            const response = await fetch(`${API_URL}/feedback/students/${courseId}`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách sinh viên');
            }

            const data = await response.json();
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            const studentSelect = document.getElementById('studentSelect');
            if (!studentSelect) return;

            // Xóa tất cả các option cũ
            studentSelect.innerHTML = '<option value="">-- Chọn sinh viên --</option>';

            // Thêm các sinh viên mới
            data.data.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.fullName;
                studentSelect.appendChild(option);
            });

            // Bật select
            studentSelect.disabled = false;
        } catch (error) {
            console.error('Lỗi khi tải danh sách sinh viên:', error);
        }
    }

    /**
     * Lưu đánh giá sinh viên
     */
    async function saveFeedback() {
        const subjectSelect = document.getElementById('subjectSelect');
        const courseSelect = document.getElementById('courseSelect');
        const studentSelect = document.getElementById('studentSelect');
        const evaluationContent = document.getElementById('evaluationContent');
        const rating = document.querySelector('input[name="rating"]:checked');

        if (!subjectSelect || !courseSelect || !studentSelect || !evaluationContent) return;

        // Kiểm tra dữ liệu nhập vào
        if (!subjectSelect.value || !courseSelect.value || !studentSelect.value || !evaluationContent.value) {
            alert('Vui lòng điền đầy đủ thông tin đánh giá');
            return;
        }

        if (!rating) {
            alert('Vui lòng chọn số sao đánh giá');
            return;
        }

        try {
            // Lấy ID của giảng viên đang đăng nhập
            const currentUser = getCurrentUser();
            if (!currentUser || currentUser.role !== 'Teacher') {
                alert('Bạn cần đăng nhập với tư cách giảng viên để thực hiện chức năng này.');
                return;
            }
            
            console.log("Thông tin người dùng hiện tại:", currentUser);
            console.log("ID người dùng trước khi gửi:", currentUser.userId);

            // Đảm bảo ID là số nguyên hợp lệ
            let teacherId = currentUser.userId;
            if (typeof teacherId === 'string') {
                teacherId = parseInt(teacherId, 10);
                console.log("Đã chuyển đổi ID từ chuỗi sang số:", teacherId);
            }
            
            if (isNaN(teacherId) || teacherId <= 0) {
                console.error("ID giảng viên không hợp lệ:", teacherId);
                alert('Không thể xác định ID giảng viên. Vui lòng đăng nhập lại.');
                return;
            }

            const feedbackData = {
                subjectId: parseInt(subjectSelect.value),
                courseId: parseInt(courseSelect.value),
                studentId: parseInt(studentSelect.value),
                soSao: parseInt(rating.value),
                noiDung: evaluationContent.value
            };

            // Đảm bảo gửi đúng ID của giảng viên trong header
            const token = getAuthToken();
            console.log("ID giảng viên sẽ gửi trong header:", teacherId);
            
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'X-Teacher-Id': teacherId.toString()
                },
                body: JSON.stringify(feedbackData)
            });

            const data = await response.json();

            if (!data.success) {
                alert(`Lỗi: ${data.message}`);
                return;
            }

            alert('Đã lưu đánh giá thành công!');

            // Reset form
            document.getElementById('studentEvaluationForm').reset();
            courseSelect.disabled = true;
            studentSelect.disabled = true;

            // Nếu đang ở tab lịch sử, cập nhật dữ liệu
            const historyTab = document.querySelector('.tab[data-tab="evaluation-history"]');
            if (historyTab.classList.contains('active')) {
                loadHistoryData();
            }
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error);
            alert('Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.');
        }
    }

    /**
     * Tải bộ lọc lịch sử đánh giá
     */
    async function loadHistoryFilters() {
        try {
            // Tải danh sách môn học cho bộ lọc
            const response = await fetch(`${API_URL}/subjects`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách môn học');
            }

            const data = await response.json();
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            const historySubject = document.getElementById('historySubject');
            if (historySubject) {
                // Giữ lại option mặc định
                historySubject.innerHTML = '<option value="">Tất cả môn học</option>';

                // Thêm các môn học
                data.data.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = subject.name;
                    historySubject.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải bộ lọc lịch sử:', error);
        }
    }

    /**
     * Tải danh sách khóa học cho bộ lọc lịch sử
     */
    async function loadHistoryCourses(subjectId) {
        const historyCourse = document.getElementById('historyCourse');
        if (!historyCourse) return;

        // Reset lựa chọn
        historyCourse.innerHTML = '<option value="">Tất cả khóa học</option>';
        
        if (!subjectId) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/courses/by-subject/${subjectId}`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách khóa học');
            }

            const data = await response.json();
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            // Thêm các khóa học
            data.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                historyCourse.appendChild(option);
            });

            // Reset bộ lọc sinh viên
            const historyStudent = document.getElementById('historyStudent');
            if (historyStudent) {
                historyStudent.innerHTML = '<option value="">Tất cả sinh viên</option>';
            }

            // Tải lại dữ liệu lịch sử
            loadHistoryData();
        } catch (error) {
            console.error('Lỗi khi tải danh sách khóa học cho bộ lọc:', error);
        }
    }

    /**
     * Tải danh sách sinh viên cho bộ lọc lịch sử
     */
    async function loadHistoryStudents(courseId) {
        const historyStudent = document.getElementById('historyStudent');
        if (!historyStudent) return;

        // Reset lựa chọn
        historyStudent.innerHTML = '<option value="">Tất cả sinh viên</option>';
        
        if (!courseId) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/feedback/students/${courseId}`);
            if (!response.ok) {
                throw new Error('Lỗi khi tải danh sách sinh viên');
            }

            const data = await response.json();
            if (!data.success) {
                console.error('Lỗi:', data.message);
                return;
            }

            // Thêm các sinh viên
            data.data.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.fullName;
                historyStudent.appendChild(option);
            });

            // Tải lại dữ liệu lịch sử
            loadHistoryData();
        } catch (error) {
            console.error('Lỗi khi tải danh sách sinh viên cho bộ lọc:', error);
        }
    }

    /**
     * Tải dữ liệu lịch sử đánh giá dựa trên bộ lọc
     */
    async function loadHistoryData() {
        const historySubject = document.getElementById('historySubject');
        const historyCourse = document.getElementById('historyCourse');
        const historyStudent = document.getElementById('historyStudent');
        const historyType = document.getElementById('historyType');
        const historyStatus = document.getElementById('historyStatus');
        
        if (!historySubject || !historyCourse || !historyStudent || !historyType || !historyStatus) {
            return;
        }

        try {
            // Xây dựng query string từ bộ lọc
            const filters = [];
            if (historySubject.value) filters.push(`subjectId=${historySubject.value}`);
            if (historyCourse.value) filters.push(`courseId=${historyCourse.value}`);
            if (historyStudent.value) filters.push(`studentId=${historyStudent.value}`);
            if (historyType.value) filters.push(`type=${historyType.value}`);
            if (historyStatus.value) filters.push(`status=${historyStatus.value}`);
            
            const queryString = filters.length > 0 ? `?${filters.join('&')}` : '';
            
            // Chúng ta có thể cần tạo thêm API endpoint cho việc này
            // Ví dụ: /api/feedback/history
            const response = await fetch(`${API_URL}/feedback/history${queryString}`);
            
            if (!response.ok) {
                // Nếu API chưa có, hiển thị thông báo
                console.warn('API lịch sử đánh giá chưa được triển khai');
                return;
            }

            const data = await response.json();
            
            // Hiển thị dữ liệu vào bảng
            const tbody = document.querySelector('.data-table tbody');
            if (!tbody) return;
            
            if (!data.success || !data.data || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">Không có dữ liệu</td></tr>';
                return;
            }
            
            // Hiển thị dữ liệu
            tbody.innerHTML = '';
            data.data.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.subjectName}</td>
                    <td>${item.courseName}</td>
                    <td>${item.studentName}</td>
                    <td>${item.type || 'Đánh giá chung'}</td>
                    <td>${item.diem}</td>
                    <td>
                        <div class="progress-wrapper">
                            <span>${item.progress || 'N/A'}</span>
                            ${item.progress ? `
                                <div class="progress-bar-container">
                                    <div class="progress-bar" style="width: ${item.progress}%"></div>
                                </div>
                            ` : ''}
                        </div>
                    </td>
                    <td>
                        ${item.status ? 
                            `<span class="status-complete">Hoàn thành</span>` : 
                            `<span class="status-incomplete">Chưa hoàn thành</span>`
                        }
                    </td>
                    <td>${new Date(item.timestamp).toLocaleDateString('vi-VN')}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${item.feedbackId}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Thêm sự kiện cho nút xem chi tiết
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const feedbackId = btn.getAttribute('data-id');
                    // Hiển thị chi tiết đánh giá - phần này có thể triển khai sau
                    console.log(`Xem chi tiết đánh giá ID: ${feedbackId}`);
                });
            });
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu lịch sử:', error);
            
            // Hiển thị thông báo lỗi
            const tbody = document.querySelector('.data-table tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center">Lỗi khi tải dữ liệu</td></tr>';
            }
        }
    }

    // API công khai
    return {
        init: init
    };
})();

// Tự động khởi tạo module khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    StudentEvaluationModule.init();
}); 