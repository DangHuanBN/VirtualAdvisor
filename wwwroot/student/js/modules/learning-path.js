// Global variables
let currentStudentId = null;
let currentPathId = null;
let learningPaths = [];
const apiBaseUrl = 'http://localhost:5261';

// Sử dụng AuthHelper từ window global (KHÔNG dùng import)

// Function để load danh sách các lộ trình học tập của sinh viên
async function loadLearningPaths() {
    try {
        // Hiển thị trạng thái đang tải
        const container = document.querySelector('.learning-path');
        if (container) {
            container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Đang tải lộ trình học tập...</div>';
        }

        // Sử dụng AuthHelper để gọi API
        const response = await window.AuthHelper.fetchWithAuth(`${apiBaseUrl}/api/learning-path/student`);
        const paths = await response.json();
        
        // Kiểm tra dữ liệu trống
        if (!paths || paths.length === 0) {
            console.warn('Không có dữ liệu lộ trình học tập');
            if (container) {
                container.innerHTML = '<div class="empty-state">Không có lộ trình học tập nào được tìm thấy.</div>';
            }
            return;
        }

        // Cập nhật bộ lọc dropdown
        populatePathFilter(paths);
        
        // Tải chi tiết của lộ trình đầu tiên
        if (paths.length > 0) {
            loadLearningPathDetail(paths[0].pathId);
        } else {
            // Show empty state
            document.querySelector('.learning-path').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-road"></i>
                    <h3>Chưa có lộ trình học tập nào</h3>
                    <p>Bạn chưa đăng ký khóa học nào hoặc chưa có lộ trình học tập.</p>
                </div>
            `;
            
            // Hide progress overview
            document.querySelector('.progress-overview').style.display = 'none';
        }
    } catch (error) {
        console.error('Lỗi khi tải lộ trình học tập:', error);
        showErrorMessage('Không thể tải lộ trình học tập. Vui lòng thử lại sau.');
    }
}

// Function để hiển thị dropdown filter
function populatePathFilter(paths) {
    const filterSelect = document.getElementById('majorFilter');
    if (!filterSelect) return;
    
    // Xóa các tùy chọn hiện tại
    filterSelect.innerHTML = '';
    
    // Thêm các tùy chọn mới
    paths.forEach(path => {
        const option = document.createElement('option');
        option.value = path.pathId;
        option.textContent = path.pathName;
        filterSelect.appendChild(option);
    });
}

// Function để tải chi tiết lộ trình học tập
async function loadLearningPathDetail(pathId) {
    try {
        // Hiển thị trạng thái đang tải
        const container = document.querySelector('.learning-path');
        if (container) {
            container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Đang tải chi tiết lộ trình học tập...</div>';
        }

        // Kiểm tra trước khi ẩn tổng quan tiến độ
        const progressOverviewElement = document.querySelector('.progress-overview');
        if (progressOverviewElement) {
            progressOverviewElement.style.display = 'none';
        }

        // Sử dụng AuthHelper để gọi API
        const response = await window.AuthHelper.fetchWithAuth(`${apiBaseUrl}/api/learning-path/detail/${pathId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Lỗi khi tải chi tiết lộ trình học tập:', response.status, errorData);
            container.innerHTML = '<div class="empty-state">Không thể tải lộ trình học tập. Vui lòng thử lại sau.</div>';
            return;
        }

        const pathDetail = await response.json();
        
        // Kiểm tra dữ liệu trống
        if (!pathDetail || !pathDetail.modules || pathDetail.modules.length === 0) {
            console.warn('Không có dữ liệu cho lộ trình học tập này');
            container.innerHTML = '<div class="empty-state">Không có khóa học nào trong lộ trình này.</div>';
            return;
        }

        // Cập nhật tổng quan về tiến độ
        updateProgressOverview(pathDetail);
        
        // Hiển thị chi tiết lộ trình học tập
        renderLearningPathDetail(pathDetail);
        
    } catch (error) {
        console.error('Lỗi khi tải chi tiết lộ trình học tập:', error);
        const container = document.querySelector('.learning-path');
        if (container) {
            container.innerHTML = '<div class="empty-state">Đã xảy ra lỗi khi tải lộ trình học tập. Vui lòng thử lại sau.</div>';
        }
        
        // Ẩn phần tổng quan tiến độ khi có lỗi
        const progressOverview = document.querySelector('.progress-overview');
        if (progressOverview) {
            progressOverview.style.display = 'none';
        }
    }
}

// Function để cập nhật progress overview
function updateProgressOverview(pathDetail) {
    const progressOverview = document.querySelector('.progress-overview');
    
    // Kiểm tra nếu phần tử không tồn tại
    if (!progressOverview) {
        console.error('Không tìm thấy phần tử .progress-overview trong DOM');
        return;
    }
    
    // Kiểm tra dữ liệu hợp lệ
    if (!pathDetail) {
        progressOverview.style.display = 'none';
        return;
    }
    
    // Hiển thị phần tổng quan tiến độ
    progressOverview.style.display = 'block';
    
    // Tính toán phần trăm tiến độ từ dữ liệu API
    const percentage = pathDetail.totalProgress || 0;
    
    // Cập nhật hiển thị phần trăm
    const progressLabel = progressOverview.querySelector('.progress-label span:last-child');
    if (progressLabel) {
        progressLabel.textContent = `${percentage}%`;
    } else {
        console.warn('Không tìm thấy phần tử để hiển thị phần trăm tiến độ');
    }
    
    // Cập nhật thanh tiến độ
    const progressBar = progressOverview.querySelector('.progress');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    } else {
        console.warn('Không tìm thấy phần tử thanh tiến độ');
    }
}

