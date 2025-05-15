document.addEventListener('DOMContentLoaded', function() {
    // Lấy thông tin người dùng từ API và hiển thị
    loadUserProfile();

    // Xử lý nút chỉnh sửa thông tin
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Kiểm tra trạng thái hiện tại của nút
            if (this.innerHTML.includes('Hủy')) {
                // Nếu nút đang ở trạng thái "Hủy" thì chuyển về chế độ xem
                toggleEditMode(false);
            } else {
                // Nếu nút đang ở trạng thái "Chỉnh sửa" thì chuyển sang chế độ chỉnh sửa
                toggleEditMode(true);
            }
        });
    }

    // Xử lý nút lưu thông tin
    const saveProfileBtn = document.querySelector('.save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            saveUserProfile();
        });
    }

    // Xử lý thay đổi ảnh đại diện
    const avatarOverlay = document.querySelector('.avatar-overlay');
    if (avatarOverlay) {
        avatarOverlay.addEventListener('click', function() {
            alert('Tính năng thay đổi ảnh đại diện sẽ được cập nhật trong phiên bản tiếp theo.');
        });
    }

    // Xử lý nút đổi mật khẩu
    const changePasswordBtn = document.querySelector('.change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            alert('Tính năng đổi mật khẩu sẽ được cập nhật trong phiên bản tiếp theo.');
        });
    }

    // Xử lý nút bật xác thực 2 lớp
    const enable2faBtn = document.querySelector('.enable-2fa-btn');
    if (enable2faBtn) {
        enable2faBtn.addEventListener('click', function() {
            alert('Tính năng xác thực 2 lớp sẽ được cập nhật trong phiên bản tiếp theo.');
        });
    }
});

