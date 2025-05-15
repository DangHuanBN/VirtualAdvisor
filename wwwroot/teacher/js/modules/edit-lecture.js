// Biến toàn cục
let currentLecture = null;
// Sử dụng biến đã được khai báo trong file lectures.js nếu có, không khai báo lại
const baseApiUrl = window.baseUrl || '/api';
const userAuthToken = window.authToken || localStorage.getItem('token');

// Định nghĩa updateLecture trực tiếp trong file này để đảm bảo hàm này luôn tồn tại
const updateLecture = async (lectureId, lectureData) => {
    try {
        console.log(`Đang cập nhật bài giảng ID: ${lectureId}`, lectureData);
        
        // Thử gọi API cập nhật với PUT
        let response = await fetch(`${baseApiUrl}/lecture/${lectureId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${userAuthToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(lectureData)
        });
        
        console.log('Update response status (PUT):', response.status);
        
        // Nếu method PUT không được hỗ trợ, thử dùng POST
        if (response.status === 405 || response.status === 404) {
            console.log('PUT không được hỗ trợ, thử dùng POST với endpoint khác');
            
            response = await fetch(`${baseApiUrl}/lecture/update/${lectureId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userAuthToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lectureData)
            });
            
            console.log('Update response status (POST to /update):', response.status);
            
            // Nếu endpoint thứ hai không tồn tại, thử endpoint thứ ba
            if (response.status === 404) {
                console.log('Endpoint thứ hai không tồn tại, thử endpoint thứ ba');
                
                // Thêm lectureId vào body request
                const updatedData = {
                    ...lectureData,
                    lectureId: lectureId,
                    id: lectureId
                };
                
                response = await fetch(`${baseApiUrl}/lecture/update`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userAuthToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                });
                
                console.log('Update response status (POST to /update with ID in body):', response.status);
            }
        }
        
        // Kiểm tra response
        let text = '';
        try {
            text = await response.text();
            console.log('Update response text:', text && text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        } catch (e) {
            console.error('Không thể đọc response text:', e);
        }
        
        // Nếu response rỗng nhưng status OK, coi như thành công
        if ((!text || text.trim() === '') && response.ok) {
            return { success: true, message: 'Cập nhật thành công' };
        }
        
        // Parse JSON nếu có dữ liệu
        let data;
        try {
            data = text ? JSON.parse(text) : { success: false, message: 'Dữ liệu không hợp lệ' };
        } catch (e) {
            console.error('Lỗi khi parse JSON:', e);
            data = { success: response.ok, message: response.ok ? 'Cập nhật thành công' : 'Lỗi khi cập nhật bài giảng' };
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi khi cập nhật bài giảng');
        }
        
        return data;
    } catch (error) {
        console.error('Update lecture error:', error);
        throw error;
    }
};

// Đảm bảo LectureAPI luôn có phương thức updateLecture
if (typeof window.LectureAPI === 'undefined') {
    window.LectureAPI = {};
}
if (typeof window.LectureAPI.updateLecture !== 'function') {
    window.LectureAPI.updateLecture = updateLecture;
}

// Khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async function() {
    // Cập nhật tên giảng viên
    try {
        const user = AuthAPI.getCurrentUser();
        if (user) {
            const teacherNameElement = document.getElementById('teacherName');
            if (teacherNameElement) {
                const displayName = user.fullName || user.username || 'Giáo viên';
                teacherNameElement.textContent = displayName;
            }
        }
    } catch (error) {
        console.error("Lỗi khi hiển thị tên giảng viên:", error);
    }

    // Lấy lectureId từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const lectureId = urlParams.get('id');

    if (!lectureId) {
        showNotification('error', 'Không tìm thấy ID bài giảng');
        setTimeout(() => {
            window.location.href = 'lectures.html';
        }, 2000);
        return;
    }

    // Thiết lập sự kiện cho nút hủy
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'lectures.html';
        });
    }

    // Thiết lập sự kiện cho form chỉnh sửa
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleFormSubmit);
    }

    // Thiết lập sự kiện đếm ký tự cho textarea
    const contentTextarea = document.getElementById('content');
    if (contentTextarea) {
        contentTextarea.addEventListener('input', updateCharacterCount);
    }

    // Tải dữ liệu bài giảng
    try {
        showLoader();
        await loadLectureData(lectureId);
        hideLoader();
    } catch (error) {
        hideLoader();
        showNotification('error', error.message || 'Lỗi khi tải thông tin bài giảng');
        console.error('Error loading lecture:', error);
    }
});