// Function để render chi tiết lộ trình học tập
function renderLearningPathDetail(pathDetail) {
    const learningPathContainer = document.querySelector('.learning-path');
    
    // Kiểm tra nếu phần tử không tồn tại
    if (!learningPathContainer) {
        console.error('Không tìm thấy phần tử .learning-path trong DOM');
        return;
    }
    
    // Clear any existing content
    learningPathContainer.innerHTML = '';
    
    // Kiểm tra dữ liệu hợp lệ
    if (!pathDetail || !pathDetail.modules) {
        learningPathContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Không có dữ liệu</h3>
                <p>Không thể tải chi tiết lộ trình học tập. Vui lòng thử lại sau.</p>
            </div>
        `;
        return;
    }
    
    // Create the main section
    const yearSection = document.createElement('div');
    yearSection.className = `year-section ${getStatusClass(pathDetail.status)}`;
    
    // Create header
    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    yearHeader.innerHTML = `
        <h3>${pathDetail.pathName}</h3>
        <span class="status">${getStatusText(pathDetail.status)}</span>
    `;
    
    yearSection.appendChild(yearHeader);
    
    // Create semester container for modules
    const semesterContainer = document.createElement('div');
    semesterContainer.className = 'semester-container';
    
    // Add each module
    pathDetail.modules.forEach(module => {
        const semester = document.createElement('div');
        semester.className = 'semester';
        
        const courseList = document.createElement('div');
        courseList.className = 'course-list';
        
        // Add each lecture in the module
        module.lectures.forEach(lecture => {
            const courseItem = document.createElement('div');
            courseItem.className = `course-item ${getStatusClass(lecture.status)}`;
            
            // Determine the icon based on status
            let icon = '';
            switch (lecture.status) {
                case 'hoanthanh':
                    icon = 'fas fa-check-circle';
                    break;
                case 'danghoc':
                    icon = 'fas fa-spinner';
                    break;
                case 'khoa':
                    icon = 'fas fa-lock';
                    break;
                default:
                    icon = 'fas fa-circle';
            }
            
            // Create content
            courseItem.innerHTML = `
                <i class="${icon}"></i>
                <div class="course-info">
                    <h5>${lecture.title}</h5>
                    <p>${getLectureTypeText(lecture.type)} - ${getStatusText(lecture.status)}</p>
                    ${lecture.progress > 0 && lecture.progress < 100 ? `<p>Tiến độ: ${lecture.progress}%</p>` : ''}
                    ${lecture.status === 'khoa' ? '<span class="prerequisite">Yêu cầu: Hoàn thành bài học trước</span>' : ''}
                </div>
            `;
            
            courseList.appendChild(courseItem);
        });
        
        semester.appendChild(courseList);
        semesterContainer.appendChild(semester);
    });
    
    yearSection.appendChild(semesterContainer);
    learningPathContainer.appendChild(yearSection);
}

// Tải khóa học được đề xuất
async function loadCourseRecommendations() {
    try {
        // Hiển thị trạng thái đang tải
        const container = document.querySelector('.recommendations-grid');
        if (container) {
            container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Đang tải khóa học được đề xuất...</div>';
        }
        
        // Sử dụng AuthHelper để gọi API
        const response = await window.AuthHelper.fetchWithAuth(`${apiBaseUrl}/api/learning-path/recommendations`);
        
        if (!response.ok) {
            throw new Error(`API trả về lỗi: ${response.status}`);
        }
        
        const recommendations = await response.json();
        
        // Kiểm tra dữ liệu trống
        if (!recommendations || recommendations.length === 0) {
            console.warn('Không có khóa học được đề xuất');
            if (container) {
                container.innerHTML = '<div class="empty-state">Không có khóa học được đề xuất.</div>';
            }
            return;
        }
        
        // Hiển thị khóa học được đề xuất
        renderCourseRecommendations(recommendations);
        
    } catch (error) {
        console.error('Lỗi khi tải khóa học được đề xuất:', error);
        const container = document.querySelector('.recommendations-grid');
        if (container) {
            container.innerHTML = '<div class="empty-state">Đã xảy ra lỗi khi tải khóa học được đề xuất. Vui lòng thử lại sau.</div>';
        }
    }
}

// Function để render khóa học được đề xuất
function renderCourseRecommendations(recommendations) {
    const recommendationsSection = document.querySelector('.recommendations-section');
    const recommendationsGrid = recommendationsSection.querySelector('.recommendations-grid');
    
    // Clear any existing content
    recommendationsGrid.innerHTML = '';
    
    if (recommendations.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }
    
    // Add each recommendation
    recommendations.forEach(recommendation => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.innerHTML = `
            <div class="card-header">
                <i class="${recommendation.icon}"></i>
                <h4>${recommendation.courseName}</h4>
            </div>
            <p>${recommendation.description}</p>
            <div class="card-meta">
                <span><i class="fas fa-clock"></i> ${recommendation.estimatedWeeks} tuần</span>
                <span><i class="fas fa-star"></i> ${recommendation.rating.toFixed(1)}/5.0</span>
            </div>
        `;
        
        recommendationsGrid.appendChild(card);
    });
    
    // Show the recommendations section
    recommendationsSection.style.display = 'block';
}

// Helper functions
function getStatusClass(status) {
    switch (status) {
        case 'hoanthanh':
        case 'hoàn thành':
            return 'completed';
        case 'danghoc':
        case 'đang học':
            return 'in-progress';
        case 'khoa':
            return 'locked';
        default:
            return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'hoanthanh':
            return 'Hoàn thành';
        case 'hoàn thành':
            return 'Hoàn thành';
        case 'danghoc':
            return 'Đang học';
        case 'đang học':
            return 'Đang học';
        case 'khoa':
            return 'Đã khóa';
        case 'chuahoc':
            return 'Chưa học';
        case 'chưa học':
            return 'Chưa học';
        default:
            return status;
    }
}

function getLectureTypeText(type) {
    switch (type) {
        case 'baigiang':
            return 'Bài giảng';
        case 'baikiemtra':
            return 'Bài kiểm tra';
        case 'baithi':
            return 'Bài thi';
        default:
            return 'Bài học';
    }
}

function showErrorMessage(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
    `;
    
    // Add to page
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Sử dụng DOMContentLoaded để chắc chắn rằng DOM đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Tải danh sách lộ trình học tập
    loadLearningPaths();
    
    // Tải khóa học được đề xuất
    loadCourseRecommendations();
    
    // Xử lý sự kiện khi người dùng chọn lộ trình học tập từ dropdown
    const pathFilterSelect = document.getElementById('majorFilter');
    if (pathFilterSelect) {
        pathFilterSelect.addEventListener('change', function() {
            const selectedPathId = this.value;
            if (selectedPathId && selectedPathId !== 'all' && selectedPathId !== 'none') {
                loadLearningPathDetail(selectedPathId);
            }
        });
    }
}); 