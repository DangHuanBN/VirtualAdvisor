/**
 * Users Management Module
 * Chứa các chức năng xử lý cho trang quản lý người dùng
 */

// Khai báo hàm addUserSimple ở phạm vi toàn cục để có thể gọi từ bất kỳ đâu
function addUserSimple() {
    console.log('Đang thực hiện thêm người dùng...');
    
    try {
        // Hiển thị loading
        document.body.style.cursor = 'wait';
        if (window.CommonModule && typeof CommonModule.showLoading === 'function') {
            CommonModule.showLoading();
        }
        
        // Tìm form đang hoạt động
        const visibleModal = document.querySelector('.modal[style*="display: block"]');
        const activeForm = visibleModal ? visibleModal.querySelector('form') : document.querySelector('form');
        
        if (!activeForm) {
            console.error('Không tìm thấy form đang hoạt động');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Không tìm thấy form để thêm người dùng');
            return;
        }
        
        console.log('Form đang hoạt động:', activeForm);
        
        // Kiểm tra và lấy fullName từ form (nếu có)
        let fullName = '';
        // Tìm input fullName trong form đang hoạt động
        const fullNameInput = activeForm.querySelector('input[name="fullName"], input[id="fullName"]');
        if (fullNameInput) {
            fullName = fullNameInput.value.trim();
            console.log('Tìm thấy fullName:', fullName);
        } else {
            console.log('Không tìm thấy input fullName trong form');
        }
        
        // Kiểm tra và lấy username từ form (nếu có)
        let username = '';
        const usernameInput = activeForm.querySelector('input[name="username"], input[id="username"]');
        if (usernameInput) {
            username = usernameInput.value.trim();
            console.log('Tìm thấy username:', username);
        } else {
            console.log('Không tìm thấy input username trong form');
        }
        
        // Lấy email từ form - Kiểm tra xem email có tồn tại không
        let email = '';
        const emailInput = activeForm.querySelector('input[type="email"], input[name="email"], input[id="email"]');
        if (emailInput) {
            email = emailInput.value.trim();
            console.log('Tìm thấy email:', email);
        } else {
            // Tìm kiếm theo label
            const emailLabels = activeForm.querySelectorAll('label');
            let emailInputFromLabel = null;
            
            for (const label of emailLabels) {
                if (label.textContent.toLowerCase().includes('email')) {
                    const input = label.nextElementSibling;
                    if (input && input.tagName === 'INPUT') {
                        emailInputFromLabel = input;
                        email = input.value.trim();
                        console.log('Tìm thấy email theo label:', email);
                        break;
                    }
                }
            }
            
            if (!emailInputFromLabel) {
                console.error('Không tìm thấy input email trong form');
                document.body.style.cursor = 'default';
                if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                    CommonModule.hideLoading();
                }
                alert('Lỗi: Không tìm thấy trường email trong form');
                return;
            }
        }
        
        // Lấy số điện thoại - Tìm kiếm cụ thể hơn
        let phone = '';
        
        // Tìm theo name hoặc id trong form đang hoạt động
        const phoneInput = activeForm.querySelector('input[name="phone"], input[id="phone"]');
        if (phoneInput) {
            phone = phoneInput.value.trim();
            console.log('Đã tìm thấy input phone theo name/id:', phone);
        } else {
            // Tìm theo label
            const phoneLabels = activeForm.querySelectorAll('label');
            for (const label of phoneLabels) {
                if (label.textContent.toLowerCase().includes('điện thoại') || 
                    label.textContent.toLowerCase().includes('phone')) {
                    const input = label.nextElementSibling;
                    if (input && input.tagName === 'INPUT') {
                        phone = input.value.trim();
                        console.log('Tìm thấy phone theo label:', phone);
                        break;
                    }
                }
            }
            
            if (!phone) {
                // Tìm tất cả input text và in ra để debug
                const allTextInputs = activeForm.querySelectorAll('input[type="text"]');
                console.log('Tìm thấy', allTextInputs.length, 'input text trong form:');
                
                allTextInputs.forEach((input, index) => {
                    console.log(`Input #${index}:`, input.name, input.id, input.value);
                    
                    // Nếu chưa tìm được phone và input này trông giống số điện thoại
                    if (!phone && /^\d+$/.test(input.value)) {
                        console.log('Phát hiện số điện thoại từ input #' + index);
                        phone = input.value.trim();
                    }
                });
            }
        }
        
        console.log('Số điện thoại sau khi tìm kiếm:', phone);
        
        // Lấy mật khẩu
        let password = '';
        const passwordInput = activeForm.querySelector('input[type="password"], input[name="password"], input[id="password"]');
        if (passwordInput) {
            password = passwordInput.value;
            console.log('Tìm thấy password input');
        } else {
            // Tìm kiếm theo label
            const pwdLabels = activeForm.querySelectorAll('label');
            let pwdInputFromLabel = null;
            
            for (const label of pwdLabels) {
                if (label.textContent.toLowerCase().includes('mật khẩu') || 
                    label.textContent.toLowerCase().includes('password')) {
                    const input = label.nextElementSibling;
                    if (input && input.tagName === 'INPUT') {
                        pwdInputFromLabel = input;
                        password = input.value;
                        console.log('Tìm thấy password theo label');
                        break;
                    }
                }
            }
            
            if (!pwdInputFromLabel) {
                console.error('Không tìm thấy input password trong form');
                document.body.style.cursor = 'default';
                if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                    CommonModule.hideLoading();
                }
                alert('Lỗi: Không tìm thấy trường mật khẩu trong form');
                return;
            }
        }
        
        // Cẩn thận với cách lấy giá trị role
        let role = 2; // Mặc định là Student (2)
            
        // Kiểm tra tất cả select trong form đang hoạt động
        const selects = activeForm.querySelectorAll('select');
        let roleSelect = null;
        
        selects.forEach(select => {
            console.log('Tìm thấy select:', select.name, select.id, select.value);
            // Lấy select box vai trò (có thể là select đầu tiên hoặc select có name="role")
            if (!roleSelect && (select.name === 'role' || select.id === 'role' || 
                select.options && select.options[0] && select.options[0].text.includes('Admin'))) {
                roleSelect = select;
            }
        });
        
        if (roleSelect) {
            console.log('Select box vai trò:', roleSelect);
            console.log('Giá trị đã chọn:', roleSelect.value);
            console.log('Text đã chọn:', roleSelect.options[roleSelect.selectedIndex].text);
            
            // Nếu đã chọn Admin
            if (roleSelect.options[roleSelect.selectedIndex].text.includes('Admin')) {
                role = 0;  // Đặt giá trị Admin
                console.log('Đã chọn vai trò Admin, đặt role = 0');
            } 
            // Nếu đã chọn Teacher
            else if (roleSelect.options[roleSelect.selectedIndex].text.includes('Teacher')) {
                role = 1;  // Đặt giá trị Teacher
                console.log('Đã chọn vai trò Teacher, đặt role = 1');
            }
            // Nếu đã chọn một số cụ thể 
            else if (!isNaN(parseInt(roleSelect.value))) {
                role = parseInt(roleSelect.value);
                console.log('Đã phân tích giá trị số:', role);
            }
        } else {
            console.log('Không tìm thấy select role, sử dụng vai trò mặc định:', role);
        }
        
        // Lấy giá trị status (hoạt động/bị khóa)
        let status = '1'; // Mặc định là Hoạt động
        const statusSelect = activeForm.querySelector('select[name="status"], select[id="status"]');
        if (statusSelect && statusSelect.value) {
            status = statusSelect.value;
            console.log('Tìm thấy status:', status);
        } else {
            console.log('Không tìm thấy select status, sử dụng giá trị mặc định:', status);
        }
        
        // Nếu không có username từ form, tạo username từ email
        if (!username && email) {
            username = email.split('@')[0].toLowerCase();
            console.log('Tạo username từ email:', username);
        }
        
        // Nếu không có fullName từ form, dùng username làm fullName
        if (!fullName && username) {
            // Tạo họ tên từ username, viết hoa chữ cái đầu
            fullName = username.charAt(0).toUpperCase() + username.slice(1);
            console.log('Tạo fullName từ username:', fullName);
        }
        
        // Kiểm tra các trường bắt buộc
        if (!username) {
            console.error('Thiếu username');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Vui lòng nhập tên đăng nhập');
            return;
        }
        
        if (!fullName) {
            console.error('Thiếu fullName');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Vui lòng nhập họ tên');
            return;
        }
        
        if (!email) {
            console.error('Thiếu email');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Vui lòng nhập email');
            return;
        }
        
        if (!password) {
            console.error('Thiếu password');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Vui lòng nhập mật khẩu');
            return;
        }
        
        // Log dữ liệu để debug
        console.log('Dữ liệu form cuối cùng:', { username, fullName, email, phone, password, role, status });
        
        // Tạo dữ liệu để gửi lên API
        const userData = {
            username: username,
            fullName: fullName,
            email: email,
            phone: phone || '',
            password: password,
            role: role,
            status: status === '1' ? 'active' : 'inactive'
        };
        
        console.log('Dữ liệu gửi lên API:', userData);
        
        // Gửi dữ liệu đến API
        fetch('/api/User', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Phản hồi từ API:", response.status, response.statusText);
                    console.error("Nội dung lỗi:", text);
                    
                    try {
                        // Thử chuyển đổi văn bản thành JSON
                        const errorData = JSON.parse(text);
                        throw errorData;
                    } catch (jsonErr) {
                        // Nếu không phải JSON, trả về lỗi với nội dung đầy đủ
                        throw new Error(`Lỗi ${response.status}: ${response.statusText} - ${text}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('API trả về:', data);
            alert('Thêm người dùng thành công!');
            
            // Đóng modal
            const modal = document.querySelector('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Tải lại trang sau khi thêm thành công
            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch(error => {
            document.body.style.cursor = 'default';
            console.error('Error adding user:', error);
            
            // Hiển thị thông báo lỗi chi tiết
            let errorMessage = 'Không thể thêm người dùng.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.errors) {
                // Nếu có lỗi validation chi tiết
                const errorDetails = [];
                for (const field in error.errors) {
                    if (error.errors[field] && error.errors[field].length > 0) {
                        errorDetails.push(`${field}: ${error.errors[field][0]}`);
                    }
                }
                if (errorDetails.length > 0) {
                    errorMessage = errorDetails.join('\n');
                }
            } else if (error.title) {
                errorMessage = error.title;
                if (error.detail) {
                    errorMessage += ' - ' + error.detail;
                }
            }
            
            // Hiển thị toàn bộ dữ liệu lỗi trong console
            console.log('Dữ liệu lỗi đầy đủ:', error);
            
            // Hiển thị lỗi cho người dùng
            alert('Lỗi: ' + errorMessage);
        });
        
        return true; // Đánh dấu hàm đã chạy thành công
    } catch (e) {
        document.body.style.cursor = 'default';
        if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
            CommonModule.hideLoading();
        }
        console.error('Lỗi không mong đợi trong hàm addUserSimple:', e);
        alert('Lỗi không mong đợi: ' + e.message);
        return false;
    }
}

// Hàm xử lý chỉnh sửa người dùng
function editUserSimple() {
    console.log('Đang thực hiện chỉnh sửa người dùng...');
    
    try {
        // Hiển thị loading
        document.body.style.cursor = 'wait';
        if (window.CommonModule && typeof CommonModule.showLoading === 'function') {
            CommonModule.showLoading();
        }
        
        // Lấy ID người dùng từ form hoặc URL
        let userId = 0;
        const userIdInput = document.querySelector('input[name="userId"], input[id="userId"]');
        if (userIdInput) {
            userId = parseInt(userIdInput.value);
        } else {
            // Lấy ID từ URL hoặc data attribute
            const modal = document.querySelector('.modal');
            if (modal && modal.dataset.userId) {
                userId = parseInt(modal.dataset.userId);
            }
        }
        
        if (!userId) {
            console.error('Không tìm thấy ID người dùng');
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Lỗi: Không tìm thấy ID người dùng');
            return;
        }
        
        console.log('ID người dùng cần chỉnh sửa:', userId);
        
        // Lấy dữ liệu từ form
        let fullName = '';
        const fullNameInput = document.querySelector('input[name="fullName"], input[name="họ tên"], input[id="editFullName"]');
        if (fullNameInput) {
            fullName = fullNameInput.value.trim();
        } else {
            // Tìm theo label
            const fullNameLabels = document.querySelectorAll('label');
            for (const label of fullNameLabels) {
                if (label.textContent.toLowerCase().includes('họ tên')) {
                    const input = label.nextElementSibling;
                    if (input && input.tagName === 'INPUT') {
                        fullName = input.value.trim();
                        break;
                    }
                }
            }
        }
        
        // Lấy email
        let email = '';
        const emailInput = document.querySelector('input[type="email"], input[name="email"], input[id="editEmail"]');
        if (emailInput) {
            email = emailInput.value.trim();
        }
        
        // Lấy số điện thoại
        let phone = '';
        const phoneInput = document.querySelector('input[name="phone"], input[id="phone"], input[id="editPhone"]');
        if (phoneInput) {
            phone = phoneInput.value.trim();
        } else {
            // Tìm theo label "Số điện thoại"
            const phoneLabels = document.querySelectorAll('label');
            for (const label of phoneLabels) {
                if (label.textContent.toLowerCase().includes('điện thoại')) {
                    const input = label.nextElementSibling;
                    if (input && input.tagName === 'INPUT') {
                        phone = input.value.trim();
                        break;
                    }
                }
            }
        }
        
        // Lấy trạng thái
        let status = 'active'; // Mặc định là hoạt động
        const statusSelect = document.querySelector('select[name="status"], select[id="editStatus"]');
        if (statusSelect) {
            status = statusSelect.value === '1' || statusSelect.value === 'active' ? 'active' : 'inactive';
        } else {
            // Tìm theo label "Trạng thái"
            const statusLabels = document.querySelectorAll('label');
            for (const label of statusLabels) {
                if (label.textContent.toLowerCase().includes('trạng thái')) {
                    const select = label.nextElementSibling;
                    if (select && select.tagName === 'SELECT') {
                        status = select.value === '1' || select.value === 'active' ? 'active' : 'inactive';
                        break;
                    }
                }
            }
        }
        
        // Kiểm tra dữ liệu bắt buộc
        if (!fullName) {
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            alert('Vui lòng nhập họ tên');
            return;
        }
        
        // Log dữ liệu để debug
        console.log('Dữ liệu form cập nhật:', { userId, fullName, email, phone, status });
        
        // Tạo dữ liệu để gửi lên API
        const userData = {
            userId: userId,
            fullName: fullName,
            email: email || null,
            phone: phone || null,
            status: status
        };
        
        console.log('Dữ liệu gửi lên API:', userData);
        
        // Kiểm tra xem email hoặc phone đã tồn tại chưa (loại trừ người dùng hiện tại)
        // Lưu ý: Kiểm tra này được thực hiện ở server-side, chúng ta chỉ cần gửi userId kèm theo
        
        // Gửi dữ liệu đến API - Thêm tham số exclude để loại trừ người dùng hiện tại khỏi kiểm tra trùng lặp
        fetch(`/api/User/${userId}?exclude=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error("Phản hồi từ API:", response.status, response.statusText);
                    console.error("Nội dung lỗi:", text);
                    
                    try {
                        // Thử chuyển đổi văn bản thành JSON
                        const errorData = JSON.parse(text);
                        throw errorData;
                    } catch (jsonErr) {
                        // Nếu không phải JSON, trả về lỗi với nội dung đầy đủ
                        throw new Error(`Lỗi ${response.status}: ${response.statusText} - ${text}`);
                    }
                });
            }
            
            return response.text().then(text => {
                if (text) {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.log('Phản hồi không phải JSON nhưng vẫn thành công');
                        return { success: true };
                    }
                } else {
                    console.log('Phản hồi trống nhưng vẫn thành công');
                    return { success: true };
                }
            });
        })
        .then(data => {
            console.log('API trả về:', data);
            alert('Cập nhật người dùng thành công!');
            
            // Đóng modal
            const modal = document.querySelector('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Tải lại trang sau khi cập nhật thành công
            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch(error => {
            document.body.style.cursor = 'default';
            if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
                CommonModule.hideLoading();
            }
            console.error('Error updating user:', error);
            
            // Hiển thị thông báo lỗi chi tiết
            let errorMessage = 'Không thể cập nhật người dùng.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error.errors) {
                // Nếu có lỗi validation chi tiết
                const errorDetails = [];
                for (const field in error.errors) {
                    if (error.errors[field] && error.errors[field].length > 0) {
                        errorDetails.push(`${field}: ${error.errors[field][0]}`);
                    }
                }
                if (errorDetails.length > 0) {
                    errorMessage = errorDetails.join('\n');
                }
            } else if (error.title) {
                errorMessage = error.title;
                if (error.detail) {
                    errorMessage += ' - ' + error.detail;
                }
            }
            
            // Hiển thị toàn bộ dữ liệu lỗi trong console
            console.log('Dữ liệu lỗi đầy đủ:', error);
            
            // Hiển thị lỗi cho người dùng
            alert('Lỗi: ' + errorMessage);
        });
    } catch (e) {
        document.body.style.cursor = 'default';
        if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
            CommonModule.hideLoading();
        }
        console.error('Lỗi không mong đợi:', e);
        alert('Đã xảy ra lỗi không mong đợi: ' + e.message);
    }
}

