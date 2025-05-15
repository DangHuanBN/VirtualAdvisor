/**
 * Module quản lý môn học
 */

// Các biến toàn cục
let subjects = [];
    let currentPage = 1;
let pageSize = 10;
    let totalPages = 1;
let searchTimeout;

// Hàm khởi tạo module
function initSubjectsModule() {
    setupEventHandlers();
    loadSubjects();
}

// Thiết lập các event handler
function setupEventHandlers() {
    // Nút thêm môn học mới
    document.getElementById('add-subject-btn').addEventListener('click', () => showSubjectModal());
    
    // Xử lý tìm kiếm realtime
    const searchInput = document.querySelector('#subjects-tab .search-box input');
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadSubjects(query);
        }, 300);
    });
    
    // Xử lý nút phân trang
    const pagination = document.querySelector('#subjects-tab .pagination');
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
            
            const query = document.querySelector('#subjects-tab .search-box input').value.trim();
            loadSubjects(query);
        }
    });
    
    // Xử lý checkbox chọn tất cả
    document.getElementById('select-all-subjects').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#subjects-table tbody .select-item');
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    });
}

// Tải danh sách môn học
async function loadSubjects(searchQuery = '') {
    showLoading(true);
    
    try {
        let url = '/api/Subjects';
        if (searchQuery) {
            url = `/api/Subjects/search?name=${encodeURIComponent(searchQuery)}`;
        }
        
        // Thêm token xác thực nếu cần
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, {
            headers: headers
        });
        
        // Xử lý lỗi 401 - Unauthorized
        if (response.status === 401) {
            showNotification('error', 'Lỗi', 'Bạn không có quyền truy cập dữ liệu môn học. Vui lòng đăng nhập lại với quyền admin.');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách môn học');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            subjects = result.data;
            await updatePagination();
            renderSubjectsList();
        } else {
            showNotification('error', 'Lỗi', result.message || 'Lỗi khi tải danh sách môn học');
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
        // Tính toán tổng số trang dựa trên tổng số môn học
        const response = await fetch('/api/Subjects/count');
        
        const result = await response.json();
        
        if (result.success && result.data !== undefined) {
            const totalItems = result.data;
            totalPages = Math.ceil(totalItems / pageSize);
            
            // Hiển thị phân trang
            const paginationContainer = document.querySelector('#subjects-tab .pagination');
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
        console.error('Lỗi khi lấy tổng số môn học:', error);
    }
}

// Hiển thị danh sách môn học
function renderSubjectsList() {
    const tableBody = document.querySelector('#subjects-table tbody');
    tableBody.innerHTML = '';
    
    // Tính các mục cần hiển thị trên trang hiện tại
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, subjects.length);
    const currentPageItems = subjects.slice(startIndex, endIndex);
    
    if (currentPageItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Không có dữ liệu</td>
            </tr>
        `;
        return;
    }
    
    currentPageItems.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="select-item"></td>
            <td>${subject.id}</td>
            <td>${subject.name}</td>
            <td>${subject.credits}</td>
            <td>${subject.courseCount}</td>
            <td class="action-cell">
                <button class="action-btn view-btn" title="Xem chi tiết" onclick="viewSubject(${subject.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" title="Chỉnh sửa" onclick="editSubject(${subject.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Xóa" onclick="deleteSubject(${subject.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Hiển thị modal môn học (thêm/sửa)
function showSubjectModal(subjectId = null) {
    // Tạo modal nếu chưa tồn tại
    let modal = document.getElementById('subject-modal');
    
    if (!modal) {
        const modalHTML = `
            <div class="modal" id="subject-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="subject-modal-title"><i class="fas fa-book-open"></i> Thêm môn học mới</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="subject-form">
                            <input type="hidden" id="subject-id">
                <div class="form-group">
                                <label for="subject-name">
                                    <i class="fas fa-book-open"></i> Tên môn học
                                </label>
                                <input type="text" id="subject-name" class="form-control" required placeholder="Nhập tên môn học">
                                <div class="error-message" id="name-error"></div>
                </div>
                <div class="form-group">
                                <label for="subject-credits">
                                    <i class="fas fa-award"></i> Số tín chỉ
                                </label>
                                <input type="number" id="subject-credits" class="form-control" min="1" required placeholder="Nhập số tín chỉ">
                                <div class="error-message" id="credits-error"></div>
                            </div>
                        </form>
                </div>
                    <div class="modal-footer">
                        <button class="secondary-btn" id="cancel-subject-btn">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                        <button class="primary-btn" id="save-subject-btn">
                            <i class="fas fa-save"></i> Lưu
                        </button>
                </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('subject-modal');
        
        // Thiết lập sự kiện cho modal
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('cancel-subject-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('save-subject-btn').addEventListener('click', saveSubject);
        
        // Xử lý đóng modal khi click ra ngoài
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Đặt tiêu đề và dữ liệu cho modal
    const modalTitle = document.getElementById('subject-modal-title');
    const subjectIdInput = document.getElementById('subject-id');
    const subjectNameInput = document.getElementById('subject-name');
    const subjectCreditsInput = document.getElementById('subject-credits');
    
    // Xóa thông báo lỗi
    document.getElementById('name-error').textContent = '';
    document.getElementById('credits-error').textContent = '';
    
    if (subjectId) {
        // Chế độ chỉnh sửa
        modalTitle.textContent = 'Chỉnh sửa môn học';
        const subject = subjects.find(s => s.id === subjectId);
        
        if (subject) {
            subjectIdInput.value = subject.id;
            subjectNameInput.value = subject.name;
            subjectCreditsInput.value = subject.credits;
        }
    } else {
        // Chế độ thêm mới
        modalTitle.textContent = 'Thêm môn học mới';
        subjectIdInput.value = '';
        subjectNameInput.value = '';
        subjectCreditsInput.value = '';
    }
    
    // Hiển thị modal
    modal.style.display = 'block';
}

// Lưu môn học (thêm mới hoặc cập nhật)
async function saveSubject() {
    // Lấy dữ liệu từ form
    const subjectId = document.getElementById('subject-id').value;
    const subjectName = document.getElementById('subject-name').value.trim();
    const subjectCredits = parseInt(document.getElementById('subject-credits').value);
    
    // Xóa thông báo lỗi
    document.getElementById('name-error').textContent = '';
    document.getElementById('credits-error').textContent = '';
    
    // Validate dữ liệu
    let isValid = true;
    
    if (!subjectName) {
        document.getElementById('name-error').textContent = 'Vui lòng nhập tên môn học';
        isValid = false;
    }
    
    if (isNaN(subjectCredits) || subjectCredits < 1) {
        document.getElementById('credits-error').textContent = 'Số tín chỉ phải là số nguyên dương';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Chuẩn bị dữ liệu
    const subjectData = {
        name: subjectName,
        credits: subjectCredits
    };
    
    if (subjectId && subjectId !== '0') {
        subjectData.id = parseInt(subjectId);
    }
    
    try {
        const isEditing = subjectId && subjectId !== '0';
        const url = isEditing ? `/api/Subjects/${subjectId}` : '/api/Subjects';
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
            body: JSON.stringify(subjectData)
        });
        
        // Xử lý lỗi 401 - Unauthorized
        if (response.status === 401) {
            showNotification('error', 'Lỗi', 'Bạn không có quyền lưu môn học. Vui lòng đăng nhập lại với quyền admin.');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Không thể lưu môn học');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Thành công', isEditing ? 'Cập nhật môn học thành công' : 'Thêm môn học mới thành công');
            document.getElementById('subject-modal').style.display = 'none';
            loadSubjects();
        } else {
            showNotification('error', 'Lỗi', result.message || 'Lỗi khi lưu môn học');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showNotification('error', 'Lỗi', error.message);
    } finally {
        showLoading(false);
    }
}

// Xem chi tiết môn học
async function viewSubject(subjectId) {
    try {
        showLoading(true);
        
        // Chuyển đổi subjectId thành số nếu là chuỗi
        if (typeof subjectId === 'string') {
            subjectId = parseInt(subjectId.replace('SUB', ''));
        }
        
        const response = await fetch(`/api/Subjects/${subjectId}`);
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const subject = result.data;
            
            // Tạo modal nếu chưa tồn tại
            let modal = document.getElementById('subject-detail-modal');
            
            if (!modal) {
                const modalHTML = `
                    <div class="modal" id="subject-detail-modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3><i class="fas fa-info-circle"></i> Chi tiết môn học</h3>
                                <button class="close-btn">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="detail-card">
                                    <div class="detail-item">
                                        <span class="detail-label"><i class="fas fa-hashtag"></i> ID:</span>
                                        <span id="detail-id" class="detail-value"></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label"><i class="fas fa-book-open"></i> Tên môn học:</span>
                                        <span id="detail-name" class="detail-value"></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label"><i class="fas fa-award"></i> Số tín chỉ:</span>
                                        <span id="detail-credits" class="detail-value"></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label"><i class="fas fa-graduation-cap"></i> Số khóa học:</span>
                                        <span id="detail-course-count" class="detail-value"></span>
                                    </div>
                                </div>
                </div>
                            <div class="modal-footer">
                                <button class="secondary-btn" id="close-detail-btn">
                                    <i class="fas fa-times"></i> Đóng
                                </button>
                </div>
                </div>
                </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                modal = document.getElementById('subject-detail-modal');
                
                // Thiết lập sự kiện cho modal
                modal.querySelector('.close-btn').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
                document.getElementById('close-detail-btn').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                
                // Xử lý đóng modal khi click ra ngoài
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
            
            // Hiển thị dữ liệu
            document.getElementById('detail-id').textContent = subject.id;
            document.getElementById('detail-name').textContent = subject.name;
            document.getElementById('detail-credits').textContent = subject.credits;
            document.getElementById('detail-course-count').textContent = subject.courseCount;
            
            // Hiển thị modal
            modal.style.display = 'block';
        } else {
            showNotification('error', 'Lỗi', result.message || 'Không thể tải thông tin môn học');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showNotification('error', 'Lỗi', 'Có lỗi xảy ra khi tải thông tin môn học');
    } finally {
        showLoading(false);
    }
}

// Sửa môn học
function editSubject(subjectId) {
    // Chuyển đổi subjectId thành số nếu là chuỗi
    if (typeof subjectId === 'string') {
        subjectId = parseInt(subjectId.replace('SUB', ''));
    }
    
    showSubjectModal(subjectId);
}

// Xóa môn học
function deleteSubject(subjectId) {
    // Chuyển đổi subjectId thành số nếu là chuỗi
    if (typeof subjectId === 'string') {
        subjectId = parseInt(subjectId.replace('SUB', ''));
    }
    
    // Tìm thông tin môn học
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject) {
        showNotification('error', 'Lỗi', 'Không tìm thấy môn học');
        return;
    }
    
    // Hiển thị modal xác nhận
    let confirmModal = document.getElementById('delete-confirm-modal');
    
    if (!confirmModal) {
        const modalHTML = `
            <div class="modal" id="delete-confirm-modal">
                <div class="modal-content">
                    <div class="modal-header modal-header-danger">
                        <h3><i class="fas fa-exclamation-triangle"></i> Xác nhận xóa</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="warning-message">
                            <i class="fas fa-trash-alt warning-icon"></i>
                            <div class="warning-text">
                                <p>Bạn có chắc chắn muốn xóa môn học <strong id="delete-subject-name"></strong>?</p>
                                <p class="text-danger"><i class="fas fa-exclamation-circle"></i> Hành động này không thể hoàn tác.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="secondary-btn" id="cancel-delete-btn">
                            <i class="fas fa-times"></i> Hủy
                        </button>
                        <button class="danger-btn" id="confirm-delete-btn">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                    </div>
                </div>
            `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        confirmModal = document.getElementById('delete-confirm-modal');
        
        // Thiết lập sự kiện cho modal
        confirmModal.querySelector('.close-btn').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
        
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
        
        // Xử lý đóng modal khi click ra ngoài
        window.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
    }
    
    // Hiển thị tên môn học cần xóa
    document.getElementById('delete-subject-name').textContent = subject.name;
    
    // Thiết lập sự kiện xóa
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Xóa event listener cũ (nếu có)
    const newConfirmDeleteBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmDeleteBtn, confirmDeleteBtn);
    
    // Thêm event listener mới
    newConfirmDeleteBtn.addEventListener('click', async () => {
        try {
            showLoading(true);
            
            // Thêm token xác thực nếu cần
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`/api/Subjects/${subjectId}`, {
                method: 'DELETE',
                headers: headers
            });
            
            // Xử lý lỗi 401 - Unauthorized
            if (response.status === 401) {
                showNotification('error', 'Lỗi', 'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại với quyền admin.');
                return;
            }
            
            // Xử lý các lỗi khác
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            // Chỉ parse JSON nếu response ok
            const result = await response.json();
            
            if (result.success) {
                // Đóng modal
                confirmModal.style.display = 'none';
                
                // Tải lại danh sách
                loadSubjects();
                
                // Hiển thị thông báo
                showNotification('success', 'Thành công', result.message || 'Xóa môn học thành công');
            } else {
                showNotification('error', 'Lỗi', result.message || 'Có lỗi xảy ra khi xóa môn học');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('error', 'Lỗi', 'Có lỗi xảy ra khi xóa môn học');
        } finally {
            showLoading(false);
        }
    });
    
    // Hiển thị modal
    confirmModal.style.display = 'block';
}

// Hàm hiển thị thông báo
function showNotification(type, title, message) {
    // Nếu đã có hàm showNotification từ common.js, sử dụng nó
    if (window.showToast) {
        window.showToast(type, message);
        return;
    }
    
    // Nếu không, tạo một hàm đơn giản
    alert(`${title}: ${message}`);
}

// Hàm hiển thị loading
function showLoading(show) {
    // Tìm hoặc tạo phần tử loader
    let loader = document.getElementById('loader');
    
    if (!loader && show) {
        const loaderHTML = `
            <div id="loader" class="loader-overlay">
                <div class="loader"></div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loaderHTML);
        loader = document.getElementById('loader');
    }
    
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Hàm format ngày tháng
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Export các hàm cần thiết
window.viewSubject = viewSubject;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;

// Khởi tạo module khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', initSubjectsModule); 