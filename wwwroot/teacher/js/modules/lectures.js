// Các biến toàn cục cho module
let selectedFile = null;
const baseUrl = '/api';
const authToken = localStorage.getItem('token');
let allLectures = []; // Lưu trữ danh sách bài giảng để filter

// Chia sẻ biến để có thể sử dụng ở các file JavaScript khác
window.baseUrl = baseUrl;
window.authToken = authToken;
window.allLectures = allLectures;

// Biến cho phân trang
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalItems = 0;

// Hiển thị tên giảng viên từ localStorage
document.addEventListener('DOMContentLoaded', function() {
    try {
        const user = AuthAPI.getCurrentUser();
        if (user) {
            console.log("Thông tin user trong lectures.js:", user);
            const teacherNameElement = document.getElementById('teacherName');
            if (teacherNameElement) {
                const displayName = user.fullName || user.username || 'Giáo viên';
                teacherNameElement.textContent = displayName;
                console.log("Tên giảng viên đã được cập nhật:", displayName);
            } else {
                console.warn("Không tìm thấy phần tử teacherName");
            }
        } else {
            document.getElementById('teacherName').textContent = 'Giáo viên';
            console.warn("Không có thông tin người dùng");
        }
    } catch (error) {
        console.error("Lỗi khi hiển thị tên giảng viên:", error);
        document.getElementById('teacherName').textContent = 'Giáo viên';
    }
});

// Mảng ánh xạ loại file với icon
const fileIcons = {
    'pdf': 'fas fa-file-pdf',
    'docx': 'fas fa-file-word',
    'pptx': 'fas fa-file-powerpoint',
    'mp4': 'fas fa-file-video'
};

