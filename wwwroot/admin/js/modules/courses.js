/**
 * Module quản lý khóa học
 */
(function() {
    // Các biến toàn cục
    let courses = [];
    let courseSubjects = []; // Đổi tên biến để tránh xung đột
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    let searchTimeout;
    let selectedSubjectId = ''; // Thêm biến để lưu môn học được chọn

    // Hàm khởi tạo module
    function initCoursesModule() {
        console.log("Initializing courses module...");
        setupEventHandlers();
        loadSubjectsForCourses();
        loadCourses();
    }

    // Thiết lập các event handler
    function setupEventHandlers() {
        console.log("Setting up event handlers for courses module...");
        // Nút thêm khóa học mới
        const addCourseBtn = document.getElementById('add-course-btn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => showCourseModal());
        } else {
            console.error("Không tìm thấy nút thêm khóa học");
        }
        
        // Xử lý tìm kiếm realtime
        const searchInput = document.querySelector('#courses-tab .search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                const query = this.value.trim();
                
                searchTimeout = setTimeout(() => {
                    currentPage = 1;
                    loadCourses(query, selectedSubjectId);
                }, 300);
            });
        }

        // Xử lý dropdown lọc theo môn học
        const subjectFilter = document.getElementById('subject-filter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', function() {
                selectedSubjectId = this.value;
                currentPage = 1;
                const query = document.querySelector('#courses-tab .search-box input')?.value?.trim() || '';
                loadCourses(query, selectedSubjectId);
            });
        }
        
        // Xử lý nút phân trang
        const pagination = document.querySelector('#courses-tab .pagination');
        if (pagination) {
            pagination.addEventListener('click', (e) => {
                if (e.target.classList.contains('page-btn')) {
                    if (e.target.classList.contains('prev')) {
                        if (currentPage > 1) currentPage--;
                    } else if (e.target.classList.contains('next')) {
                        if (currentPage < totalPages) currentPage++;
                    } else {
                        const page = parseInt(e.target.textContent);
                        if (!isNaN(page)) currentPage = page;
                    }
                    
                    const query = document.querySelector('#courses-tab .search-box input')?.value?.trim() || '';
                    loadCourses(query, selectedSubjectId);
                }
            });
        }
        
        // Xử lý checkbox chọn tất cả
        const selectAllCheckbox = document.getElementById('select-all-courses');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('#courses-table tbody .select-item');
                checkboxes.forEach(checkbox => checkbox.checked = this.checked);
            });
        }
    }

    // Tải danh sách môn học cho dropdown
    async function loadSubjectsForCourses() {
        console.log("Loading subjects for courses...");
        try {
            const response = await fetch('/api/Subjects');
            
            if (!response.ok) {
                throw new Error('Không thể tải danh sách môn học');
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                courseSubjects = result.data;
                console.log(`Đã tải ${courseSubjects.length} môn học`);
                
                // Cập nhật dropdown lọc môn học
                const subjectFilter = document.getElementById('subject-filter');
                if (subjectFilter) {
                    // Giữ lại option "Tất cả môn học"
                    subjectFilter.innerHTML = '<option value="">Tất cả môn học</option>';
                    
                    // Thêm các môn học vào dropdown
                    courseSubjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.id;
                        option.textContent = subject.name;
                        subjectFilter.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách môn học:', error);
            showNotification('error', 'Lỗi', error.message);
        }
    }

    // Tải danh sách khóa học
    async function loadCourses(searchQuery = '', subjectId = '') {
        console.log(`Loading courses with query: "${searchQuery}", subjectId: "${subjectId}"`);
        showLoading(true);
        
        try {
            let url = '/api/Courses';
            
            // Tùy chỉnh URL dựa trên tham số tìm kiếm
            if (searchQuery && subjectId) {
                // Tìm kiếm kết hợp theo tên và môn học
                url = `/api/Courses/search?name=${encodeURIComponent(searchQuery)}&subjectId=${subjectId}`;
            } else if (searchQuery) {
                // Chỉ tìm kiếm theo tên
                url = `/api/Courses/search?name=${encodeURIComponent(searchQuery)}`;
            } else if (subjectId) {
                // Chỉ lọc theo môn học
                url = `/api/Courses/by-subject/${subjectId}`;
            }
            
            console.log(`Fetching from URL: ${url}`);
            
            // Thêm token xác thực nếu cần
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, {
                headers: headers
            });
            
            console.log(`Response status: ${response.status}`);
            
            // Xử lý lỗi 401 - Unauthorized
            if (response.status === 401) {
                showNotification('error', 'Lỗi', 'Bạn không có quyền truy cập dữ liệu khóa học. Vui lòng đăng nhập lại với quyền admin.');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Không thể tải danh sách khóa học');
            }
            
            const result = await response.json();
            console.log('API result:', result);
            
            if (result.success && result.data) {
                courses = result.data;
                console.log(`Đã tải ${courses.length} khóa học`);
                await updatePagination();
                renderCoursesList();
            } else {
                showNotification('error', 'Lỗi', result.message || 'Lỗi khi tải danh sách khóa học');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('error', 'Lỗi', error.message);
        } finally {
            showLoading(false);
        }
    }

    // Cập nhật phân trang
    async function updatePagination() {
        try {
            // Tính toán tổng số trang dựa trên tổng số khóa học
            const response = await fetch('/api/Courses/count');
            
            const result = await response.json();
            
            if (result.success && result.data !== undefined) {
                const totalItems = result.data;
                totalPages = Math.ceil(totalItems / pageSize);
                
                // Hiển thị phân trang
                const paginationContainer = document.querySelector('#courses-tab .pagination');
                let paginationHTML = `
                    <button class="page-btn prev${currentPage === 1 ? ' disabled' : ''}"><i class="fas fa-chevron-left"></i></button>
                `;
                
                for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                        paginationHTML += `<button class="page-btn${i === currentPage ? ' active' : ''}">${i}</button>`;
                    } else if (i === currentPage - 2 || i === currentPage + 2) {
                        paginationHTML += `<span>...</span>`;
                    }
                }
                
                paginationHTML += `
                    <button class="page-btn next${currentPage === totalPages ? ' disabled' : ''}"><i class="fas fa-chevron-right"></i></button>
                `;
                
                paginationContainer.innerHTML = paginationHTML;
            }
        } catch (error) {
            console.error('Lỗi khi lấy tổng số khóa học:', error);
        }
    }

    // Hiển thị danh sách khóa học
    function renderCoursesList() {
        const tableBody = document.querySelector('#courses-table tbody');
        tableBody.innerHTML = '';
        
        // Tính các mục cần hiển thị trên trang hiện tại
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, courses.length);
        const currentPageItems = courses.slice(startIndex, endIndex);
        
        if (currentPageItems.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Không có dữ liệu</td>
                </tr>
            `;
            return;
        }
        
        currentPageItems.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="select-item"></td>
                <td>${course.id}</td>
                <td>${course.name}</td>
                <td>${course.subjectName}</td>
                <td>${course.type === 'tuantu' ? 'Tuần tự' : 'Tự do'}</td>
                <td>${course.lecturesCount}</td>
                <td class="action-cell">
                    <button class="action-btn view-btn" title="Xem chi tiết" onclick="viewCourse(${course.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Chỉnh sửa" onclick="editCourse(${course.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Xóa" onclick="deleteCourse(${course.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Hiển thị modal khóa học (thêm/sửa)
    function showCourseModal(courseId = null) {
        // Tạo modal nếu chưa tồn tại
        let modal = document.getElementById('course-modal');
        
        if (!modal) {
            const modalHTML = `
                <div class="modal" id="course-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="course-modal-title"><i class="fas fa-graduation-cap"></i> Thêm khóa học mới</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="course-form">
                                <input type="hidden" id="course-id">
                <div class="form-group">
                                    <label for="course-name">
                                        <i class="fas fa-graduation-cap"></i> Tên khóa học
                                    </label>
                                    <input type="text" id="course-name" class="form-control" required placeholder="Nhập tên khóa học">
                                    <div class="error-message" id="name-error"></div>
                </div>
                <div class="form-group">
                                    <label for="course-subject">
                                        <i class="fas fa-book-open"></i> Môn học
                                    </label>
                                    <select id="course-subject" class="form-control" required>
                                        <option value="">-- Chọn môn học --</option>
                                        ${courseSubjects.map(subject => `<option value="${subject.id}">${subject.name}</option>`).join('')}
                    </select>
                                    <div class="error-message" id="subject-error"></div>
                </div>
                <div class="form-group">
                                    <label for="course-type">
                                        <i class="fas fa-list-ul"></i> Loại khóa học
                                    </label>
                                    <select id="course-type" class="form-control" required>
                        <option value="tuantu">Tuần tự</option>
                        <option value="tudo">Tự do</option>
                    </select>
                                    <div class="error-message" id="type-error"></div>
                </div>
                            </form>
                </div>
                        <div class="modal-footer">
                            <button class="secondary-btn" id="cancel-course-btn">
                                <i class="fas fa-times"></i> Hủy
                            </button>
                            <button class="primary-btn" id="save-course-btn">
                                <i class="fas fa-save"></i> Lưu
                            </button>
                </div>
                </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('course-modal');
            
            // Thiết lập sự kiện cho modal
            modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            document.getElementById('cancel-course-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            document.getElementById('save-course-btn').addEventListener('click', saveCourse);
            
            // Xử lý đóng modal khi click ra ngoài
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        } else {
            // Cập nhật danh sách môn học trong dropdown
            const subjectDropdown = document.getElementById('course-subject');
            subjectDropdown.innerHTML = `
                <option value="">-- Chọn môn học --</option>
                ${courseSubjects.map(subject => `<option value="${subject.id}">${subject.name}</option>`).join('')}
            `;
        }
        
        // Đặt tiêu đề và dữ liệu cho modal
        const modalTitle = document.getElementById('course-modal-title');
        const courseIdInput = document.getElementById('course-id');
        const courseNameInput = document.getElementById('course-name');
        const courseSubjectInput = document.getElementById('course-subject');
        const courseTypeInput = document.getElementById('course-type');
        
        // Xóa thông báo lỗi
        document.getElementById('name-error').textContent = '';
        document.getElementById('subject-error').textContent = '';
        document.getElementById('type-error').textContent = '';
        
        if (courseId) {
            // Chế độ chỉnh sửa
            modalTitle.textContent = 'Chỉnh sửa khóa học';
            const course = courses.find(c => c.id === courseId);
            
            if (course) {
                courseIdInput.value = course.id;
                courseNameInput.value = course.name;
                courseSubjectInput.value = course.subjectId;
                courseTypeInput.value = course.type;
            }
        } else {
            // Chế độ thêm mới
            modalTitle.textContent = 'Thêm khóa học mới';
            courseIdInput.value = '';
            courseNameInput.value = '';
            courseSubjectInput.value = '';
            courseTypeInput.value = 'tuantu';
        }
        
        // Hiển thị modal
        modal.style.display = 'block';
    }

    // Lưu khóa học (thêm mới hoặc cập nhật)
    async function saveCourse() {
        // Lấy dữ liệu từ form
        const courseId = document.getElementById('course-id').value;
        const courseName = document.getElementById('course-name').value.trim();
        const courseSubjectId = parseInt(document.getElementById('course-subject').value);
        const courseType = document.getElementById('course-type').value;
        
        // Xóa thông báo lỗi
        document.getElementById('name-error').textContent = '';
        document.getElementById('subject-error').textContent = '';
        document.getElementById('type-error').textContent = '';
        
        // Validate dữ liệu
        let isValid = true;
        
        if (!courseName) {
            document.getElementById('name-error').textContent = 'Vui lòng nhập tên khóa học';
            isValid = false;
        }
        
        if (isNaN(courseSubjectId) || courseSubjectId <= 0) {
            document.getElementById('subject-error').textContent = 'Vui lòng chọn môn học';
            isValid = false;
        }
        
        if (!courseType) {
            document.getElementById('type-error').textContent = 'Vui lòng chọn loại khóa học';
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Chuẩn bị dữ liệu
        const courseData = {
            name: courseName,
            subjectId: courseSubjectId,
            type: courseType
        };
        
        if (courseId && courseId !== '0') {
            courseData.id = parseInt(courseId);
        }
        
        try {
            const isEditing = courseId && courseId !== '0';
            const url = isEditing ? `/api/Courses/${courseId}` : '/api/Courses';
            const method = isEditing ? 'PUT' : 'POST';
            
            // Thêm token xác thực
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            showLoading(true);
            
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(courseData)
            });
            
            // Xử lý lỗi 401 - Unauthorized
            if (response.status === 401) {
                showNotification('error', 'Lỗi', 'Bạn không có quyền lưu khóa học. Vui lòng đăng nhập lại với quyền admin.');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Không thể lưu khóa học');
            }
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('success', 'Thành công', isEditing ? 'Cập nhật khóa học thành công' : 'Thêm khóa học mới thành công');
                document.getElementById('course-modal').style.display = 'none';
        loadCourses();
            } else {
                showNotification('error', 'Lỗi', result.message || 'Lỗi khi lưu khóa học');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('error', 'Lỗi', error.message);
        } finally {
            showLoading(false);
        }
    }

    // Xem chi tiết khóa học
    async function viewCourse(courseId) {
        try {
            showLoading(true);
            
            const response = await fetch(`/api/Courses/${courseId}`);
            
            const result = await response.json();
            
            if (result.success && result.data) {
                const course = result.data;
                
                // Tạo modal nếu chưa tồn tại
                let modal = document.getElementById('course-detail-modal');
                
        if (!modal) {
                    const modalHTML = `
                        <div class="modal" id="course-detail-modal">
                <div class="modal-content">
                    <div class="modal-header">
                                    <h3><i class="fas fa-info-circle"></i> Chi tiết khóa học</h3>
                                    <button class="close-btn">&times;</button>
                                </div>
                                <div class="modal-body" id="course-detail-content">
                                    <!-- Nội dung chi tiết sẽ được thêm vào đây -->
                                </div>
                                <div class="modal-footer">
                                    <button class="primary-btn" id="close-course-detail-btn">
                                        <i class="fas fa-times"></i> Đóng
                                    </button>
                    </div>
                    </div>
                </div>
            `;
                    
                    document.body.insertAdjacentHTML('beforeend', modalHTML);
                    modal = document.getElementById('course-detail-modal');
                    
                    // Thiết lập sự kiện cho modal
                    modal.querySelector('.close-btn').addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                    
                    document.getElementById('close-course-detail-btn').addEventListener('click', () => {
                        modal.style.display = 'none';
                    });
                    
                    // Xử lý đóng modal khi click ra ngoài
                    window.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    });
                }
                
                // Hiển thị thông tin chi tiết
                const detailContent = document.getElementById('course-detail-content');
                
                detailContent.innerHTML = `
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-id-card"></i> Mã khóa học:</span>
                        <span class="detail-value">${course.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-graduation-cap"></i> Tên khóa học:</span>
                        <span class="detail-value">${course.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-book-open"></i> Môn học:</span>
                        <span class="detail-value">${course.subjectName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-list-ul"></i> Loại khóa học:</span>
                        <span class="detail-value">${course.type === 'tuantu' ? 'Tuần tự' : 'Tự do'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"><i class="fas fa-book"></i> Số bài giảng:</span>
                        <span class="detail-value">${course.lecturesCount}</span>
                    </div>
                `;
                
                // Hiển thị modal
                modal.style.display = 'block';
            } else {
                showNotification('error', 'Lỗi', result.message || 'Không thể tải thông tin khóa học');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('error', 'Lỗi', error.message);
        } finally {
            showLoading(false);
        }
    }

    // Chỉnh sửa khóa học
    function editCourse(courseId) {
        showCourseModal(courseId);
    }

    // Xóa khóa học
    function deleteCourse(courseId) {
        if (confirm('Bạn có chắc muốn xóa khóa học này không?')) {
            deleteCourseConfirmed(courseId);
        }
    }

    // Xác nhận xóa khóa học
    async function deleteCourseConfirmed(courseId) {
        try {
            showLoading(true);
            
            // Thêm token xác thực
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`/api/Courses/${courseId}`, {
                method: 'DELETE',
                headers: headers
            });
            
            // Xử lý lỗi 401 - Unauthorized
            if (response.status === 401) {
                showNotification('error', 'Lỗi', 'Bạn không có quyền xóa khóa học. Vui lòng đăng nhập lại với quyền admin.');
                return;
            }
            
            if (!response.ok) {
                throw new Error('Không thể xóa khóa học');
            }
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('success', 'Thành công', 'Xóa khóa học thành công');
                loadCourses();
            } else {
                showNotification('error', 'Lỗi', result.message || 'Lỗi khi xóa khóa học');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('error', 'Lỗi', error.message);
        } finally {
            showLoading(false);
        }
    }

    // Hiển thị thông báo
    function showNotification(type, title, message) {
        if (window.showNotification) {
            window.showNotification(type, title, message);
        } else {
            alert(`${title}: ${message}`);
        }
    }

    // Hiển thị loading
    function showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        } else if (show) {
            // Tạo overlay nếu chưa tồn tại
            const overlayHTML = `
                <div id="loading-overlay">
                    <div class="spinner"></div>
            </div>
        `;
            document.body.insertAdjacentHTML('beforeend', overlayHTML);
        }
    }

    // Định dạng ngày tháng
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Định dạng ngày tháng cho input date
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toISOString().split('T')[0];
    }
    
    // Đặt các hàm vào window để có thể gọi từ HTML
    window.initCoursesModule = initCoursesModule;
    window.viewCourse = viewCourse;
    window.editCourse = editCourse;
    window.deleteCourse = deleteCourse;
})();