// Sửa lại phần showEditUserForm để tránh gọi trực tiếp editUserSimple
function showEditUserForm(userId) {
    showLoading();
    
    fetch(API_ENDPOINTS.USER_BY_ID(userId))
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể lấy thông tin người dùng');
            }
            return response.json();
        })
        .then(userData => {
            hideLoading();
            
            const modalId = 'editUserModal';
            const modalTitle = 'Chỉnh sửa thông tin người dùng';
            
            // Tạo nội dung form
            const formContent = `
                <form id="editUserForm">
                    <input type="hidden" id="userId" name="userId" value="${userData.userId}">
                    
                    <div class="form-group">
                        <label>Tài khoản</label>
                        <div class="read-only-field">${userData.username}</div>
                        <div class="note">* Tài khoản không thể thay đổi sau khi tạo</div>
                    </div>
            
                    <div class="form-group">
                        <label for="editFullName">Họ tên<span class="required">*</span></label>
                        <input type="text" id="editFullName" name="fullName" value="${userData.fullName || ''}" required>
                    </div>
            
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" name="email" value="${userData.email || ''}">
                    </div>
            
                    <div class="form-group">
                        <label for="editPhone">Số điện thoại</label>
                        <input type="text" id="editPhone" name="phone" value="${userData.phone || ''}">
                    </div>
            
                    <div class="form-group">
                        <label for="editPassword">Mật khẩu</label>
                        <div class="password-field">
                            <input type="password" id="editPassword" name="password" disabled>
                            <div class="note">* Mật khẩu chỉ có thể thay đổi trong phần "Đổi mật khẩu"</div>
                        </div>
                    </div>
            
                    <div class="form-group">
                        <label for="editStatus">Trạng thái</label>
                        <select id="editStatus" name="status">
                            <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                            <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Bị khóa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Vai trò</label>
                        <div class="read-only-field">${getUserRoleText(userData.role)}</div>
                        <div class="note">* Vai trò chỉ có thể được thay đổi trong phần "Phân quyền người dùng"</div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="closeModal('${modalId}')">Hủy</button>
                        <button type="button" class="submit-btn" id="save-user-btn">Lưu thay đổi</button>
                    </div>
                </form>
            `;
            
            showModal(modalId, modalTitle, formContent);
            
            // Lấy mật khẩu từ CSDL và hiển thị
            getActualPassword(userData.userId, function(password) {
                const passwordElement = document.getElementById('editPassword');
                if (passwordElement) {
                    passwordElement.value = password;
                }
            });
            
            // Lấy tham chiếu đến form
            const form = document.getElementById('editUserForm');
            
            // Ngăn form tự động submit
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    console.log('Form submit bị chặn');
                    return false;
                });
                
                // Xử lý sự kiện ấn nút lưu thay đổi trong modal này
                const saveButton = document.getElementById('save-user-btn');
                if (saveButton) {
                    // Xóa event listener cũ nếu có
                    const newSaveButton = saveButton.cloneNode(true);
                    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                    
                    // Thêm event listener mới
                    newSaveButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('Nút Lưu thay đổi trong form được nhấp');
                        editUserSimple();
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            showErrorMessage('Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
            hideLoading();
        });
}