// Đối tượng API chứa các phương thức gọi API
const LectureAPI = {
    // Phương thức upload bài giảng
    uploadLecture: async (formData) => {
        try {
            const response = await fetch(`${baseUrl}/lecture/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            console.log('Upload response status:', response.status);
            
            // Kiểm tra response
            const text = await response.text();
            console.log('Upload response text:', text && text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            
            // Nếu response rỗng nhưng status OK, coi như thành công
            if (!text && response.ok) {
                return { success: true, message: 'Tải lên thành công' };
            }
            
            // Parse JSON nếu có dữ liệu
            const data = text ? JSON.parse(text) : { success: false, message: 'Dữ liệu không hợp lệ' };
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi tải lên bài giảng');
            }
            
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    },
    
    // Phương thức lấy loại khóa học
    getCourseType: async (courseId) => {
        try {
            const response = await fetch(`${baseUrl}/courses/${courseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Không thể lấy thông tin khóa học');
            }
            
            const data = await response.json();
            if (data && data.data && data.data.type) {
                return data.data.type;
            }
            
            return null;
        } catch (error) {
            console.error('Get course type error:', error);
            return null;
        }
    },
    
    // Phương thức cập nhật bài giảng
    updateLecture: async (lectureId, lectureData) => {
        try {
            console.log(`Đang cập nhật bài giảng ID: ${lectureId}`, lectureData);
            
            // Thử gọi API cập nhật với PUT
            let response = await fetch(`${baseUrl}/lecture/${lectureId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lectureData)
            });
            
            console.log('Update response status (PUT):', response.status);
            
            // Nếu method PUT không được hỗ trợ, thử dùng POST
            if (response.status === 405 || response.status === 404) {
                console.log('PUT không được hỗ trợ, thử dùng POST với endpoint khác');
                
                response = await fetch(`${baseUrl}/lecture/update/${lectureId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
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
                    
                    response = await fetch(`${baseUrl}/lecture/update`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
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
    },
    
    // Phương thức lấy danh sách môn học
    getAllSubjects: async () => {
        try {
            const response = await fetch(`${baseUrl}/subjects`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Subjects response status:', response.status);
            
            // Kiểm tra response
            const text = await response.text();
            console.log('Subjects response text:', text && text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            
            // Nếu response rỗng, trả về mảng rỗng
            if (!text) {
                console.warn('Subjects API trả về dữ liệu rỗng');
                return [];
            }
            
            // Parse JSON
            const data = JSON.parse(text);
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách môn học');
            }
            
            return data.data || [];
        } catch (error) {
            console.error('Get subjects error:', error);
            throw error;
        }
    },
    
    // Phương thức lấy danh sách khóa học theo môn học
    getCoursesBySubject: async (subjectId) => {
        try {
            const response = await fetch(`${baseUrl}/courses/by-subject/${subjectId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Courses response status:', response.status);
            
            // Kiểm tra response
            const text = await response.text();
            console.log('Courses response text:', text && text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            
            // Nếu response rỗng, trả về mảng rỗng
            if (!text) {
                console.warn('Courses API trả về dữ liệu rỗng');
                return [];
            }
            
            // Parse JSON
            const data = JSON.parse(text);
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách khóa học');
            }
            
            return data.data || [];
        } catch (error) {
            console.error('Get courses error:', error);
            throw error;
        }
    },
    
    // Phương thức lấy thông tin giảng viên đang đăng nhập
    getTeacherInfo: async () => {
        try {
            const response = await fetch(`${baseUrl}/teacher/info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Teacher info response status:', response.status);
            
            // Kiểm tra response
            const text = await response.text();
            console.log('Teacher info response text:', text);
            
            // Nếu response rỗng, trả về null
            if (!text) {
                console.warn('Teacher API trả về dữ liệu rỗng');
                return null;
            }
            
            // Parse JSON
            const data = JSON.parse(text);
            console.log('Teacher info parsed data:', data);
            
            return data;
        } catch (error) {
            console.error('Get teacher info error:', error);
            return null;
        }
    },
    
    // Phương thức lấy danh sách bài giảng theo giảng viên đang đăng nhập
    getLecturesByTeacher: async () => {
        try {
            // Lấy user_id của teacher từ token
            let userId = null;
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const tokenData = JSON.parse(window.atob(base64));
                    console.log('Token data:', tokenData);
                    userId = tokenData.nameId || tokenData.id || tokenData.userId || tokenData.nameid;
                    console.log('User ID của teacher:', userId);
                    
                    if (!userId) {
                        throw new Error('Không tìm thấy ID giảng viên trong token');
                    }
                } else {
                    throw new Error('Không tìm thấy token đăng nhập');
                }
            } catch (e) {
                console.error('Không thể lấy ID giảng viên:', e);
                throw new Error('Không thể xác định giảng viên đang đăng nhập');
            }
            
            // Thử nhiều endpoint API khác nhau để lấy bài giảng
            console.log(`Đang lấy bài giảng cho giảng viên ID: ${userId}`);
            
            // Thử endpoint đầu tiên - API teacher hiện tại lấy bài giảng của giảng viên đăng nhập
            let response = await fetch(`${baseUrl}/lecture/teacher`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('First API response status:', response.status);
            
            // Nếu API đầu tiên không tồn tại, thử endpoint thứ hai
            if (response.status === 404) {
                console.log('API thứ nhất không tồn tại, thử API thứ hai');
                
                response = await fetch(`${baseUrl}/lecture/by-teacher/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Second API response status:', response.status);
            }
            
            // Nếu API thứ hai không tồn tại, thử endpoint thứ ba
            if (response.status === 404) {
                console.log('API thứ hai không tồn tại, thử API thứ ba');
                
                // Lấy tất cả bài giảng và lọc theo teacher_id
                response = await fetch(`${baseUrl}/lecture`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Third API response status:', response.status);
                
                if (response.status === 404) {
                    throw new Error('Không tìm thấy API lấy bài giảng trên hệ thống');
                }
                
                const text = await response.text();
                
                if (!text) {
                    console.warn('API trả về dữ liệu rỗng');
                    return [];
                }
                
                // Parse dữ liệu
                const data = JSON.parse(text);
                console.log('Tất cả bài giảng:', data);
                
                // Lọc bài giảng theo ID giảng viên
                if (Array.isArray(data)) {
                    const filteredData = data.filter(item => 
                        String(item.teacher_id) === String(userId) || 
                        String(item.user_id) === String(userId) ||
                        String(item.teacherId) === String(userId)
                    );
                    console.log('Bài giảng đã lọc theo giảng viên:', filteredData);
                    return filteredData;
                }
                
                if (data.data && Array.isArray(data.data)) {
                    const filteredData = data.data.filter(item => 
                        String(item.teacher_id) === String(userId) || 
                        String(item.user_id) === String(userId) ||
                        String(item.teacherId) === String(userId)
                    );
                    console.log('Bài giảng đã lọc theo giảng viên:', filteredData);
                    return filteredData;
                }
                
                return []; // Trả về mảng rỗng nếu không tìm thấy
            }
            
            // Xử lý response từ API nếu không phải 404
            const text = await response.text();
            console.log('Lectures response text:', text);
            
            if (!text) {
                console.warn('Lectures API trả về dữ liệu rỗng');
                return [];
            }
            
            const data = JSON.parse(text);
            console.log('Parsed lecture data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi lấy danh sách bài giảng');
            }
            
            // Trả về dữ liệu phù hợp
            if (Array.isArray(data)) {
                return data;
            }
            
            if (data.data && Array.isArray(data.data)) {
                return data.data;
            }
            
            console.warn('Dữ liệu trả về không đúng định dạng mảng:', data);
            return [];
        } catch (error) {
            console.error('Get lectures error:', error);
            throw error;
        }
    },
    
    // Phương thức xóa bài giảng
    deleteLecture: async (lectureId) => {
        try {
            console.log(`Đang cố gắng xóa bài giảng ID: ${lectureId}`);
            
            // Thử endpoint thứ nhất - DELETE /api/lecture/{lectureId}
            let response = await fetch(`${baseUrl}/lecture/${lectureId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Endpoint 1 - DELETE status:', response.status);
            
            // Nếu endpoint thứ nhất không tồn tại, thử endpoint thứ hai
            if (response.status === 404) {
                console.log('Endpoint thứ nhất không tồn tại, thử endpoint thứ hai');
                
                // Có thể API endpoint là /api/lecture/delete/{lectureId}
                response = await fetch(`${baseUrl}/lecture/delete/${lectureId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Endpoint 2 - DELETE status:', response.status);
            }
            
            // Nếu endpoint thứ hai cũng không tồn tại, thử endpoint thứ ba
            if (response.status === 404) {
                console.log('Endpoint thứ hai không tồn tại, thử endpoint thứ ba');
                
                // Có thể API endpoint dùng POST thay vì DELETE
                response = await fetch(`${baseUrl}/lecture/delete`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: lectureId })
                });
                
                console.log('Endpoint 3 - POST status:', response.status);
            }
            
            // Kiểm tra response
            let text = '';
            try {
                text = await response.text();
                console.log('Delete response text:', text && text.substring(0, 100) + (text.length > 100 ? '...' : ''));
            } catch (e) {
                console.error('Không thể đọc response text:', e);
            }
            
            // Nếu response rỗng nhưng status OK, coi như thành công
            if ((!text || text.trim() === '') && response.ok) {
                return { success: true, message: 'Xóa thành công' };
            }
            
            // Parse JSON nếu có dữ liệu
            let data;
            try {
                data = text ? JSON.parse(text) : { success: false, message: 'Dữ liệu không hợp lệ' };
            } catch (e) {
                console.error('Lỗi khi parse JSON:', e);
                data = { success: response.ok, message: response.ok ? 'Xóa thành công' : 'Lỗi khi xóa bài giảng' };
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Lỗi khi xóa bài giảng');
            }
            
            return data;
        } catch (error) {
            console.error('Delete lecture error:', error);
            throw error;
        }
    },
    
    // Thêm phương thức để lọc bài giảng theo nhiều tiêu chí
    filterLectures: async (filterParams) => {
        try {
            // Tạo URL với các tham số query - sửa cách tạo URL
            let urlStr = `${window.location.origin}${baseUrl}/lecture/filter`;
            let url = new URL(urlStr);
            
            // Thêm các tham số search vào URL
            if (filterParams.searchText) {
                url.searchParams.append('SearchText', filterParams.searchText);
            }
            if (filterParams.subjectId) {
                url.searchParams.append('SubjectId', filterParams.subjectId);
            }
            if (filterParams.courseId) {
                url.searchParams.append('CourseId', filterParams.courseId);
            }
            if (filterParams.type) {
                url.searchParams.append('Type', filterParams.type);
            }
            if (filterParams.sortBy) {
                url.searchParams.append('SortBy', filterParams.sortBy);
            }
            
            console.log('Filter URL:', url.toString());
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Filter response status:', response.status);
            
            const text = await response.text();
            if (!text) {
                return [];
            }
            
            const data = JSON.parse(text);
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Lỗi khi lọc bài giảng');
            }
            
            return data.data || [];
        } catch (error) {
            console.error('Filter lectures error:', error);
            throw error;
        }
    },
    
    // Phương thức lấy danh sách bài giảng theo giảng viên đang đăng nhập có phân trang
    getLecturesByTeacherPaged: async (pageNumber = 1, pageSize = 10) => {
        try {
            const response = await fetch(`${baseUrl}/lecture/teacher/paged?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Paged lectures response status:', response.status);
            
            if (!response.ok) {
                // Nếu API phân trang không tồn tại, thử gọi API không phân trang
                if (response.status === 404) {
                    console.log('API phân trang không tồn tại, thử API không phân trang');
                    const oldResponse = await LectureAPI.getLecturesByTeacher();
                    
                    // Tạo kết quả phân trang thủ công
                    const startIndex = (pageNumber - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const items = oldResponse.slice(startIndex, endIndex);
                    const totalItems = oldResponse.length;
                    const totalPages = Math.ceil(totalItems / pageSize);
                    
                    return {
                        items: items,
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                        totalCount: totalItems,
                        totalPages: totalPages,
                        hasPreviousPage: pageNumber > 1,
                        hasNextPage: pageNumber < totalPages
                    };
                }
                
                throw new Error('Không thể lấy danh sách bài giảng');
            }
            
            const data = await response.json();
            console.log('Paged lectures data:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Không thể lấy danh sách bài giảng');
            }
            
            return {
                items: data.data || [],
                pageNumber: data.pagination.pageNumber,
                pageSize: data.pagination.pageSize,
                totalCount: data.pagination.totalCount,
                totalPages: data.pagination.totalPages,
                hasPreviousPage: data.pagination.hasPreviousPage,
                hasNextPage: data.pagination.hasNextPage
            };
        } catch (error) {
            console.error('Get paged lectures error:', error);
            throw error;
        }
    },
    
    // Phương thức lọc bài giảng có phân trang
    getFilteredLecturesPaged: async (filter) => {
        try {
            // Xây dựng query string từ filter
            const params = new URLSearchParams();
            if (filter.searchText) params.append('searchText', filter.searchText);
            if (filter.subjectId) params.append('subjectId', filter.subjectId);
            if (filter.courseId) params.append('courseId', filter.courseId);
            if (filter.type) params.append('type', filter.type);
            if (filter.sortBy) params.append('sortBy', filter.sortBy);
            params.append('pageNumber', filter.pageNumber || 1);
            params.append('pageSize', filter.pageSize || 10);
            
            const response = await fetch(`${baseUrl}/lecture/filter/paged?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Filtered paged lectures response status:', response.status);
            
            if (!response.ok) {
                // Nếu API phân trang không tồn tại, thử gọi API không phân trang
                if (response.status === 404) {
                    console.log('API lọc phân trang không tồn tại, thử API lọc không phân trang');
                    
                    // Sử dụng API lọc không phân trang và tự phân trang kết quả
                    const oldFilter = { ...filter };
                    delete oldFilter.pageNumber;
                    delete oldFilter.pageSize;
                    
                    const oldResponse = await LectureAPI.getFilteredLectures(oldFilter);
                    
                    // Tạo kết quả phân trang thủ công
                    const pageNumber = filter.pageNumber || 1;
                    const pageSize = filter.pageSize || 10;
                    const startIndex = (pageNumber - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const items = oldResponse.slice(startIndex, endIndex);
                    const totalItems = oldResponse.length;
                    const totalPages = Math.ceil(totalItems / pageSize);
                    
                    return {
                        items: items,
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                        totalCount: totalItems,
                        totalPages: totalPages,
                        hasPreviousPage: pageNumber > 1,
                        hasNextPage: pageNumber < totalPages
                    };
                }
                
                throw new Error('Không thể lọc danh sách bài giảng');
            }
            
            const data = await response.json();
            console.log('Filtered paged lectures data:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Không thể lọc danh sách bài giảng');
            }
            
            return {
                items: data.data || [],
                pageNumber: data.pagination.pageNumber,
                pageSize: data.pagination.pageSize,
                totalCount: data.pagination.totalCount,
                totalPages: data.pagination.totalPages,
                hasPreviousPage: data.pagination.hasPreviousPage,
                hasNextPage: data.pagination.hasNextPage
            };
        } catch (error) {
            console.error('Get filtered paged lectures error:', error);
            throw error;
        }
    }
};

// Khởi tạo sự kiện khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    // Lấy các tham chiếu đến các element
    const uploadModal = document.getElementById('uploadModal');
    const uploadBtn = document.getElementById('uploadBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const filePreview = document.getElementById('filePreview');
    const subjectSelect = document.getElementById('subjectId');
    const courseSelect = document.getElementById('courseId');
    
    // Khởi tạo các filter và load dữ liệu
    initializeFilters();
    loadLectures();
    
    // Hiển thị modal khi nhấn nút Upload
    uploadBtn.addEventListener('click', () => {
        // Load danh sách môn học nếu chưa có
        if (subjectSelect.options.length <= 1) {
            loadSubjects();
        }
        uploadModal.style.display = 'block';
    });
    
    // Đóng modal khi nhấn nút đóng
    closeBtn.addEventListener('click', () => {
        uploadModal.style.display = 'none';
        resetForm();
    });
    
    // Đóng modal khi nhấn nút hủy
    cancelBtn.addEventListener('click', () => {
        uploadModal.style.display = 'none';
        resetForm();
    });
    
    // Đóng modal khi click bên ngoài
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.style.display = 'none';
            resetForm();
        }
    });
    
    // Xử lý khi chọn file
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            previewFile(file);
        }
    });
    
    // Xử lý khi chọn môn học, load danh sách khóa học tương ứng
    subjectSelect.addEventListener('change', async () => {
        const subjectId = subjectSelect.value;
        
        // Reset khóa học
        resetCourseSelect();
        
        if (!subjectId) return;
        
        try {
            // Gọi API lấy danh sách khóa học theo môn học
            showLoader();
            const courses = await LectureAPI.getCoursesBySubject(subjectId);
            hideLoader();
            
            // Render danh sách khóa học
            if (courses && courses.length > 0) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    courseSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Không có khóa học nào";
                courseSelect.appendChild(option);
            }
        } catch (error) {
            hideLoader();
            showNotification('error', error.message || 'Không thể lấy danh sách khóa học');
        }
    });
    
    // Xử lý submit form
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Tạo formData
        const formData = new FormData();
        formData.append('courseId', courseSelect.value);
        formData.append('title', document.getElementById('title').value);
        formData.append('content', document.getElementById('content').value);
        formData.append('type', document.getElementById('type').value);
        formData.append('file', selectedFile);
        
        // Thêm maxHours nếu có
        const maxHoursValue = document.getElementById('maxHours').value;
        if (maxHoursValue) {
            formData.append('maxHours', maxHoursValue);
        }
        
        try {
            // Hiển thị loader
            showLoader();
            
            // Gọi API upload
            const result = await LectureAPI.uploadLecture(formData);
            
            // Ẩn loader
            hideLoader();
            
            // Đóng modal và reset form
            uploadModal.style.display = 'none';
            resetForm();
            
            // Hiển thị thông báo thành công
            showNotification('success', 'Tải lên bài giảng thành công!');
            
            // Reload danh sách bài giảng
            loadLectures();
        } catch (error) {
            // Ẩn loader
            hideLoader();
            
            // Hiển thị thông báo lỗi
            showNotification('error', error.message || 'Lỗi khi tải lên bài giảng');
        }
    });
    
    // Hàm load danh sách bài giảng của giảng viên
    async function loadLectures() {
        try {
            showLoader();
            const result = await LectureAPI.getLecturesByTeacherPaged(currentPage, pageSize);
            hideLoader();
            
            // Cập nhật biến phân trang
            currentPage = result.pageNumber;
            pageSize = result.pageSize;
            totalPages = result.totalPages;
            totalItems = result.totalCount;
            
            // Lưu trữ danh sách bài giảng
            allLectures = result.items || [];
            
            // Thiết lập filter ban đầu
            window.currentSearchText = '';
            window.currentSubjectId = '';
            window.currentCourseId = '';
            window.currentType = '';
            window.currentSortBy = '';
            
            // Hiển thị danh sách bài giảng
            renderLectures(result.items);
            
            // Hiển thị phân trang
            renderPagination();
        } catch (error) {
            hideLoader();
            showNotification('error', error.message || 'Không thể tải danh sách bài giảng');
        }
    }
    
    // Hàm render danh sách bài giảng
    function renderLectures(lectures) {
        const lectureCards = document.querySelector('.lecture-cards');
        if (!lectureCards) return;
        
        console.log('Lectures data:', lectures); // Debug để xem dữ liệu
        
        // Xóa tất cả các bài giảng hiện tại
        lectureCards.innerHTML = '';
        
        if (lectures && lectures.length > 0) {
            lectures.forEach(lecture => {
                // Kiểm tra các thuộc tính với nhiều cách viết khác nhau (cả hoa lẫn thường)
                const lectureId = lecture.LectureId || lecture.lectureId;
                const courseId = lecture.CourseId || lecture.courseId;
                const subjectId = lecture.SubjectId || lecture.subjectId;
                const title = lecture.Title || lecture.title || 'Chưa có tiêu đề';
                const content = lecture.Content || lecture.content || '';
                const type = lecture.Type || lecture.type || '';
                const status = lecture.Status || lecture.status || '';
                const attachment = lecture.Attachment || lecture.attachment || '';
                const uploadDate = lecture.UploadDate || lecture.uploadDate;
                const courseName = lecture.CourseName || lecture.courseName || ``;
                const subjectName = lecture.SubjectName || lecture.subjectName || ``;
                const maxHours = lecture.MaxHours || lecture.maxHours;
                
                // Debug để xem các giá trị
                console.log('Lecture values:', { 
                    lectureId, courseId, title, courseName, subjectName 
                });
                
                // Xác định icon dựa vào loại file
                let iconClass = 'fa-file';
                if (attachment) {
                    const fileExt = attachment.split('.').pop().toLowerCase();
                    if (fileExt === 'pdf') iconClass = 'fa-file-pdf';
                    else if (fileExt === 'docx' || fileExt === 'doc') iconClass = 'fa-file-word';
                    else if (fileExt === 'pptx' || fileExt === 'ppt') iconClass = 'fa-file-powerpoint';
                    else if (fileExt === 'mp4') iconClass = 'fa-file-video';
                }
                
                // Tạo định dạng hiển thị ngày
                const formattedDate = uploadDate 
                    ? new Date(uploadDate).toLocaleDateString('vi-VN') 
                    : 'Chưa cập nhật';
                
                // Tạo label hiển thị loại bài giảng
                let typeLabel = 'Bài giảng';
                if (type === 'baikiemtra') typeLabel = 'Bài kiểm tra';
                else if (type === 'baithi') typeLabel = 'Bài thi';
                
                const lectureCard = `
                    <div class="lecture-card" data-id="${lectureId}">
                        <div class="lecture-thumbnail">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="lecture-info">
                            <h3 class="lecture-title">${title}</h3>
                            <div class="lecture-meta">
                                <p><i class="fas fa-graduation-cap"></i> ${subjectName}</p>
                                <p><i class="fas fa-book"></i> ${courseName}</p>
                                <p><i class="fas fa-clock"></i> Đăng tải: ${formattedDate}</p>
                                <p><i class="fas fa-tag"></i> ${typeLabel}</p>
                                ${maxHours ? `<p><i class="fas fa-hourglass"></i> Số giờ tối đa: ${maxHours}</p>` : ''}
                            </div>
                            <div class="lecture-actions">
                                <button class="edit-lecture" data-id="${lectureId}"><i class="fas fa-edit"></i> Chỉnh sửa</button>
                                <button class="delete-lecture" data-id="${lectureId}"><i class="fas fa-trash"></i> Xóa</button>
                            </div>
                        </div>
                    </div>
                `;
                
                lectureCards.innerHTML += lectureCard;
            });
            
            // Gắn sự kiện cho các nút
            attachLectureEvents();
        } else {
            lectureCards.innerHTML = `
                <div class="empty-lectures">
                    <i class="fas fa-folder-open"></i>
                    <p>Chưa có bài giảng nào</p>
                </div>
            `;
        }
    }
    
    // Hàm gắn sự kiện cho các nút trong danh sách bài giảng
    function attachLectureEvents() {
        // Gắn sự kiện cho mỗi card bài giảng (hiển thị thông tin chi tiết khi click)
        document.querySelectorAll('.lecture-card').forEach(card => {
            card.addEventListener('click', () => {
                const lectureId = card.dataset.id;
                // Xử lý khi click vào card (nếu cần)
                console.log('Clicked on lecture:', lectureId);
            });
        });
        
        // Gắn sự kiện nút Edit
        document.querySelectorAll('.edit-lecture').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn sự kiện nổi bọt lên card
                const lectureId = e.currentTarget.dataset.id;
                // Chuyển đến trang edit lecture
                window.location.href = `edit-lecture.html?id=${lectureId}`;
            });
        });
        
        // Gắn sự kiện nút Delete
        document.querySelectorAll('.delete-lecture').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation(); // Ngăn sự kiện nổi bọt lên card
                const lectureId = e.currentTarget.dataset.id;
                const lectureTitle = e.currentTarget.closest('.lecture-card').querySelector('.lecture-title').textContent;
                
                // Hiển thị hộp thoại xác nhận với tiêu đề bài giảng
                if (confirm(`Bạn có chắc chắn muốn xóa bài giảng "${lectureTitle}"?`)) {
                    try {
                        console.log(`Bắt đầu xóa bài giảng ID: ${lectureId}`);
                        showLoader();
                        
                        // Thêm một thông báo đang xóa
                        const deletingNotification = document.createElement('div');
                        deletingNotification.className = 'notification info';
                        deletingNotification.innerHTML = `
                            <div class="notification-content">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Đang xóa bài giảng "${lectureTitle}"...</p>
                            </div>
                        `;
                        document.body.appendChild(deletingNotification);
                        
                        // Gọi API xóa
                        const result = await LectureAPI.deleteLecture(lectureId);
                        
                        // Xóa thông báo đang xóa
                        deletingNotification.remove();
                        
                        // Ẩn loader
                        hideLoader();
                        
                        // Hiển thị thông báo thành công
                        showNotification('success', `Xóa bài giảng "${lectureTitle}" thành công!`);
                        
                        // Reload danh sách bài giảng
                        console.log('Gọi loadLectures để tải lại danh sách sau khi xóa');
                        loadLectures();
                    } catch (error) {
                        // Ẩn loader
                        hideLoader();
                        
                        // Hiển thị thông báo lỗi chi tiết hơn
                        console.error('Lỗi khi xóa bài giảng:', error);
                        showNotification('error', `Lỗi khi xóa bài giảng: ${error.message || 'Không rõ lỗi'}`);
                        
                        // Thử tải lại danh sách để đảm bảo dữ liệu hiển thị là mới nhất
                        try {
                            console.log('Vẫn thử tải lại danh sách sau khi gặp lỗi');
                            loadLectures();
                        } catch(reloadError) {
                            console.error('Lỗi khi tải lại danh sách:', reloadError);
                        }
                    }
                }
            });
        });
    }
    
    // Hàm khởi tạo các filter
    function initializeFilters() {
        // Load dữ liệu cho combobox môn học
        loadSubjectsForFilter();
        
        // Gắn sự kiện cho ô tìm kiếm và các bộ lọc
        setupFilters();
    }
    
    // Hàm load danh sách môn học cho filter
    async function loadSubjectsForFilter() {
        const subjectFilter = document.getElementById('subjectFilter');
        if (!subjectFilter) return;
        
        try {
            showLoader();
            const subjects = await LectureAPI.getAllSubjects();
            hideLoader();
            
            if (subjects && subjects.length > 0) {
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = subject.name;
                    subjectFilter.appendChild(option);
                });
            }
        } catch (error) {
            hideLoader();
            console.error('Error loading subjects for filter:', error);
        }
    }
    
    // Hàm thiết lập các filter
    function setupFilters() {
        // Lấy các phần tử DOM
        const searchBox = document.querySelector('.search-box input');
        const searchButton = document.querySelector('.search-box button');
        const subjectFilter = document.getElementById('subjectFilter');
        const courseFilter = document.getElementById('courseFilter');
        const typeFilter = document.getElementById('typeFilter');
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        // Xử lý tìm kiếm
        searchButton.addEventListener('click', () => {
            applyFilters();
        });
        
        // Xử lý tìm kiếm khi nhấn Enter
        searchBox.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
        
        // Xử lý thay đổi filter
        subjectFilter.addEventListener('change', () => {
            // Nếu thay đổi môn học, reset filter khóa học
            if (subjectFilter.value) {
                loadCoursesForFilter(subjectFilter.value);
            } else {
                // Reset filter khóa học
                courseFilter.innerHTML = '<option value="">Tất cả khóa học</option>';
            }
            applyFilters();
        });
        
        courseFilter.addEventListener('change', () => {
            applyFilters();
        });
        
        typeFilter.addEventListener('change', () => {
            applyFilters();
        });
        
        // Xử lý click vào các tab
        filterTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Xóa class active
                filterTabs.forEach(t => t.classList.remove('active'));
                // Thêm class active cho tab được click
                tab.classList.add('active');
                
                // Đặt lại các filter khác
                searchBox.value = '';
                subjectFilter.value = '';
                courseFilter.innerHTML = '<option value="">Tất cả khóa học</option>';
                typeFilter.value = '';
                
                // Áp dụng filter dựa trên tab
                let filterType = '';
                let sortBy = '';
                
                switch (index) {
                    case 0: // Tất cả bài giảng
                        break;
                    case 1: // Bài giảng lý thuyết
                        filterType = 'baigiang';
                        break;
                    case 2: // Bài kiểm tra
                        filterType = 'baikiemtra';
                        break;
                    case 3: // Bài thi
                        filterType = 'baithi';
                        break;
                    case 4: // Gần đây nhất
                        sortBy = 'recent';
                        break;
                    case 5: // Được xem nhiều nhất
                        sortBy = 'popular';
                        break;
                }
                
                if (filterType) {
                    typeFilter.value = filterType;
                }
                
                // Apply filters with sort by option
                applyFilters(sortBy);
            });
        });
    }
    
    // Hàm áp dụng các filter và tải lại danh sách
    async function applyFilters(sortByOverride) {
        try {
            // Hiện loader
            showLoader();
            
            // Lấy giá trị các filter
            const searchText = document.querySelector('.search-box input').value;
            const subjectId = document.getElementById('subjectFilter').value;
            const courseId = document.getElementById('courseFilter').value;
            const type = document.getElementById('typeFilter').value;
            const sortBy = sortByOverride || '';
            
            // Reset về trang đầu tiên khi áp dụng filter mới nếu tham số đã thay đổi
            if (searchText !== window.currentSearchText || 
                subjectId !== window.currentSubjectId || 
                courseId !== window.currentCourseId || 
                type !== window.currentType || 
                sortBy !== window.currentSortBy) {
                currentPage = 1;
            }
            
            // Lưu lại tham số filter hiện tại
            window.currentSearchText = searchText;
            window.currentSubjectId = subjectId;
            window.currentCourseId = courseId;
            window.currentType = type;
            window.currentSortBy = sortBy;
            
            // Tạo object filter
            const filterParams = {
                searchText: searchText,
                subjectId: subjectId,
                courseId: courseId,
                type: type,
                sortBy: sortBy,
                pageNumber: currentPage,
                pageSize: pageSize
            };
            
            console.log('Applying filters:', filterParams);
            
            // Gọi API lọc bài giảng có phân trang
            const result = await LectureAPI.getFilteredLecturesPaged(filterParams);
            
            // Ẩn loader
            hideLoader();
            
            // Cập nhật biến phân trang
            currentPage = result.pageNumber;
            pageSize = result.pageSize;
            totalPages = result.totalPages;
            totalItems = result.totalCount;
            
            // Render lại danh sách bài giảng
            renderLectures(result.items);
            
            // Render lại phân trang
            renderPagination();
        } catch (error) {
            // Ẩn loader
            hideLoader();
            
            // Hiển thị thông báo lỗi
            showNotification('error', error.message || 'Lỗi khi lọc bài giảng');
            
            // Render danh sách rỗng
            renderLectures([]);
            
            // Reset phân trang
            totalPages = 1;
            totalItems = 0;
            renderPagination();
        }
    }
    
    // Hàm load danh sách môn học cho form tải lên
    async function loadSubjects() {
        try {
            showLoader();
            const subjects = await LectureAPI.getAllSubjects();
            hideLoader();
            
            // Reset trước khi thêm
            subjectSelect.innerHTML = '<option value="">-- Chọn Môn học --</option>';
            
            if (subjects && subjects.length > 0) {
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id;
                    option.textContent = subject.name;
                    subjectSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Không có môn học nào";
                subjectSelect.appendChild(option);
                
                showNotification('error', 'Không có môn học nào trong hệ thống');
            }
        } catch (error) {
            hideLoader();
            showNotification('error', error.message || 'Không thể lấy danh sách môn học');
        }
    }
    
    // Hàm reset select khóa học
    function resetCourseSelect() {
        courseSelect.innerHTML = '<option value="">-- Chọn Khóa học --</option>';
    }
    
    // Hàm hiển thị preview file
    function previewFile(file) {
        const fileSize = formatFileSize(file.size);
        const fileType = file.name.split('.').pop().toLowerCase();
        const iconClass = fileIcons[fileType] || 'fas fa-file';
        
        filePreview.innerHTML = `
            <div class="preview-item">
                <i class="${iconClass}"></i>
                <div class="file-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${fileSize}</p>
                </div>
                <button type="button" class="remove-file">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Thêm sự kiện xóa file
        document.querySelector('.remove-file').addEventListener('click', () => {
            filePreview.innerHTML = '';
            fileInput.value = '';
            selectedFile = null;
        });
    }
    
    // Hàm format kích thước file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Hàm validate form
    function validateForm() {
        // Kiểm tra môn học
        if (!subjectSelect.value) {
            showNotification('error', 'Vui lòng chọn môn học');
            return false;
        }
        
        // Kiểm tra khóa học
        if (!courseSelect.value) {
            showNotification('error', 'Vui lòng chọn khóa học');
            return false;
        }
        
        // Kiểm tra tiêu đề
        const title = document.getElementById('title').value;
        if (!title) {
            showNotification('error', 'Vui lòng nhập tiêu đề bài giảng');
            return false;
        }
        
        // Kiểm tra mô tả
        const content = document.getElementById('content').value;
        if (!content) {
            showNotification('error', 'Vui lòng nhập mô tả bài giảng');
            return false;
        }
        
        // Kiểm tra loại bài giảng
        const type = document.getElementById('type').value;
        if (!type) {
            showNotification('error', 'Vui lòng chọn loại bài giảng');
            return false;
        }
        
        // Kiểm tra số giờ học tối đa
        const maxHours = document.getElementById('maxHours').value;
        if (maxHours && (isNaN(maxHours) || parseInt(maxHours) <= 0)) {
            showNotification('error', 'Thời gian học tối đa phải là số dương');
            return false;
        }
        
        // Kiểm tra file
        if (!selectedFile) {
            showNotification('error', 'Vui lòng chọn file đính kèm');
            return false;
        }
        
        return true;
    }
    
    // Hàm reset form
    function resetForm() {
        uploadForm.reset();
        filePreview.innerHTML = '';
        selectedFile = null;
        resetCourseSelect();
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
    
    // Hàm load danh sách khóa học theo môn học cho filter
    async function loadCoursesForFilter(subjectId) {
        const courseFilter = document.getElementById('courseFilter');
        
        // Reset filter khóa học
        courseFilter.innerHTML = '<option value="">Tất cả khóa học</option>';
        
        if (!subjectId) return;
        
        try {
            showLoader();
            const courses = await LectureAPI.getCoursesBySubject(subjectId);
            hideLoader();
            
            if (courses && courses.length > 0) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id || course.courseId;
                    option.textContent = course.name || course.courseName;
                    courseFilter.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Không có khóa học nào";
                courseFilter.appendChild(option);
            }
        } catch (error) {
            hideLoader();
            console.error('Error loading courses for filter:', error);
            showNotification('error', 'Không thể tải danh sách khóa học');
        }
    }
    
    // Hàm hiển thị phân trang
    function renderPagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;
        
        // Xóa phân trang hiện tại
        paginationContainer.innerHTML = '';
        
        // Không hiển thị phân trang nếu chỉ có 1 trang
        if (totalPages <= 1) return;
        
        // Tạo nút Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = `page-btn prev ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilters(window.currentSortBy);
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Tạo các nút số trang
        const maxPagesToShow = 3; // Số lượng nút số trang tối đa hiển thị
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        // Điều chỉnh lại startPage nếu cần
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // Thêm nút trang đầu tiên nếu không hiển thị
        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'page-btn';
            firstPageBtn.textContent = '1';
            firstPageBtn.addEventListener('click', () => {
                currentPage = 1;
                applyFilters(window.currentSortBy);
            });
            paginationContainer.appendChild(firstPageBtn);
            
            // Thêm dấu ... nếu cần
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
        }
        
        // Tạo các nút số trang
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i.toString();
            pageBtn.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    applyFilters(window.currentSortBy);
                }
            });
            paginationContainer.appendChild(pageBtn);
        }
        
        // Thêm nút trang cuối cùng nếu không hiển thị
        if (endPage < totalPages) {
            // Thêm dấu ... nếu cần
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'page-btn';
            lastPageBtn.textContent = totalPages.toString();
            lastPageBtn.addEventListener('click', () => {
                currentPage = totalPages;
                applyFilters(window.currentSortBy);
            });
            paginationContainer.appendChild(lastPageBtn);
        }
        
        // Tạo nút Next
        const nextBtn = document.createElement('button');
        nextBtn.className = `page-btn next ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                applyFilters(window.currentSortBy);
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // Xử lý sự kiện khi chọn khóa học trong form upload
    document.addEventListener('DOMContentLoaded', function() {
        const courseSelect = document.getElementById('courseId');
        if (courseSelect) {
            courseSelect.addEventListener('change', async function() {
                const courseId = courseSelect.value;
                if (courseId) {
                    try {
                        const courseType = await LectureAPI.getCourseType(courseId);
                        if (courseType === 'tuantu') {
                            // Hiển thị thông báo cho khóa học tuần tự
                            showTuanTuNotification();
                        } else {
                            // Ẩn thông báo nếu đã hiển thị trước đó
                            hideTuanTuNotification();
                        }
                    } catch (error) {
                        console.error('Error checking course type:', error);
                    }
                }
            });
        }
    });

    // Hiển thị thông báo cho khóa học tuần tự
    function showTuanTuNotification() {
        // Kiểm tra xem đã có thông báo chưa
        if (!document.getElementById('tuantuNotification')) {
            const notification = document.createElement('div');
            notification.id = 'tuantuNotification';
            notification.className = 'tuantu-notification';
            notification.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Đây là khoá học tuần tự. Vui lòng tải bài giảng đúng theo thứ tự học tập.</span>
                </div>
            `;
            
            // Thêm style cho thông báo
            const style = document.createElement('style');
            style.textContent = `
                .tuantu-notification {
                    margin: 10px 0;
                }
                .alert {
                    padding: 10px 15px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                }
                .alert-warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffecb5;
                    color: #856404;
                }
                .alert i {
                    margin-right: 10px;
                    font-size: 16px;
                }
            `;
            document.head.appendChild(style);
            
            // Thêm vào form tại vị trí phù hợp (sau select khóa học)
            const courseFormGroup = document.getElementById('courseId').closest('.form-group');
            courseFormGroup.parentNode.insertBefore(notification, courseFormGroup.nextSibling);
        }
    }

    // Ẩn thông báo nếu không phải khóa học tuần tự
    function hideTuanTuNotification() {
        const notification = document.getElementById('tuantuNotification');
        if (notification) {
            notification.remove();
        }
    }
});

// Export API để có thể sử dụng từ bên ngoài
window.LectureAPI = LectureAPI; 