// Hàm tải thông tin người dùng từ API
async function loadUserProfile() {
    try {
        // Lấy ID người dùng hiện tại
        const userId = AuthHelper.getCurrentUserId();
        if (!userId) {
            console.error('Không tìm thấy ID người dùng đăng nhập');
            return;
        }

        // Gọi API để lấy thông tin người dùng
        const response = await AuthHelper.fetchWithAuth(`/api/User/${userId}`);
        const userData = await response.json();

        // Hiển thị thông tin người dùng
        displayUserProfile(userData);
    } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        alert('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    }
}

// Hiển thị thông tin người dùng lên giao diện
function displayUserProfile(userData) {
    // Cập nhật tên và ID
    document.querySelector('.profile-basic-info h3').textContent = userData.fullName;
    document.querySelector('.profile-basic-info p').innerHTML = 
        `<i class="fas fa-id-card"></i> ID: ${userData.userId}`;

    // Cập nhật thông tin chi tiết
    updateProfileDetail('Họ tên đầy đủ', userData.fullName || 'Chưa cập nhật');
    updateProfileDetail('Ngày sinh', userData.dob ? new Date(userData.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật');
    updateProfileDetail('Giới tính', userData.gender === true ? 'Nam' : userData.gender === false ? 'Nữ' : 'Chưa cập nhật');
    updateProfileDetail('Email', userData.email || 'Chưa cập nhật');
    updateProfileDetail('Số điện thoại', userData.phone || 'Chưa cập nhật');
    updateProfileDetail('Địa chỉ', userData.address || 'Chưa cập nhật');

    // Cập nhật các giá trị trong form chỉnh sửa
    document.getElementById('profile-fullname').value = userData.fullName || '';
    
    // Định dạng ngày tháng cho input date
    if (userData.dob) {
        const dobDate = new Date(userData.dob);
        const year = dobDate.getFullYear();
        const month = String(dobDate.getMonth() + 1).padStart(2, '0');
        const day = String(dobDate.getDate()).padStart(2, '0');
        document.getElementById('profile-dob').value = `${year}-${month}-${day}`;
    } else {
        document.getElementById('profile-dob').value = '';
    }
    
    // Cập nhật các trường khác
    if (userData.gender !== null) {
        document.getElementById('profile-gender').value = userData.gender.toString();
    } else {
        document.getElementById('profile-gender').value = '';
    }
    
    document.getElementById('profile-email').value = userData.email || '';
    document.getElementById('profile-phone').value = userData.phone || '';
    document.getElementById('profile-address').value = userData.address || '';

    // Cập nhật sidebar
    const sidebarName = document.querySelector('.student-info h3');
    const sidebarID = document.querySelector('.student-info p');
    if (sidebarName) sidebarName.textContent = userData.fullName;
    if (sidebarID) sidebarID.textContent = `MSSV: ${userData.username}`;
}

// Cập nhật một mục thông tin chi tiết
function updateProfileDetail(label, value) {
    const detailItems = document.querySelectorAll('.detail-item');
    for (const item of detailItems) {
        const labelEl = item.querySelector('.detail-label');
        if (labelEl && labelEl.textContent === label) {
            item.querySelector('.detail-value.view-mode').textContent = value;
            break;
        }
    }
}

// Chuyển đổi giữa chế độ xem và chế độ chỉnh sửa
function toggleEditMode(isEditing) {
    const viewModeElements = document.querySelectorAll('.view-mode');
    const editModeElements = document.querySelectorAll('.edit-mode');
    const editBtn = document.querySelector('.edit-profile-btn');
    const saveBtn = document.querySelector('.save-profile-btn');
    
    if (isEditing) {
        // Chuyển sang chế độ chỉnh sửa
        viewModeElements.forEach(el => el.style.display = 'none');
        editModeElements.forEach(el => el.style.display = 'block');
        editBtn.innerHTML = '<i class="fas fa-times"></i> Hủy';
        saveBtn.style.display = 'block';
    } else {
        // Chuyển về chế độ xem
        viewModeElements.forEach(el => el.style.display = 'block');
        editModeElements.forEach(el => el.style.display = 'none');
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa';
        saveBtn.style.display = 'none';
        
        // Tải lại thông tin để hủy các thay đổi
        loadUserProfile();
    }
}

// Lưu thông tin người dùng sau khi chỉnh sửa
async function saveUserProfile() {
    try {
        // Lấy ID người dùng hiện tại
        const userId = AuthHelper.getCurrentUserId();
        if (!userId) {
            console.error('Không tìm thấy ID người dùng đăng nhập');
            return;
        }
        
        // Lấy dữ liệu từ form
        const fullName = document.getElementById('profile-fullname').value;
        const dob = document.getElementById('profile-dob').value;
        const gender = document.getElementById('profile-gender').value;
        const email = document.getElementById('profile-email').value;
        const phone = document.getElementById('profile-phone').value;
        const address = document.getElementById('profile-address').value;
        
        // Xác thực dữ liệu
        if (!fullName.trim()) {
            alert('Họ tên không được để trống');
            return;
        }
        
        // Lấy thông tin người dùng hiện tại
        const response = await AuthHelper.fetchWithAuth(`/api/User/${userId}`);
        const userData = await response.json();
        
        // Chuẩn bị dữ liệu để cập nhật
        const updateData = {
            userId: userId,
            fullName: fullName,
            dob: dob || null,
            gender: gender === "" ? null : gender === "true",
            email: email || null,
            phone: phone || null,
            address: address || null,
            status: userData.status
        };
        
        // Gọi API để cập nhật thông tin
        const updateResponse = await AuthHelper.fetchWithAuth(`/api/User/profile/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
            alert('Cập nhật thông tin thành công!');
            
            // Chuyển về chế độ xem và tải lại thông tin
            toggleEditMode(false);
            loadUserProfile();
        } else {
            const errorData = await updateResponse.json();
            alert(`Lỗi: ${errorData.message || 'Không thể cập nhật thông tin.'}`);
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin:', error);
        alert('Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau.');
    }
} 