const UsersModule = (function() {
    // Các biến private
    let usersList = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    
    // API endpoints
    const API_ENDPOINTS = {
        USERS: '/api/User',
        SEARCH: '/api/User/search',
        USER_BY_ID: (id) => `/api/User/${id}`,
        USER_STATUS: (id) => `/api/User/${id}/status`,
        SOFT_DELETE: (id) => `/api/User/${id}/soft`,
        DELETE: (id) => `/api/User/${id}`,
        CHANGE_PASSWORD: (id) => `/api/User/${id}/password`,
        CHECK_USERNAME: '/api/User/check-username',
        CHECK_EMAIL: '/api/User/check-email',
        CHECK_PHONE: '/api/User/check-phone',
        GET_PASSWORD: (id) => `/api/User/${id}/get-password`
    };
    
    // Element references
    const selectors = {
        searchInput: '.search-box input',
        searchButton: '.search-box button',
        roleFilter: '.filter-box select:first-child',
        statusFilter: '.filter-box select:last-child',
        addUserButton: '.action-buttons .primary-btn',
        exportButton: '.action-buttons .secondary-btn',
        userTable: '.data-table',
        userTableBody: '.data-table tbody',
        selectAllCheckbox: '#select-all',
        selectItemCheckboxes: '.select-item',
        pagination: '.pagination',
        pageButtons: '.page-btn:not(.prev):not(.next)',
        prevButton: '.page-btn.prev',
        nextButton: '.page-btn.next',
        actionButtons: '.action-btn'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        // Thiết lập các event listeners
        setupEventListeners();
        
        // Tải dữ liệu người dùng ban đầu
        loadUsers();
        
        console.log('Users module initialized');
    }
    
    /**
     * Thiết lập các event listeners
     */
    function setupEventListeners() {
        // Tìm kiếm người dùng
        const searchInput = document.querySelector(selectors.searchInput);
        const searchButton = document.querySelector(selectors.searchButton);
        const roleFilter = document.querySelector(selectors.roleFilter);
        const statusFilter = document.querySelector(selectors.statusFilter);
        
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    const searchTerm = searchInput.value;
                    const roleValue = roleFilter ? roleFilter.value : '';
                    const statusValue = statusFilter ? statusFilter.value : '';
                    searchUsers(searchTerm, roleValue, statusValue);
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                const searchTerm = searchInput ? searchInput.value : '';
                const roleValue = roleFilter ? roleFilter.value : '';
                const statusValue = statusFilter ? statusFilter.value : '';
                searchUsers(searchTerm, roleValue, statusValue);
            });
        }
        
        // Lọc người dùng
        if (roleFilter) {
            roleFilter.addEventListener('change', function() {
                const searchTerm = searchInput ? searchInput.value : '';
                const roleValue = roleFilter.value;
                const statusValue = statusFilter ? statusFilter.value : '';
                searchUsers(searchTerm, roleValue, statusValue);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                const searchTerm = searchInput ? searchInput.value : '';
                const roleValue = roleFilter ? roleFilter.value : '';
                const statusValue = statusFilter.value;
                searchUsers(searchTerm, roleValue, statusValue);
            });
        }
        
        // Chọn tất cả
        const selectAllCheckbox = document.querySelector(selectors.selectAllCheckbox);
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                toggleSelectAll(selectAllCheckbox.checked);
            });
        }
        
        // Thêm người dùng mới
        const addUserButton = document.querySelector(selectors.addUserButton);
        if (addUserButton) {
            addUserButton.addEventListener('click', showAddUserForm);
        }
        
        // Xuất danh sách
        const exportButton = document.querySelector(selectors.exportButton);
        if (exportButton) {
            exportButton.addEventListener('click', exportUserList);
        }
        
        // Xử lý các nút phân trang
        setupPagination();
        
        // Xử lý các nút hành động (xem, sửa, xóa, etc.)
        setupActionButtons();
    }
    
    /**
     * Tìm kiếm người dùng
     */
    function searchUsers(keyword, role, status) {
        console.log('Searching for users with keyword:', keyword);
        
        // Giả lập việc tìm kiếm bằng cách lọc các hàng trong bảng
        const tableRows = document.querySelectorAll(`${selectors.userTable} tbody tr`);
        
        if (tableRows.length > 0) {
            keyword = keyword.toLowerCase();
            
            tableRows.forEach(row => {
                let found = false;
                const cells = row.querySelectorAll('td');
                
                cells.forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(keyword)) {
                        found = true;
                    }
                });
                
                if (found) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    }
    
    /**
     * Áp dụng các bộ lọc
     */
    function applyFilters() {
        const roleFilter = document.querySelector(selectors.roleFilter);
        const statusFilter = document.querySelector(selectors.statusFilter);
        
        console.log('Applying filters - Role:', roleFilter ? roleFilter.value : 'N/A', 'Status:', statusFilter ? statusFilter.value : 'N/A');
        
        // Giả lập việc lọc
        const tableRows = document.querySelectorAll(`${selectors.userTable} tbody tr`);
        
        if (tableRows.length > 0) {
            // Reset tất cả các hàng về trạng thái hiển thị
            tableRows.forEach(row => {
                row.style.display = '';
            });
            
            // Áp dụng bộ lọc vai trò nếu được chọn
            if (roleFilter && roleFilter.value && roleFilter.value !== '') {
                const roleValue = roleFilter.value.toLowerCase();
                
                tableRows.forEach(row => {
                    const roleCell = row.querySelector('td:nth-child(5)');
                    if (roleCell && !roleCell.textContent.toLowerCase().includes(roleValue)) {
                        row.style.display = 'none';
                    }
                });
            }
            
            // Áp dụng bộ lọc trạng thái nếu được chọn
            if (statusFilter && statusFilter.value && statusFilter.value !== '') {
                const statusValue = statusFilter.value.toLowerCase();
                
                tableRows.forEach(row => {
                    if (row.style.display !== 'none') {
                        const statusCell = row.querySelector('td:nth-child(7) .status-badge');
                        if (statusCell) {
                            const isActive = statusCell.classList.contains('active');
                            if ((statusValue === 'active' && !isActive) || (statusValue === 'inactive' && isActive)) {
                                row.style.display = 'none';
                            }
                        }
                    }
                });
            }
        }
    }
    
    /**
     * Chọn/bỏ chọn tất cả
     */
    function toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll(selectors.selectItemCheckboxes);
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }
    
    /**
     * Hiển thị form thêm người dùng
     */
    function showAddUserForm() {
        // Tạo form modal
        const modalId = 'addUserModal';
        const modalTitle = 'Thêm người dùng mới';
        const formContent = `
            <form id="addUserForm">
                <div class="form-error-message" style="display: none; color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 4px; margin-bottom: 15px; border: 1px solid #f5c6cb;"></div>
                
                <div class="form-group">
                    <label for="username">Tài khoản<span class="required">*</span></label>
                    <input type="text" id="username" name="username" required>
                    <div class="field-error" data-for="username" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="fullName">Họ tên<span class="required">*</span></label>
                    <input type="text" id="fullName" name="fullName" required>
                    <div class="field-error" data-for="fullName" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email<span class="required">*</span></label>
                    <input type="email" id="email" name="email" required>
                    <div class="field-error" data-for="email" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="phone">Số điện thoại</label>
                    <input type="text" id="phone" name="phone">
                    <div class="field-error" data-for="phone" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="password">Mật khẩu<span class="required">*</span></label>
                    <input type="password" id="password" name="password" required>
                    <div class="field-error" data-for="password" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Xác nhận mật khẩu<span class="required">*</span></label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                    <div class="field-error" data-for="confirmPassword" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="role">Vai trò<span class="required">*</span></label>
                    <select id="role" name="role" required>
                        <option value="">Chọn vai trò</option>
                        <option value="0">Admin</option>
                        <option value="1">Teacher</option>
                        <option value="2">Student</option>
                        <option value="3">Other</option>
                    </select>
                    <div class="field-error" data-for="role" style="color: #dc3545; font-size: 12px; margin-top: 5px;"></div>
                </div>
                
                <div class="form-group">
                    <label for="status">Trạng thái</label>
                    <select id="status" name="status">
                        <option value="1">Hoạt động</option>
                        <option value="0">Bị khóa</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeModal('${modalId}')">Hủy</button>
                    <button type="submit" class="submit-btn">Lưu</button>
                </div>
            </form>
        `;
        
        showModal(modalId, modalTitle, formContent);
        
        // Thiết lập sự kiện cho form
        setupAddUserFormEvents(modalId);
    }
    
    /**
     * Thiết lập sự kiện cho form thêm người dùng
     */
    function setupAddUserFormEvents(modalId) {
        const form = document.getElementById('addUserForm');
        const formErrorMessage = document.querySelector('.form-error-message');
        
        if (form) {
            // Khai báo biến để lưu trữ timer cho debounce
            let usernameTimer, emailTimer, phoneTimer;
            
            // Xóa thông báo lỗi khi người dùng thay đổi input
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                    const fieldError = form.querySelector(`.field-error[data-for="${input.name}"]`);
                    if (fieldError) {
                        fieldError.textContent = '';
                    }
                    if (formErrorMessage) {
                        formErrorMessage.style.display = 'none';
                    }
                    
                    // Kiểm tra trùng lặp khi người dùng ngừng nhập
                    if (input.name === 'username' && input.value.trim().length >= 3) {
                        clearTimeout(usernameTimer);
                        usernameTimer = setTimeout(() => {
                            checkExistingUsername(input.value.trim());
                        }, 500);
                    }
                    
                    if (input.name === 'email' && isValidEmail(input.value.trim())) {
                        clearTimeout(emailTimer);
                        emailTimer = setTimeout(() => {
                            checkExistingEmail(input.value.trim());
                        }, 500);
                    }
                    
                    if (input.name === 'phone' && input.value.trim().length >= 10) {
                        clearTimeout(phoneTimer);
                        phoneTimer = setTimeout(() => {
                            checkExistingPhone(input.value.trim());
                        }, 500);
                    }
                });
            });
            
            // Thêm sự kiện submit cho form
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Reset lỗi
                if (formErrorMessage) {
                    formErrorMessage.style.display = 'none';
                    formErrorMessage.textContent = '';
                }
                document.querySelectorAll('.field-error').forEach(el => {
                    el.textContent = '';
                });
                
                // Kiểm tra dữ liệu
                let hasErrors = false;
                
                const username = document.getElementById('username').value.trim();
                const fullName = document.getElementById('fullName').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const role = document.getElementById('role').value;
                
                // Kiểm tra tài khoản
                if (!username) {
                    showFieldError('username', 'Vui lòng nhập tài khoản');
                    hasErrors = true;
                } else if (username.length < 3) {
                    showFieldError('username', 'Tài khoản phải có ít nhất 3 ký tự');
                    hasErrors = true;
                } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                    showFieldError('username', 'Tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới');
                    hasErrors = true;
                }
                
                // Kiểm tra họ tên
                if (!fullName) {
                    showFieldError('fullName', 'Vui lòng nhập họ tên');
                    hasErrors = true;
                } else if (fullName.length < 2) {
                    showFieldError('fullName', 'Họ tên phải có ít nhất 2 ký tự');
                    hasErrors = true;
                }
                
                // Kiểm tra email
                if (!email) {
                    showFieldError('email', 'Vui lòng nhập email');
                    hasErrors = true;
                } else if (!isValidEmail(email)) {
                    showFieldError('email', 'Email không hợp lệ');
                    hasErrors = true;
                }
                
                // Kiểm tra số điện thoại (nếu có)
                if (phone && !isValidPhone(phone)) {
                    showFieldError('phone', 'Số điện thoại không hợp lệ');
                    hasErrors = true;
                }
                
                // Kiểm tra mật khẩu
                if (!password) {
                    showFieldError('password', 'Vui lòng nhập mật khẩu');
                    hasErrors = true;
                } else if (password.length < 6) {
                    showFieldError('password', 'Mật khẩu phải có ít nhất 6 ký tự');
                    hasErrors = true;
                } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                    showFieldError('password', 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số');
                    hasErrors = true;
                }
                
                // Kiểm tra xác nhận mật khẩu
                if (password !== confirmPassword) {
                    showFieldError('confirmPassword', 'Mật khẩu xác nhận không khớp');
                    hasErrors = true;
                }
                
                // Kiểm tra vai trò
                if (!role) {
                    showFieldError('role', 'Vui lòng chọn vai trò');
                    hasErrors = true;
                }
                
                // Nếu có lỗi, dừng việc gửi form
                if (hasErrors) {
                    return;
                }
                
                // Thu thập dữ liệu form
                const userData = {
                    username: username,
                    fullName: fullName,
                    email: email,
                    phone: phone,
                    password: password,
                    role: parseInt(role),
                    status: parseInt(document.getElementById('status').value)
                };
                
                console.log('Form data:', userData);
                
                // Thêm người dùng mới
                addUser(userData, modalId);
            });
        }
    }
    
    /**
     * Kiểm tra email hợp lệ
     * @param {string} email - Email cần kiểm tra
     * @returns {boolean} - True nếu email hợp lệ
     */
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    
    /**
     * Kiểm tra số điện thoại hợp lệ
     * @param {string} phone - Số điện thoại cần kiểm tra
     * @returns {boolean} - True nếu số điện thoại hợp lệ
     */
    function isValidPhone(phone) {
        // Kiểm tra chuỗi chỉ chứa số, có thể có dấu + ở đầu, độ dài 10-15 ký tự
        const phoneRegex = /^(\+?)[0-9]{10,15}$/;
        return phoneRegex.test(phone);
    }
    
    /**
     * Kiểm tra tài khoản đã tồn tại chưa
     * @param {string} username - Tài khoản cần kiểm tra
     */
    function checkExistingUsername(username) {
        if (!username) return;
        
        const errorElement = document.querySelector('.field-error[data-for="username"]');
        if (!errorElement) return;
        
        // Giả lập API call (mock)
        const mockExistingUsernames = ['admin', 'test', 'user', 'admin123'];
        
        // Trong thực tế, gọi API kiểm tra
        if (mockExistingUsernames.includes(username.toLowerCase())) {
            errorElement.textContent = 'Tài khoản này đã tồn tại';
            return;
        }
        
        /*
        // Đây là code thực khi có API
        fetch(`${API_ENDPOINTS.CHECK_USERNAME}?username=${encodeURIComponent(username)}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists) {
                    errorElement.textContent = 'Tài khoản này đã tồn tại';
                }
            })
            .catch(error => {
                console.error('Error checking username:', error);
            });
        */
    }
    
    /**
     * Kiểm tra email đã tồn tại chưa
     * @param {string} email - Email cần kiểm tra
     */
    function checkExistingEmail(email) {
        if (!email) return;
        
        const errorElement = document.querySelector('.field-error[data-for="email"]');
        if (!errorElement) return;
        
        // Giả lập API call
        const mockExistingEmails = ['admin@example.com', 'test@example.com', 'user@example.com'];
        
        // Trong thực tế, gọi API kiểm tra
        if (mockExistingEmails.includes(email.toLowerCase())) {
            errorElement.textContent = 'Email này đã tồn tại';
            return;
        }
        
        /*
        // Đây là code thực khi có API
        fetch(`${API_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists) {
                    errorElement.textContent = 'Email này đã tồn tại';
                }
            })
            .catch(error => {
                console.error('Error checking email:', error);
            });
        */
    }
    
    /**
     * Kiểm tra số điện thoại đã tồn tại chưa
     * @param {string} phone - Số điện thoại cần kiểm tra
     */
    function checkExistingPhone(phone) {
        if (!phone) return;
        
        const errorElement = document.querySelector('.field-error[data-for="phone"]');
        if (!errorElement) return;
        
        // Giả lập API call
        const mockExistingPhones = ['0123456789', '0987654321'];
        
        // Trong thực tế, gọi API kiểm tra
        if (mockExistingPhones.includes(phone)) {
            errorElement.textContent = 'Số điện thoại này đã tồn tại';
            return;
        }
        
        /*
        // Đây là code thực khi có API
        fetch(`${API_ENDPOINTS.CHECK_PHONE}?phone=${encodeURIComponent(phone)}`)
            .then(response => response.json())
            .then(data => {
                if (data.exists) {
                    errorElement.textContent = 'Số điện thoại này đã tồn tại';
                }
            })
            .catch(error => {
                console.error('Error checking phone:', error);
            });
        */
    }
    
    /**
     * Thêm người dùng mới
     */
    function addUser(userData, modalId) {
        // Reset thông báo lỗi trước khi gửi
        const formErrorMessage = document.querySelector('.form-error-message');
        if (formErrorMessage) {
            formErrorMessage.style.display = 'none';
            formErrorMessage.textContent = '';
        }
        
        document.querySelectorAll('.field-error').forEach(el => {
            el.textContent = '';
        });
        
        showLoading();
        
        // Chuẩn bị dữ liệu để gửi lên API
        const apiData = {
            username: userData.username,
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone || '',
            password: userData.password,
            role: userData.role,
            status: userData.status === 1 ? 'active' : 'inactive'
        };
        
        console.log('Sending data to API:', apiData);
        
        fetch(API_ENDPOINTS.USERS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw errorData;
                }).catch(err => {
                    // Nếu không parse được JSON, trả về lỗi gốc
                    console.error("Lỗi API không phải JSON:", response.status, response.statusText);
                    throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            showSuccessMessage('Thêm người dùng thành công!');
        // Tải lại dữ liệu
        loadUsers();
            hideLoading();
            
            // Đóng modal
            closeModal(modalId);
        })
        .catch(error => {
            hideLoading();
            console.error('Error adding user:', error);
            
            // Hiển thị lỗi cụ thể trên form
            if (formErrorMessage) {
                formErrorMessage.textContent = error.message || 'Dữ liệu không hợp lệ';
                formErrorMessage.style.display = 'block';
            }
            
            // Hiển thị lỗi chi tiết cho từng trường
            if (error.errors) {
                Object.keys(error.errors).forEach(field => {
                    // Chuyển đổi tên trường từ API thành tên trường trên form
                    let formField = field.charAt(0).toLowerCase() + field.slice(1);
                    
                    // Trường hợp đặc biệt
                    if (formField === 'fullName') formField = 'fullName';
                    if (formField === 'phoneNumber') formField = 'phone';
                    
                    const fieldError = document.querySelector(`.field-error[data-for="${formField}"]`);
                    if (fieldError && error.errors[field].length > 0) {
                        fieldError.textContent = error.errors[field][0];
                    }
                });
            }
        });
    }
    
    /**
     * Hiển thị form chỉnh sửa người dùng
     */
    function showEditUserForm(userId) {
        showLoading();
        
        fetch(API_ENDPOINTS.USER_BY_ID(userId))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể lấy thông tin người dùng');
                }
                return response.json();
            })
            .then(userData => {
                hideLoading();
                
        const modalId = 'editUserModal';
                const modalTitle = 'Chỉnh sửa thông tin người dùng';
                
                // Tạo nội dung form
        const formContent = `
            <form id="editUserForm">
                        <input type="hidden" id="userId" name="userId" value="${userData.userId}">
                        
                <div class="form-group">
                            <label>Tài khoản</label>
                            <div class="read-only-field">${userData.username}</div>
                            <div class="note">* Tài khoản không thể thay đổi sau khi tạo</div>
                </div>
                
                <div class="form-group">
                            <label for="editFullName">Họ tên<span class="required">*</span></label>
                            <input type="text" id="editFullName" name="fullName" value="${userData.fullName || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="editEmail">Email</label>
                            <input type="email" id="editEmail" name="email" value="${userData.email || ''}">
                </div>
                
                <div class="form-group">
                            <label for="editPhone">Số điện thoại</label>
                            <input type="text" id="editPhone" name="phone" value="${userData.phone || ''}">
                </div>
                
                        <div class="form-group">
                            <label for="editPassword">Mật khẩu</label>
                            <div class="password-field">
                                <input type="password" id="editPassword" name="password" disabled>
                                <div class="note">* Mật khẩu chỉ có thể thay đổi trong phần "Đổi mật khẩu"</div>
                            </div>
                        </div>
                
                <div class="form-group">
                    <label for="editStatus">Trạng thái</label>
                    <select id="editStatus" name="status">
                        <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                        <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Bị khóa</option>
                    </select>
                </div>
                        <div class="form-group">
                            <label>Vai trò</label>
                            <div class="read-only-field">${getUserRoleText(userData.role)}</div>
                            <div class="note">* Vai trò chỉ có thể được thay đổi trong phần "Phân quyền người dùng"</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-btn" onclick="closeModal('${modalId}')">Hủy</button>
                            <button type="button" class="submit-btn" id="save-user-btn">Lưu thay đổi</button>
                </div>
            </form>
        `;
        
        showModal(modalId, modalTitle, formContent);
        
                // Lấy mật khẩu từ CSDL và hiển thị
                getActualPassword(userData.userId, function(password) {
                    const passwordElement = document.getElementById('editPassword');
                    if (passwordElement) {
                        passwordElement.value = password;
                    }
                });
                
                // Lấy tham chiếu đến form
        const form = document.getElementById('editUserForm');
                
                // Ngăn form tự động submit
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                        console.log('Form submit bị chặn');
                        return false;
                    });
                    
                    // Xử lý sự kiện ấn nút lưu thay đổi trong modal này
                    const saveButton = document.getElementById('save-user-btn');
                    if (saveButton) {
                        // Xóa event listener cũ nếu có
                        const newSaveButton = saveButton.cloneNode(true);
                        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
                        
                        // Thêm event listener mới
                        newSaveButton.addEventListener('click', function(e) {
                            e.preventDefault();
                            console.log('Nút Lưu thay đổi trong form được nhấp');
                            editUserSimple();
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                showErrorMessage('Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
                hideLoading();
            });
    }
    
    /**
     * Cập nhật thông tin người dùng
     */
    function updateUser(userData) {
        showLoading();
        
        fetch(API_ENDPOINTS.USER_BY_ID(userData.userId), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 400) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Dữ liệu không hợp lệ');
                    });
                }
                throw new Error('Lỗi khi cập nhật người dùng');
            }
            return response;
        })
        .then(() => {
            showSuccessMessage('Cập nhật người dùng thành công!');
            // Tải lại dữ liệu
            loadUsers();
            hideLoading();
        })
        .catch(error => {
            console.error('Error updating user:', error);
            showErrorMessage(error.message || 'Không thể cập nhật người dùng. Vui lòng thử lại sau.');
            hideLoading();
        });
    }
    
    /**
     * Chuyển đổi trạng thái người dùng (khóa/mở khóa)
     */
    function toggleUserStatus(userId, userName, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const statusText = newStatus === 'active' ? 'mở khóa' : 'khóa';
        
        if (confirm(`Bạn có chắc chắn muốn ${statusText} tài khoản "${userName}"?`)) {
            showLoading();
            
            fetch(API_ENDPOINTS.USER_STATUS(userId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Lỗi khi ${statusText} tài khoản`);
                }
                return response;
            })
            .then(() => {
                showSuccessMessage(`${statusText} tài khoản thành công!`);
                // Tải lại dữ liệu
                loadUsers();
                hideLoading();
            })
            .catch(error => {
                console.error(`Error toggling user status:`, error);
                showErrorMessage(`Không thể ${statusText} tài khoản. Vui lòng thử lại sau.`);
                hideLoading();
            });
        }
    }
    
    /**
     * Lấy text hiển thị cho vai trò
     */
    function getUserRoleText(role) {
        switch(role) {
            case 'Student': return 'Học viên';
            case 'Teacher': return 'Giảng viên';
            case 'Admin': return 'Quản trị viên';
            case 'Other': return 'Khác';
            default: return role;
        }
    }
    
    /**
     * Hiển thị modal
     */
    function showModal(modalId, title, content) {
        // Kiểm tra xem modal đã tồn tại chưa
        let modal = document.getElementById(modalId);
        
        // Nếu chưa có, tạo mới
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-btn" onclick="closeModal('${modalId}')">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            // Nếu đã có, cập nhật nội dung
            modal.querySelector('.modal-header h3').textContent = title;
            modal.querySelector('.modal-body').innerHTML = content;
        }
        
        // Hiển thị modal
        modal.style.display = 'block';
        
        // Định nghĩa hàm đóng modal trong global scope
        window.closeModal = function(id) {
            console.log('Đóng modal:', id);
            const modal = document.getElementById(id);
            if (modal) {
                modal.style.display = 'none';
            } else {
                // Nếu không tìm thấy modal bằng ID, tìm bằng class
                const modalElement = document.querySelector('.modal');
                if (modalElement) {
                    modalElement.style.display = 'none';
                }
            }
        };
    }
    
    /**
     * Xuất danh sách người dùng
     */
    function exportUserList() {
        alert('Chức năng xuất danh sách đang được phát triển');
    }
    
    /**
     * Thiết lập phân trang
     */
    function setupPagination() {
        const pageButtons = document.querySelectorAll(selectors.pageButtons);
        const prevButton = document.querySelector(selectors.prevButton);
        const nextButton = document.querySelector(selectors.nextButton);
        
        if (pageButtons.length > 0) {
            pageButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    // Xóa lớp active từ tất cả các nút
                    pageButtons.forEach(b => b.classList.remove('active'));
                    // Thêm lớp active cho nút được nhấp
                    btn.classList.add('active');
                    
                    // Chuyển trang
                    currentPage = parseInt(btn.textContent);
                    loadUsersForPage(currentPage);
                });
            });
        }
        
        if (prevButton) {
            prevButton.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    updateActivePage();
                    loadUsersForPage(currentPage);
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    updateActivePage();
                    loadUsersForPage(currentPage);
                }
            });
        }
    }
    
    /**
     * Cập nhật nút trang đang hoạt động
     */
    function updateActivePage() {
        const pageButtons = document.querySelectorAll(selectors.pageButtons);
        if (pageButtons.length > 0) {
            pageButtons.forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.textContent) === currentPage) {
                    btn.classList.add('active');
                }
            });
        }
    }
    
    /**
     * Thiết lập các nút hành động
     */
    function setupActionButtons() {
        const actionButtons = document.querySelectorAll(`${selectors.userTableBody} .action-btn`);
        
        if (actionButtons.length > 0) {
            actionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = btn.classList.contains('view-btn') ? 'view' :
                                  btn.classList.contains('edit-btn') ? 'edit' :
                                  btn.classList.contains('delete-btn') ? 'delete' : '';
                    
                    const row = btn.closest('tr');
                    const userId = row.dataset.id;
                    const userName = row.querySelector('td:nth-child(3)').textContent;
                    
                    handleUserAction(action, userId, userName);
                });
            });
        }
        
        // Thêm sự kiện click vào status badge để toggle status
        const statusBadges = document.querySelectorAll(`${selectors.userTableBody} .status-badge`);
        if (statusBadges.length > 0) {
            statusBadges.forEach(badge => {
                // Thêm cursor pointer để chỉ ra rằng có thể nhấp vào
                badge.style.cursor = 'pointer';
                
                badge.addEventListener('click', function() {
                    const row = badge.closest('tr');
                    const userId = row.dataset.id;
                    const userName = row.querySelector('td:nth-child(3)').textContent;
                    const currentStatus = badge.classList.contains('active') ? 'active' : 'inactive';
                    
                    toggleUserStatus(userId, userName, currentStatus);
                });
                
                // Thêm tooltip
                badge.title = 'Nhấp để chuyển đổi trạng thái';
            });
        }
    }
    
    /**
     * Xử lý hành động trên người dùng
     */
    function handleUserAction(action, userId, userName) {
        switch(action) {
            case 'view':
                showUserDetails(userId);
                break;
                
            case 'edit':
                showEditUserForm(userId);
                break;
                
            case 'delete':
                showDeleteOptions(userId, userName);
                break;
                
            default:
                console.log('Unknown action');
        }
    }
    
    /**
     * Hiển thị thông tin chi tiết người dùng
     */
    function showUserDetails(userId) {
        showLoading();
        
        // Lấy thông tin người dùng từ API
        fetch(API_ENDPOINTS.USER_BY_ID(userId))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể lấy thông tin người dùng');
                }
                return response.json();
            })
            .then(userData => {
                hideLoading();
                
                // Tạo modal chi tiết người dùng với phần mật khẩu sẽ được cập nhật sau
        const modalId = 'userDetailsModal';
        const modalTitle = `Chi tiết người dùng: ${userData.fullName}`;
        const content = `
            <div class="user-details">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${userData.userId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tên đăng nhập:</span>
                    <span class="detail-value">${userData.username}</span>
                </div>
                        <div class="detail-row">
                            <span class="detail-label">Mật khẩu:</span>
                            <span class="detail-value" id="password-value">Đang tải mật khẩu từ CSDL...</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Họ tên:</span>
                    <span class="detail-value">${userData.fullName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                            <span class="detail-value">${userData.email || 'Chưa cung cấp'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Số điện thoại:</span>
                            <span class="detail-value">${userData.phone || 'Chưa cung cấp'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Vai trò:</span>
                            <span class="detail-value">${getUserRoleText(userData.role)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Trạng thái:</span>
                    <span class="detail-value ${userData.status}">${userData.status === 'active' ? 'Hoạt động' : 'Bị khóa'}</span>
                </div>
            </div>
            <div class="modal-actions">
                        <button class="edit-btn" onclick="closeModal('${modalId}'); UsersModule.showEditUserForm(${userData.userId})">Chỉnh sửa</button>
                <button class="primary-btn" onclick="closeModal('${modalId}')">Đóng</button>
            </div>
        `;
        
        showModal(modalId, modalTitle, content);
                
                // Lấy mật khẩu mô phỏng và hiển thị
                getActualPassword(userData.userId, function(password) {
                    const passwordElement = document.getElementById('password-value');
                    if (passwordElement) {
                        passwordElement.textContent = password;
                    }
                });
                
                // Định nghĩa hàm đặt lại mật khẩu
                window.requestPasswordReset = function(userId, username) {
                    if (confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${username}"?`)) {
                        alert('Chức năng đặt lại mật khẩu đang được phát triển.');
                        // TODO: Thêm chức năng đặt lại mật khẩu thực tế ở đây
                    }
                };
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
                showErrorMessage('Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
                hideLoading();
            });
    }
    
    /**
     * Hiển thị tùy chọn xóa (xóa mềm/xóa vĩnh viễn)
     */
    function showDeleteOptions(userId, userName) {
        const modalId = 'deleteOptionsModal';
        const modalTitle = `Xóa người dùng: ${userName}`;
        const content = `
            <div class="delete-options">
                <p>Bạn muốn thực hiện thao tác gì với người dùng này?</p>
                <div class="delete-actions">
                    <button class="warning-btn soft-delete-btn" onclick="closeModal('${modalId}'); UsersModule.softDeleteUser(${userId}, '${userName}')">
                        <i class="fas fa-lock"></i> Khóa tài khoản
                    </button>
                    <button class="danger-btn perm-delete-btn" onclick="closeModal('${modalId}'); UsersModule.deleteUser(${userId}, '${userName}')">
                        <i class="fas fa-trash"></i> Xóa vĩnh viễn
                    </button>
                </div>
                <div class="delete-note">
                    <p><strong>Lưu ý:</strong></p>
                    <p>- Khóa tài khoản: Tài khoản sẽ bị vô hiệu hóa nhưng dữ liệu vẫn được giữ lại</p>
                    <p>- Xóa vĩnh viễn: Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa hoàn toàn</p>
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" onclick="closeModal('${modalId}')">Hủy</button>
                </div>
            </div>
        `;
        
        showModal(modalId, modalTitle, content);
    }
    
    /**
     * Xóa mềm người dùng (khóa tài khoản)
     */
    function softDeleteUser(userId, userName) {
        if (confirm(`Bạn có chắc chắn muốn khóa tài khoản "${userName}"?`)) {
            showLoading();
            
            fetch(API_ENDPOINTS.SOFT_DELETE(userId), {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Lỗi khi khóa tài khoản');
                }
                return response;
            })
            .then(() => {
                showSuccessMessage('Khóa tài khoản thành công!');
                // Tải lại dữ liệu
                loadUsers();
                hideLoading();
            })
            .catch(error => {
                console.error('Error soft deleting user:', error);
                showErrorMessage('Không thể khóa tài khoản. Vui lòng thử lại sau.');
                hideLoading();
            });
        }
    }
    
    /**
     * Xóa vĩnh viễn người dùng
     */
    function deleteUser(userId, userName) {
        if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${userName}"?\nThao tác này không thể hoàn tác!`)) {
            showLoading();
            
            fetch(API_ENDPOINTS.DELETE(userId), {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Lỗi khi xóa tài khoản');
                }
                return response;
            })
            .then(() => {
                showSuccessMessage('Xóa tài khoản thành công!');
                // Tải lại dữ liệu
                loadUsers();
                hideLoading();
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                showErrorMessage('Không thể xóa tài khoản. Vui lòng thử lại sau.');
                hideLoading();
            });
        }
    }
    
    /**
     * Tải dữ liệu người dùng
     */
    function loadUsers() {
        showLoading();
        
        // Lấy dữ liệu từ API
        fetch(API_ENDPOINTS.USERS)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Lỗi khi tải danh sách người dùng');
                }
                return response.json();
            })
            .then(data => {
                usersList = data;
        
        // Tính tổng số trang
        totalPages = Math.ceil(usersList.length / itemsPerPage);
        
        // Tải dữ liệu cho trang hiện tại
        loadUsersForPage(currentPage);
                hideLoading();
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showErrorMessage('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
                hideLoading();
            });
    }
    
    /**
     * Tải dữ liệu người dùng cho trang cụ thể
     */
    function loadUsersForPage(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, usersList.length);
        const usersToShow = usersList.slice(startIndex, endIndex);
        
        renderUserTable(usersToShow);
        updatePagination();
    }
    
    /**
     * Renders the user table with the provided data
     */
    function renderUserTable(users) {
        const tableBody = document.querySelector(selectors.userTableBody);
        if (!tableBody) return;
        
        let html = '';
        
        if (users.length === 0) {
            html = `<tr><td colspan="10" class="no-data">Không có dữ liệu người dùng</td></tr>`;
        } else {
            users.forEach(user => {
                html += `
                    <tr data-id="${user.userId}">
                        <td><input type="checkbox" class="select-item"></td>
                        <td>${user.userId}</td>
                        <td>${user.fullName}</td>
                        <td>${user.username || ''}</td>
                        <td>${user.email || ''}</td>
                        <td>${user.phone || ''}</td>
                        <td>${getUserRoleText(user.role)}</td>
                        <td><span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">${user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}</span></td>
                        <td class="action-cell">
                            <button class="action-btn view-btn" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                            <button class="action-btn edit-btn" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-btn" title="Xóa"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
        
        tableBody.innerHTML = html;
        
        // Thiết lập lại các event listeners cho các nút hành động
        setupActionButtons();
    }
    
    /**
     * Cập nhật các nút phân trang
     */
    function updatePagination() {
        const paginationContainer = document.querySelector(selectors.pagination);
        if (!paginationContainer) return;
        
        let html = '';
        
        // Nút previous
        html += `<button class="page-btn prev" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
        
        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span>...</span>`;
            }
        }
        
        // Nút next
        html += `<button class="page-btn next" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        
        paginationContainer.innerHTML = html;
        
        // Thiết lập lại các event listeners cho các nút phân trang
        setupPaginationEvents();
    }
    
    /**
     * Thiết lập sự kiện cho các nút phân trang
     */
    function setupPaginationEvents() {
        const pageButtons = document.querySelectorAll(`${selectors.pagination} .page-btn:not(.prev):not(.next)`);
        const prevButton = document.querySelector(`${selectors.pagination} .page-btn.prev`);
        const nextButton = document.querySelector(`${selectors.pagination} .page-btn.next`);
        
        if (pageButtons.length > 0) {
            pageButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    currentPage = parseInt(btn.textContent);
                    loadUsersForPage(currentPage);
                });
            });
        }
        
        if (prevButton) {
            prevButton.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    loadUsersForPage(currentPage);
                }
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    loadUsersForPage(currentPage);
                }
            });
        }
    }
    
    /**
     * Hiển thị thông báo lỗi
     */
    function showErrorMessage(message) {
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }
    
    /**
     * Hiển thị thông báo thành công
     */
    function showSuccessMessage(message) {
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }
    
    /**
     * Hiển thị loading
     */
    function showLoading() {
        if (window.CommonModule && typeof CommonModule.showLoading === 'function') {
            CommonModule.showLoading();
        }
    }
    
    /**
     * Ẩn loading
     */
    function hideLoading() {
        if (window.CommonModule && typeof CommonModule.hideLoading === 'function') {
            CommonModule.hideLoading();
        }
    }
    
    /**
     * Hiển thị lỗi cho trường cụ thể
     * @param {string} fieldName - Tên trường cần hiển thị lỗi
     * @param {string} message - Thông báo lỗi
     */
    function showFieldError(fieldName, message) {
        const fieldError = document.querySelector(`.field-error[data-for="${fieldName}"]`);
        if (fieldError) {
            fieldError.textContent = message;
            fieldError.style.display = 'block';
        } else {
            // Nếu không tìm thấy phần tử lỗi, hiển thị lỗi chung
            console.warn(`Không tìm thấy phần tử lỗi cho trường ${fieldName}`);
            const formErrorMessage = document.querySelector('.form-error-message');
            if (formErrorMessage) {
                formErrorMessage.textContent = message;
                formErrorMessage.style.display = 'block';
            } else {
                console.error('Không tìm thấy phần tử để hiển thị lỗi');
            }
        }
    }
    
    /**
     * Lấy mật khẩu thực tế từ CSDL
     * @param {number} userId - ID của người dùng
     * @param {function} callback - Hàm callback với mật khẩu
     */
    function getActualPassword(userId, callback) {
        console.log('Đang lấy mật khẩu thực từ CSDL cho userId:', userId);
        showLoading();
        
        // Gọi trực tiếp đến API để lấy mật khẩu từ CSDL
        fetch(API_ENDPOINTS.GET_PASSWORD(userId), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            hideLoading();
            if (!response.ok) {
                console.error('Lỗi khi lấy mật khẩu:', response.status, response.statusText);
                // Kiểm tra xem có thể parse response JSON hay không
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error(`Không thể lấy mật khẩu: ${response.status} ${response.statusText}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dữ liệu mật khẩu từ API:', data);
            if (data && data.password) {
                callback(data.password);
            } else if (data && data.hashedPassword) {
                callback(data.hashedPassword);
            } else if (data && data.message) {
                callback(data.message);
            } else {
                callback('Mật khẩu được mã hóa trong CSDL');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Lỗi khi lấy mật khẩu:', error);
            callback('Lỗi: ' + error.message);
        });
    }
    
    // API công khai của module
    return {
        init: init,
        searchUsers: searchUsers,
        applyFilters: applyFilters,
        showAddUserForm: showAddUserForm,
        showEditUserForm: showEditUserForm,
        toggleUserStatus: toggleUserStatus,
        softDeleteUser: softDeleteUser,
        deleteUser: deleteUser,
        showUserDetails: showUserDetails
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    UsersModule.init();
    
    // Thêm event listener cho nút thêm người dùng
    document.addEventListener('click', function(event) {
        // Chỉ kích hoạt khi nhấn nút "Thêm người dùng" để tránh nhầm lẫn với các nút khác
        if (event.target && event.target.textContent.trim() === 'Lưu') {
            event.preventDefault();
            console.log('Đã nhấn nút thêm người dùng');
            addUserSimple();
        }
        
        // Kiểm tra nút cập nhật/chỉnh sửa người dùng
        if (event.target && event.target.textContent.trim() === 'Lưu thay đổi') {
            event.preventDefault();
            console.log('Đã nhấn nút cập nhật người dùng');
            editUserSimple();
        }
    });
});