// Hàm tải dữ liệu bài giảng
async function loadLectureData(lectureId) {
    try {
        console.log("Đang tải dữ liệu bài giảng ID:", lectureId);
        
        // Ưu tiên gọi API trực tiếp để lấy thông tin chi tiết bài giảng
        try {
            const lecture = await getLectureDetail(lectureId);
            
            if (lecture) {
                console.log("Đã tìm thấy bài giảng từ API:", lecture);
                // Lưu bài giảng hiện tại
                currentLecture = lecture;
                
                // Hiển thị thông tin bài giảng
                displayLectureInfo(lecture);
                
                // Điền thông tin vào form
                populateForm(lecture);
                return;
            }
        } catch (detailError) {
            console.error('Không thể lấy chi tiết bài giảng từ API:', detailError);
        }
        
        // Nếu không tìm thấy từ API chi tiết, thử phương pháp khác
        // Tìm bài giảng trong danh sách hiện có
        let lecture = null;
        
        if (window.allLectures && window.allLectures.length > 0) {
            console.log("Tìm bài giảng trong allLectures:", window.allLectures);
            lecture = window.allLectures.find(l => 
                (String(l.lectureId) === String(lectureId) || 
                 String(l.LectureId) === String(lectureId))
            );
        }
        
        // Nếu không tìm thấy, gọi API để lấy danh sách và tìm lại
        if (!lecture) {
            try {
                console.log("Lấy danh sách bài giảng từ API");
                // Gọi API lấy danh sách bài giảng
                const response = await fetch(`${baseApiUrl}/lecture/teacher`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${userAuthToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const lectures = data.data || data;
                
                if (lectures && lectures.length > 0) {
                    window.allLectures = lectures; // Lưu vào biến toàn cục để sử dụng sau này
                    console.log("Tìm bài giảng trong danh sách từ API:", lectures);
                    lecture = lectures.find(l => 
                        (String(l.lectureId) === String(lectureId) || 
                         String(l.LectureId) === String(lectureId))
                    );
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách bài giảng:', error);
            }
        }
        
        if (!lecture) {
            console.error("Không tìm thấy bài giảng nào với ID:", lectureId);
            throw new Error(`Không tìm thấy thông tin bài giảng ID: ${lectureId}`);
        }
        
        console.log("Đã tìm thấy bài giảng:", lecture);
        // Lưu bài giảng hiện tại
        currentLecture = lecture;
        
        // Hiển thị thông tin bài giảng
        displayLectureInfo(lecture);
        
        // Điền thông tin vào form
        populateForm(lecture);
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bài giảng:', error);
        throw error;
    }
}

// Hàm lấy chi tiết bài giảng qua API
async function getLectureDetail(lectureId) {
    try {
        console.log(`Đang gọi API lấy chi tiết bài giảng: ${baseApiUrl}/lecture/${lectureId}`);
        
        const response = await fetch(`${baseApiUrl}/lecture/${lectureId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userAuthToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log("API response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`Không thể lấy thông tin bài giảng (HTTP ${response.status})`);
        }
        
        const data = await response.json();
        console.log("Dữ liệu từ API:", data);
        
        // Kiểm tra cấu trúc dữ liệu để lấy đúng thông tin bài giảng
        if (data.data) {
            return data.data;
        } else if (data.success && data.data) {
            return data.data;
        } else {
            return data;
        }
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết bài giảng:', error);
        throw error;
    }
}

// Hàm hiển thị thông tin bài giảng
function displayLectureInfo(lecture) {
    console.log("Hiển thị thông tin bài giảng:", lecture);
    
    try {
        // Hiển thị thông tin cơ bản
        const subjectNameEl = document.getElementById('subjectName');
        if (subjectNameEl) {
            subjectNameEl.textContent = lecture.subjectName || lecture.SubjectName || 'Không có thông tin';
        }
        
        const courseNameEl = document.getElementById('courseName');
        if (courseNameEl) {
            courseNameEl.textContent = lecture.courseName || lecture.CourseName || 'Không có thông tin';
        }
        
        // Định dạng và hiển thị ngày tải lên
        const uploadDate = lecture.uploadDate || lecture.UploadDate;
        const uploadDateEl = document.getElementById('uploadDate');
        if (uploadDateEl) {
            uploadDateEl.textContent = uploadDate ? new Date(uploadDate).toLocaleDateString('vi-VN') : 'Không có thông tin';
        }
        
        // Hiển thị trạng thái
        const status = lecture.status || lecture.Status;
        const statusElement = document.getElementById('status');
        if (statusElement) {
            if (status === 'dahuanluyen') {
                statusElement.innerHTML = '<span class="status-badge status-trained">Đã huấn luyện</span>';
            } else {
                statusElement.innerHTML = '<span class="status-badge status-untrained">Chưa huấn luyện</span>';
            }
        }
        
        // Hiển thị thông tin tệp đính kèm
        const attachment = lecture.attachment || lecture.Attachment;
        const attachmentInfoElement = document.getElementById('attachmentInfo');
        
        if (attachmentInfoElement) {
            if (attachment) {
                const fileExt = attachment.split('.').pop().toLowerCase();
                let iconClass = 'fas fa-file';
                
                // Xác định icon dựa vào loại file
                if (fileExt === 'pdf') iconClass = 'fas fa-file-pdf';
                else if (fileExt === 'docx' || fileExt === 'doc') iconClass = 'fas fa-file-word';
                else if (fileExt === 'pptx' || fileExt === 'ppt') iconClass = 'fas fa-file-powerpoint';
                else if (fileExt === 'mp4') iconClass = 'fas fa-file-video';
                
                attachmentInfoElement.innerHTML = `
                    <i class="${iconClass}"></i>
                    <span>${attachment}</span>
                `;
            } else {
                attachmentInfoElement.innerHTML = '<span>Không có tệp đính kèm</span>';
            }
        }
    } catch (error) {
        console.error("Lỗi khi hiển thị thông tin bài giảng:", error);
    }
}

// Hàm điền thông tin vào form
function populateForm(lecture) {
    console.log("Điền thông tin vào form:", lecture);
    
    try {
        // Tìm tất cả các trường trong form và điền thông tin
        const lectureIdEl = document.getElementById('lectureId');
        if (lectureIdEl) {
            lectureIdEl.value = lecture.lectureId || lecture.LectureId || '';
        }
        
        const titleEl = document.getElementById('title');
        if (titleEl) {
            titleEl.value = lecture.title || lecture.Title || '';
        }
        
        const contentEl = document.getElementById('content');
        if (contentEl) {
            contentEl.value = lecture.content || lecture.Content || '';
        }
        
        const typeEl = document.getElementById('type');
        if (typeEl) {
            typeEl.value = lecture.type || lecture.Type || '';
        }
        
        const maxHoursEl = document.getElementById('maxHours');
        if (maxHoursEl) {
            maxHoursEl.value = lecture.maxHours || lecture.MaxHours || '';
        }
        
        const attachmentEl = document.getElementById('attachment');
        if (attachmentEl) {
            attachmentEl.value = lecture.attachment || lecture.Attachment || '';
        }
        
        // Cập nhật bộ đếm ký tự
        updateCharacterCount();
    } catch (error) {
        console.error("Lỗi khi điền thông tin vào form:", error);
    }
}

// Hàm cập nhật bộ đếm ký tự
function updateCharacterCount() {
    const textarea = document.getElementById('content');
    const counter = document.getElementById('contentCharCount');
    counter.textContent = textarea.value.length;
    
    // Đổi màu nếu gần đến giới hạn
    if (textarea.value.length > 4500) {
        counter.style.color = '#f44336';
    } else {
        counter.style.color = '#777';
    }
}

// Hàm xử lý khi submit form
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Kiểm tra form
    if (!validateForm()) return;
    
    // Tạo dữ liệu gửi đi
    const lectureId = document.getElementById('lectureId').value;
    const updateData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        type: document.getElementById('type').value,
        maxHours: parseFloat(document.getElementById('maxHours').value) || null,
        attachment: document.getElementById('attachment').value
    };
    
    try {
        showLoader();
        
        // Gọi hàm cập nhật bài giảng đã định nghĩa trực tiếp
        await updateLecture(lectureId, updateData);
        
        hideLoader();
        
        // Hiển thị thông báo thành công
        showNotification('success', 'Cập nhật bài giảng thành công');
        
        // Chuyển về trang danh sách sau 1 giây
        setTimeout(() => {
            window.location.href = 'lectures.html';
        }, 1000);
        
    } catch (error) {
        hideLoader();
        
        // Hiển thị thông báo lỗi
        showNotification('error', error.message || 'Lỗi khi cập nhật bài giảng');
        console.error('Error updating lecture:', error);
    }
}

// Hàm kiểm tra form
function validateForm() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const type = document.getElementById('type').value;
    
    if (!title) {
        showNotification('error', 'Vui lòng nhập tiêu đề bài giảng');
        document.getElementById('title').focus();
        return false;
    }
    
    if (!content) {
        showNotification('error', 'Vui lòng nhập mô tả bài giảng');
        document.getElementById('content').focus();
        return false;
    }
    
    if (content.length > 5000) {
        showNotification('error', 'Mô tả bài giảng không được vượt quá 5000 ký tự');
        document.getElementById('content').focus();
        return false;
    }
    
    if (!type) {
        showNotification('error', 'Vui lòng chọn loại bài giảng');
        document.getElementById('type').focus();
        return false;
    }
    
    return true;
}

// Hàm hiển thị loader
function showLoader() {
    // Tạo và hiển thị loader nếu chưa có
    if (!document.querySelector('.loader-overlay')) {
        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loader);
    }
}

// Hàm ẩn loader
function hideLoader() {
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        loader.remove();
    }
}

// Hàm hiển thị thông báo
function showNotification(type, message) {
    // Xóa thông báo cũ nếu có
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Tạo và hiển thị thông báo
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Xóa thông báo sau 3 giây
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 