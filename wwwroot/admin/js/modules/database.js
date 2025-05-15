/**
 * Database Management Module
 * Chứa các chức năng xử lý cho trang quản lý kho dữ liệu
 */

const DatabaseModule = (function() {
    // Các biến private
    let databaseStats = {};
    let courses = [];
    let lectures = [];
    let aiTrainings = [];
    let progressInterval = null;
    
    // Element references
    const selectors = {
        backupButton: '.backup-btn',
        restoreButton: '.restore-btn',
        optimizeButton: '.optimize-btn',
        cleanupButton: '.cleanup-btn',
        databaseStatsCards: '.stats-grid .stats-card',
        courseLectureContainer: '.course-lecture-container',
        lectureSearchInput: '#lecture-search',
        lectureSearchButton: '.search-group .action-btn',
        courseFilter: '#course-filter',
        trainingStatusFilter: '#training-status',
        progressBar: '.progress-bar',
        trainingStatsContainer: '.training-stats',
        aiTrainingTable: '.section-container:nth-of-type(4) table tbody',
        trainButtons: '.train-ai-btn',
        showTrainingBtn: '#show-training-btn'
    };
    
    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Database module initialized');
        
        // Tải dữ liệu thống kê cơ sở dữ liệu
        loadDatabaseStats();
        
        // Tải dữ liệu bài giảng
        loadLectureStats();
        
        // Tải dữ liệu huấn luyện AI
        loadAITrainingStats();
        
        // Tải lịch sử sao lưu
        loadBackupHistory();
        
        // Thiết lập các sự kiện
        setupEventListeners();
    }
    
    /**
     * Thiết lập các event listeners
     */
    function setupEventListeners() {
        // Nút sao lưu
        const backupButton = document.querySelector(selectors.backupButton);
        if (backupButton) {
            backupButton.addEventListener('click', createBackup);
        }
        
        // Nút phục hồi - Mở modal chọn file backup
        const restoreButton = document.querySelector(selectors.restoreButton);
        if (restoreButton) {
            restoreButton.addEventListener('click', function() {
                showRestoreModal();
            });
        }
        
        // Nút tối ưu hóa
        const optimizeButton = document.querySelector(selectors.optimizeButton);
        if (optimizeButton) {
            optimizeButton.addEventListener('click', optimizeDatabase);
        }
        
        // Nút dọn dẹp
        const cleanupButton = document.querySelector(selectors.cleanupButton);
        if (cleanupButton) {
            cleanupButton.addEventListener('click', cleanupDatabase);
        }
        
        // Nút huấn luyện AI
        const showTrainingBtn = document.querySelector(selectors.showTrainingBtn);
        if (showTrainingBtn) {
            showTrainingBtn.addEventListener('click', function() {
                window.location.href = 'http://127.0.0.1:5000/';
            });
        }
        
        // Tìm kiếm bài giảng
        const searchInput = document.querySelector(selectors.lectureSearchInput);
        const searchButton = document.querySelector(selectors.lectureSearchButton);
        
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    filterLectures();
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                filterLectures();
            });
        }
        
        // Lọc bài giảng theo khóa học và trạng thái
        const courseFilter = document.querySelector(selectors.courseFilter);
        const statusFilter = document.querySelector(selectors.trainingStatusFilter);
        
        if (courseFilter) {
            courseFilter.addEventListener('change', filterLectures);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', filterLectures);
        }
    }
    
    /**
     * Thiết lập các nút huấn luyện AI
     */
    function setupTrainButtons() {
        const trainButtons = document.querySelectorAll(selectors.trainButtons);
        
        if (trainButtons.length > 0) {
            trainButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const lectureId = button.getAttribute('data-lecture-id');
                    if (lectureId) {
                        trainLecture(lectureId, button);
                    }
                });
            });
        }
    }
    
    /**
     * Huấn luyện bài giảng với AI
     */
    function trainLecture(lectureId, buttonElement) {
        console.log(`Training lecture with ID: ${lectureId}`);
        
        // Hiển thị trạng thái đang xử lý
        const statusElement = buttonElement.closest('.lecture-card').querySelector('.lecture-status');
        const originalButtonText = buttonElement.textContent;
        
        if (statusElement) {
            statusElement.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> Đang xử lý...</span>';
            statusElement.className = 'lecture-status processing';
        }
        
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        // Gọi API để huấn luyện
        fetch(`/api/ai/train/${lectureId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Training successful:', data);
            
            // Cập nhật trạng thái
            if (statusElement) {
                statusElement.innerHTML = '<span><i class="fas fa-check-circle"></i> Đã huấn luyện</span>';
                statusElement.className = 'lecture-status trained';
            }
            
            // Thông báo thành công
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification('Huấn luyện AI thành công!', 'success');
            } else {
                alert('Huấn luyện AI thành công!');
            }
            
            // Tải lại dữ liệu sau khi huấn luyện
            loadLectureStats();
            loadAITrainingStats();
        })
        .catch(error => {
            console.error('Training error:', error);
            
            // Cập nhật trạng thái lỗi
            if (statusElement) {
                statusElement.innerHTML = '<span><i class="fas fa-exclamation-circle"></i> Lỗi huấn luyện</span>';
                statusElement.className = 'lecture-status error';
            }
            
            // Thông báo lỗi
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Lỗi huấn luyện AI: ${error.message}`, 'error');
            } else {
                alert(`Lỗi huấn luyện AI: ${error.message}`);
            }
        })
        .finally(() => {
            // Khôi phục nút
            buttonElement.disabled = false;
            buttonElement.textContent = originalButtonText;
        });
    }
    
    /**
     * Tải thống kê cơ sở dữ liệu
     */
    function loadDatabaseStats() {
        console.log('Loading database stats');
        
        // Gọi API để lấy thông tin thống kê
        fetch('/api/databasestats/summary', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Database stats loaded:', data);
            databaseStats = data;
            
            // Cập nhật UI
            updateDatabaseStatsUI();
        })
        .catch(error => {
            console.error('Error loading database stats:', error);
            
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Lỗi tải thông tin thống kê: ${error.message}`, 'error');
            }
        });
    }
    
    /**
     * Cập nhật UI với thông tin thống kê
     */
    function updateDatabaseStatsUI() {
        const statsCards = document.querySelectorAll(selectors.databaseStatsCards);
        
        if (statsCards.length >= 4 && databaseStats) {
            // Cập nhật dung lượng CSDL
            const dbSizeCard = statsCards[0];
            if (dbSizeCard) {
                const numberElement = dbSizeCard.querySelector('.stats-number');
                if (numberElement) {
                    numberElement.textContent = databaseStats.dbSize;
                }
            }
            
            // Cập nhật số bảng dữ liệu
            const tableCountCard = statsCards[1];
            if (tableCountCard) {
                const numberElement = tableCountCard.querySelector('.stats-number');
                if (numberElement) {
                    numberElement.textContent = databaseStats.tableCount;
                }
            }
            
            // Cập nhật số bản sao lưu
            const backupCountCard = statsCards[2];
            if (backupCountCard) {
                const numberElement = backupCountCard.querySelector('.stats-number');
                if (numberElement) {
                    numberElement.textContent = databaseStats.backupCount;
                }
            }
            
            // Cập nhật thời gian sao lưu gần nhất
            const lastBackupCard = statsCards[3];
            if (lastBackupCard) {
                const numberElement = lastBackupCard.querySelector('.stats-number');
                if (numberElement) {
                    const lastBackupDate = databaseStats.lastBackupDate;
                    if (lastBackupDate && lastBackupDate !== "Chưa có") {
                        const date = new Date(lastBackupDate);
                        numberElement.textContent = date.toLocaleDateString('vi-VN');
                        
                        const timeElement = lastBackupCard.querySelector('.stats-time');
                        if (timeElement) {
                            timeElement.textContent = date.toLocaleTimeString('vi-VN');
                        }
                    } else {
                        numberElement.textContent = "Chưa có";
                        
                        const timeElement = lastBackupCard.querySelector('.stats-time');
                        if (timeElement) {
                            timeElement.textContent = "";
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Tải thông tin bài giảng và khóa học
     */
    function loadLectureStats() {
        console.log('Loading lecture stats');
        
        // Gọi API để lấy thông tin bài giảng
        fetch('/api/databasestats/lectures', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Lecture stats loaded:', data);
            
            // Lưu thông tin khóa học
            courses = data.courseStats || [];
            
            // Cập nhật danh sách khóa học trong dropdown
            updateCourseFilter();
            
            // Cập nhật thống kê bài giảng
            updateLectureStatsUI(data);
            
            // Tải nội dung bài giảng cho mỗi khóa học
            loadLecturesForCourses();
        })
        .catch(error => {
            console.error('Error loading lecture stats:', error);
            
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Lỗi tải thông tin bài giảng: ${error.message}`, 'error');
            }
        });
    }
    
    /**
     * Cập nhật dropdown khóa học
     */
    function updateCourseFilter() {
        const courseFilter = document.querySelector(selectors.courseFilter);
        
        if (courseFilter && courses.length > 0) {
            // Xóa các option cũ trừ option đầu tiên (Tất cả)
            while (courseFilter.options.length > 1) {
                courseFilter.remove(1);
            }
            
            // Thêm các khóa học vào dropdown
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.courseId;
                option.textContent = course.courseName;
                courseFilter.appendChild(option);
            });
        }
    }
    
    /**
     * Cập nhật UI thống kê bài giảng
     */
    function updateLectureStatsUI(data) {
        const statsContainer = document.querySelector(selectors.trainingStatsContainer);
        
        if (statsContainer && data) {
            statsContainer.innerHTML = `
                <div class="stats-item">
                    <i class="fas fa-list"></i> Tổng số bài giảng: <strong>${data.totalLectures}</strong>
                </div>
                <div class="stats-item">
                    <i class="fas fa-check-circle"></i> Đã huấn luyện: <strong>${data.trainedLectures}</strong>
                </div>
                <div class="stats-item">
                    <i class="fas fa-clock"></i> Chưa huấn luyện: <strong>${data.untrainedLectures}</strong>
                </div>
            `;
        }
    }
    
    /**
     * Tải nội dung bài giảng cho các khóa học
     */
    function loadLecturesForCourses() {
        if (!courses || courses.length === 0) {
            return;
        }
        
        const container = document.querySelector(selectors.courseLectureContainer);
        if (!container) {
            return;
        }
        
        // Xóa nội dung cũ
        container.innerHTML = '';
        
        // Thêm section cho mỗi khóa học
        courses.forEach(course => {
            // Chỉ hiển thị khóa học có bài giảng
            if (course.totalLectures > 0) {
                // Tạo section cho khóa học
                const courseSection = document.createElement('div');
                courseSection.className = 'course-section';
                courseSection.dataset.courseId = course.courseId;
                
                // Tạo tiêu đề cho khóa học
                courseSection.innerHTML = `
                    <div class="course-header">
                        <h3><i class="fas fa-book"></i> ${course.courseName}</h3>
                        <span class="course-info">${course.totalLectures} bài giảng | ${course.trainedLectures} đã huấn luyện</span>
                        <button class="action-btn collapse-btn"><i class="fas fa-chevron-down"></i></button>
                    </div>
                    <div class="lecture-grid"></div>
                    <div class="scroll-indicator" title="Cuộn để xem thêm">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                `;
                
                // Thêm vào container
                container.appendChild(courseSection);
                
                // Tải nội dung bài giảng cho khóa học này
                loadLecturesByCourse(course.courseId);
            }
        });
        
        // Thiết lập sự kiện cho nút collapse
        setupCollapseButtons();
        
        // Thiết lập sự kiện cho nút cuộn
        setupScrollIndicators();
    }
    
    /**
     * Thiết lập sự kiện cho nút collapse
     */
    function setupCollapseButtons() {
        const collapseButtons = document.querySelectorAll('.collapse-btn');
        
        collapseButtons.forEach(button => {
            button.addEventListener('click', function() {
                const courseSection = this.closest('.course-section');
                const lectureGrid = courseSection.querySelector('.lecture-grid');
                
                if (lectureGrid.style.display === 'none') {
                    lectureGrid.style.display = 'flex';
                    this.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    this.classList.remove('collapsed');
                } else {
                    lectureGrid.style.display = 'none';
                    this.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    this.classList.add('collapsed');
                }
            });
        });
    }
    
    /**
     * Thiết lập sự kiện cho nút chỉ báo cuộn
     */
    function setupScrollIndicators() {
        const scrollIndicators = document.querySelectorAll('.scroll-indicator');
        
        scrollIndicators.forEach(indicator => {
            const lectureGrid = indicator.previousElementSibling;
            
            // Kiểm tra nếu cần hiển thị chỉ báo cuộn
            function updateScrollIndicator() {
                if (lectureGrid.scrollWidth > lectureGrid.clientWidth) {
                    // Có thể cuộn ngang
                    indicator.style.display = 'flex';
                    
                    // Kiểm tra nếu đã cuộn đến cuối
                    if (Math.abs(lectureGrid.scrollWidth - lectureGrid.clientWidth - lectureGrid.scrollLeft) < 10) {
                        indicator.style.right = '20px';
                        indicator.innerHTML = '<i class="fas fa-chevron-left"></i>';
                        indicator.setAttribute('data-direction', 'left');
                    } else if (lectureGrid.scrollLeft < 10) {
                        indicator.style.right = '20px';
                        indicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
                        indicator.setAttribute('data-direction', 'right');
                    }
                } else {
                    // Không cần cuộn ngang
                    indicator.style.display = 'none';
                }
            }
            
            // Cập nhật chỉ báo khi cuộn
            lectureGrid.addEventListener('scroll', updateScrollIndicator);
            
            // Sự kiện click để cuộn
            indicator.addEventListener('click', function() {
                const direction = this.getAttribute('data-direction') || 'right';
                const scrollAmount = lectureGrid.clientWidth * 0.8;
                
                if (direction === 'right') {
                    lectureGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                } else {
                    lectureGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
            });
            
            // Khởi tạo ban đầu
            setTimeout(updateScrollIndicator, 500);
        });
        
        // Cập nhật chỉ báo khi cửa sổ thay đổi kích thước
        window.addEventListener('resize', function() {
            scrollIndicators.forEach(indicator => {
                const lectureGrid = indicator.previousElementSibling;
                if (lectureGrid.scrollWidth > lectureGrid.clientWidth) {
                    indicator.style.display = 'flex';
                } else {
                    indicator.style.display = 'none';
                }
            });
        });
    }
    
    /**
     * Tải danh sách bài giảng theo khóa học
     */
    function loadLecturesByCourse(courseId) {
        // Gọi API để lấy danh sách bài giảng theo khóa học
        fetch(`/api/databasestats/lectures/course/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Lectures for course ${courseId} loaded:`, data);
            
            // Lưu trữ bài giảng
            lectures = lectures.concat(data);
            
            // Hiển thị bài giảng
            renderLectures(courseId, data);
        })
        .catch(error => {
            console.error(`Error loading lectures for course ${courseId}:`, error);
        });
    }
    
    /**
     * Hiển thị danh sách bài giảng
     */
    function renderLectures(courseId, lectureData) {
        const courseSection = document.querySelector(`.course-section[data-course-id="${courseId}"]`);
        if (!courseSection) {
            return;
        }
        
        const lectureGrid = courseSection.querySelector('.lecture-grid');
        if (!lectureGrid) {
            return;
        }
        
        // Xóa nội dung cũ
        lectureGrid.innerHTML = '';
        
        // Sắp xếp bài giảng: chưa huấn luyện lên trước, đã huấn luyện xuống sau
        const sortedLectures = [...lectureData].sort((a, b) => {
            if (a.status === 'dahuanluyen' && b.status !== 'dahuanluyen') return 1;
            if (a.status !== 'dahuanluyen' && b.status === 'dahuanluyen') return -1;
            return 0;
        });
        
        // Thêm card cho mỗi bài giảng
        sortedLectures.forEach(lecture => {
            const lectureCard = document.createElement('div');
            lectureCard.className = 'lecture-card';
            lectureCard.dataset.lectureId = lecture.lectureId;
            
            // Format date
            const uploadDate = lecture.uploadDate ? new Date(lecture.uploadDate).toLocaleDateString('vi-VN') : 'N/A';
            
            // Xác định trạng thái huấn luyện
            let statusHtml = '';
            if (lecture.status === 'dahuanluyen') {
                statusHtml = `
                    <div class="lecture-status trained">
                        <span><i class="fas fa-check-circle"></i> Đã huấn luyện</span>
                    </div>
                `;
            } else {
                statusHtml = `
                    <div class="lecture-status untrained">
                        <button class="train-ai-btn" data-lecture-id="${lecture.lectureId}">Huấn luyện</button>
                    </div>
                `;
            }
            
            // Tạo card
            lectureCard.innerHTML = `
                <div class="lecture-card-header">
                    <h4>${lecture.title}</h4>
                </div>
                <div class="lecture-card-content">
                    <span class="upload-info">Tải lên bởi: ${lecture.teacherName} | ${uploadDate}</span>
                    ${statusHtml}
                </div>
                <div class="lecture-card-actions">
                </div>
            `;
            
            // Thêm vào grid
            lectureGrid.appendChild(lectureCard);
        });
        
        // Thiết lập các nút huấn luyện AI
        setupTrainButtons();
    }
    
    /**
     * Lọc bài giảng theo điều kiện
     */
    function filterLectures() {
        const courseId = document.querySelector(selectors.courseFilter).value;
        const status = document.querySelector(selectors.trainingStatusFilter).value;
        const keyword = document.querySelector(selectors.lectureSearchInput).value.toLowerCase();
        
        // Hiển thị tất cả các section khóa học
        const courseSections = document.querySelectorAll('.course-section');
        courseSections.forEach(section => {
            section.style.display = 'block';
        });
        
        // Lọc theo khóa học
        if (courseId !== 'all') {
            courseSections.forEach(section => {
                if (section.dataset.courseId !== courseId) {
                    section.style.display = 'none';
                }
            });
        }
        
        // Lọc các bài giảng
        const lectureCards = document.querySelectorAll('.lecture-card');
        lectureCards.forEach(card => {
            let show = true;
            
            // Lọc theo trạng thái
            if (status !== 'all') {
                const isTrained = card.querySelector('.lecture-status.trained') !== null;
                if ((status === 'trained' && !isTrained) || (status === 'untrained' && isTrained)) {
                    show = false;
                }
            }
            
            // Lọc theo từ khóa
            if (keyword && show) {
                const title = card.querySelector('h4').textContent.toLowerCase();
                const teacher = card.querySelector('.upload-info').textContent.toLowerCase();
                
                if (!title.includes(keyword) && !teacher.includes(keyword)) {
                    show = false;
                }
            }
            
            // Hiển thị hoặc ẩn card
            card.style.display = show ? 'block' : 'none';
        });
    }
    
    /**
     * Tải thông tin huấn luyện AI
     */
    function loadAITrainingStats() {
        console.log('Loading AI training stats');
        
        // Gọi API để lấy thông tin huấn luyện AI
        fetch('/api/databasestats/ai-training', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('AI training stats loaded:', data);
            aiTrainings = data;
            
            // Cập nhật UI
            updateAITrainingTable();
        })
        .catch(error => {
            console.error('Error loading AI training stats:', error);
            
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification(`Lỗi tải thông tin huấn luyện AI: ${error.message}`, 'error');
            }
        });
    }
    
    /**
     * Cập nhật bảng thông tin huấn luyện AI
     */
    function updateAITrainingTable() {
        const tableBody = document.querySelector(selectors.aiTrainingTable);
        
        if (tableBody && aiTrainings.length > 0) {
            // Xóa nội dung cũ
            tableBody.innerHTML = '';
            
            // Thêm dòng cho mỗi bản ghi
            aiTrainings.forEach(training => {
                const row = document.createElement('tr');
                
                // Format date và time
                let dateTimeStr = 'Chưa huấn luyện';
                let formattedDate = '';
                
                if (training.trainingTime) {
                    const date = new Date(training.trainingTime);
                    formattedDate = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
                    dateTimeStr = formattedDate;
                }
                
                // Xác định trạng thái
                let statusClass = 'pending';
                let statusText = 'Đang chờ';
                
                if (training.status === 'completed') {
                    statusClass = 'active';
                    statusText = 'Hoàn tất';
                } else if (training.status === 'processing') {
                    statusClass = 'processing';
                    statusText = 'Đang xử lý';
                } else if (training.status === 'failed') {
                    statusClass = 'error';
                    statusText = 'Lỗi';
                }
                
                // Tạo nội dung cho dòng
                row.innerHTML = `
                    <td>TR${training.trainingId.toString().padStart(4, '0')}</td>
                    <td>${training.courseName}</td>
                    <td>${dateTimeStr}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${training.accuracy}</td>
                    <td>${training.creator}</td>
                    <td class="action-cell">
                        <button class="action-btn view-btn" title="Xem chi tiết" data-id="${training.trainingId}"><i class="fas fa-eye"></i></button>
                        <button class="action-btn edit-btn" title="Chỉnh sửa" data-id="${training.trainingId}"><i class="fas fa-edit"></i></button>
                        ${training.status === 'pending' 
                            ? `<button class="action-btn start-btn" title="Bắt đầu" data-id="${training.trainingId}"><i class="fas fa-play"></i></button>` 
                            : `<button class="action-btn retrain-btn" title="Huấn luyện lại" data-id="${training.trainingId}"><i class="fas fa-sync"></i></button>`
                        }
                    </td>
                `;
                
                // Thêm vào bảng
                tableBody.appendChild(row);
            });
            
            // Thiết lập các sự kiện cho các nút
            setupAITrainingTableButtons();
        }
    }
    
    /**
     * Thiết lập sự kiện cho các nút trong bảng huấn luyện AI
     */
    function setupAITrainingTableButtons() {
        // Nút xem chi tiết
        const viewButtons = document.querySelectorAll('.action-btn.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                alert(`Xem chi tiết huấn luyện #${id}`);
                // Trong thực tế, ở đây sẽ mở modal hiển thị chi tiết
            });
        });
        
        // Nút huấn luyện lại
        const retrainButtons = document.querySelectorAll('.action-btn.retrain-btn');
        retrainButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm(`Bạn có chắc chắn muốn huấn luyện lại #${id}?`)) {
                    // Tìm lecture_id từ training_id
                    const training = aiTrainings.find(t => t.trainingId.toString() === id);
                    if (training && training.lectureId) {
                        trainLecture(training.lectureId, button);
                    } else {
                        alert('Không tìm thấy thông tin bài giảng');
                    }
                }
            });
        });
        
        // Nút bắt đầu
        const startButtons = document.querySelectorAll('.action-btn.start-btn');
        startButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                // Tìm lecture_id từ training_id
                const training = aiTrainings.find(t => t.trainingId.toString() === id);
                if (training && training.lectureId) {
                    trainLecture(training.lectureId, button);
                } else {
                    alert('Không tìm thấy thông tin bài giảng');
                }
            });
        });
    }
    
    /**
     * Tạo bản sao lưu dữ liệu
     */
    function createBackup() {
        // Hiển thị thông báo đang sao lưu với thanh tiến trình
        Swal.fire({
            title: 'Đang tạo bản sao lưu...',
            html: `
                <div class="text-center mb-3">Vui lòng đợi trong giây lát</div>
                <div class="progress">
                    <div id="backup-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                </div>
                <div class="mt-2" id="backup-status">Đang chuẩn bị...</div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false
        });

        // Mô phỏng cập nhật thanh tiến trình
        let progress = 0;
        const progressBar = document.getElementById('backup-progress-bar');
        const statusText = document.getElementById('backup-status');
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 5) + 1;
                progressBar.style.width = `${progress}%`;
                
                if (progress < 30) {
                    statusText.textContent = "Đang khởi tạo quá trình sao lưu...";
                } else if (progress < 60) {
                    statusText.textContent = "Đang sao lưu cấu trúc cơ sở dữ liệu...";
                } else if (progress < 90) {
                    statusText.textContent = "Đang sao lưu dữ liệu...";
                }
            }
        }, 500);

        // Gọi API sao lưu
        fetch('/api/backup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            clearInterval(progressInterval);
            
            if (!response.ok) {
                throw new Error('Lỗi khi sao lưu cơ sở dữ liệu');
            }
            return response.json();
        })
        .then(data => {
            // Hoàn tất thanh tiến trình
            progressBar.style.width = '100%';
            statusText.textContent = "Hoàn tất sao lưu!";
            
            setTimeout(() => {
                Swal.close();
                
                // Cập nhật thông tin trong modal kết quả
                document.getElementById('resultBackupName').textContent = data.fileName;
                document.getElementById('resultBackupTime').textContent = data.timestamp;
                document.getElementById('resultBackupLocation').textContent = `BackupFiles/${data.fileName}`;
                
                // Thiết lập kích thước file là "Đang tính toán..."
                document.getElementById('resultBackupSize').textContent = 'Đang tải...';
                
                // Hiển thị modal kết quả
                const backupResultModal = new bootstrap.Modal(document.getElementById('backupResultModal'));
                backupResultModal.show();
                
                // Thiết lập sự kiện nút tải xuống
                document.getElementById('downloadBackupBtn').onclick = function() {
                    window.location.href = `/api/backup/downloads/${data.fileName}`;
                };
                
                // Tải lại danh sách file sao lưu để lấy kích thước file
                loadBackupHistory().then(() => {
                    // Tìm file trong danh sách để cập nhật kích thước
                    const backupHistoryTable = document.querySelector('.section-container:nth-of-type(5) table tbody');
                    if (backupHistoryTable) {
                        const rows = backupHistoryTable.querySelectorAll('tr');
                        for (let row of rows) {
                            const fileNameCell = row.querySelectorAll('td')[1];
                            const fileSizeCell = row.querySelectorAll('td')[3];
                            if (fileNameCell && fileNameCell.textContent === data.fileName && fileSizeCell) {
                                document.getElementById('resultBackupSize').textContent = fileSizeCell.textContent;
                                break;
                            }
                        }
                    }
                });
            }, 1000);
        })
        .catch(error => {
            clearInterval(progressInterval);
            console.error('Lỗi:', error);
            Swal.fire({
                icon: 'error',
                title: 'Sao lưu thất bại',
                text: error.message || 'Đã xảy ra lỗi khi sao lưu cơ sở dữ liệu',
                confirmButtonText: 'Đóng'
            });
        });
    }
    
    /**
     * Hiển thị modal chọn file backup để khôi phục
     */
    function showRestoreModal() {
        // Tạo modal nếu chưa tồn tại
        let modal = document.getElementById('restoreModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'restoreModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'restoreModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="restoreModalLabel">Khôi phục cơ sở dữ liệu</h5>
                            <button type="button" class="btn-close bg-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i> Lưu ý: Khôi phục sẽ ghi đè lên dữ liệu hiện tại và không thể hoàn tác.
                            </div>
                            
                            <div class="form-group mb-3">
                                <label for="backupFileSelect" class="form-label fw-bold">Chọn file sao lưu:</label>
                                <select id="backupFileSelect" class="form-select">
                                    <option value="">-- Đang tải danh sách file --</option>
                                </select>
                            </div>
                            
                            <div id="backupFileDetails" class="bg-light rounded p-3 mt-3" style="display: none;">
                                <div class="mb-2"><strong>Tên file:</strong> <span id="selectedFileName"></span></div>
                                <div class="mb-2"><strong>Kích thước:</strong> <span id="selectedFileSize"></span></div>
                                <div><strong>Thời gian tạo:</strong> <span id="selectedFileDate"></span></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy bỏ</button>
                            <button type="button" class="btn btn-danger" id="startRestoreBtn" disabled>Bắt đầu khôi phục</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Xử lý sự kiện khi chọn file
            const backupFileSelect = document.getElementById('backupFileSelect');
            if (backupFileSelect) {
                backupFileSelect.addEventListener('change', function() {
                    const selectedValue = this.value;
                    const detailsContainer = document.getElementById('backupFileDetails');
                    const startRestoreBtn = document.getElementById('startRestoreBtn');
                    
                    if (selectedValue) {
                        // Hiển thị thông tin file
                        const selectedOption = this.options[this.selectedIndex];
                        const fileName = selectedOption.getAttribute('data-filename');
                        const fileSize = selectedOption.getAttribute('data-size');
                        const fileDate = selectedOption.getAttribute('data-date');
                        
                        document.getElementById('selectedFileName').textContent = fileName;
                        document.getElementById('selectedFileSize').textContent = fileSize;
                        document.getElementById('selectedFileDate').textContent = fileDate;
                        
                        detailsContainer.style.display = 'block';
                        startRestoreBtn.disabled = false;
            } else {
                        detailsContainer.style.display = 'none';
                        startRestoreBtn.disabled = true;
                    }
                });
            }
            
            // Xử lý sự kiện khi nhấn nút bắt đầu khôi phục
            const startRestoreBtn = document.getElementById('startRestoreBtn');
            if (startRestoreBtn) {
                startRestoreBtn.addEventListener('click', function() {
                    const backupFileSelect = document.getElementById('backupFileSelect');
                    const fileName = backupFileSelect.value;
                    
                    if (fileName) {
                        // Đóng modal
                        const bsModal = bootstrap.Modal.getInstance(document.getElementById('restoreModal'));
                        bsModal.hide();
                        
                        // Thực hiện khôi phục
                        restoreBackup(fileName);
                    }
                });
            }
        }
        
        // Tải danh sách file backup
        loadBackupFilesForRestore();
        
        // Hiển thị modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
    
    /**
     * Tải danh sách file backup cho modal khôi phục
     */
    function loadBackupFilesForRestore() {
        const backupFileSelect = document.getElementById('backupFileSelect');
        if (backupFileSelect) {
            backupFileSelect.innerHTML = '<option value="">-- Đang tải danh sách file --</option>';
            
            // Gọi API để lấy danh sách backup
            fetch('/api/backup', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.length === 0) {
                    backupFileSelect.innerHTML = '<option value="">Không có file sao lưu nào</option>';
                    return;
                }
                
                let options = '<option value="">-- Chọn file sao lưu --</option>';
                data.forEach(backup => {
                    options += `<option value="${backup.fileName}" 
                                       data-filename="${backup.fileName}" 
                                       data-size="${backup.sizeFormatted}" 
                                       data-date="${backup.createdDate}">
                                    ${backup.fileName} (${backup.sizeFormatted}, ${backup.createdDate})
                                </option>`;
                });
                
                backupFileSelect.innerHTML = options;
            })
            .catch(error => {
                console.error('Error loading backup files:', error);
                backupFileSelect.innerHTML = '<option value="">Lỗi khi tải danh sách</option>';
            });
        }
    }
    
    /**
     * Phục hồi cơ sở dữ liệu
     */
    function restoreBackup(fileName) {
        // Nếu không có tên file được cung cấp, hiển thị thông báo
        if (!fileName) {
        alert('Vui lòng chọn bản sao lưu trong bảng lịch sử để phục hồi.');
            return;
        }
        
        // Hiển thị hộp thoại xác nhận
        Swal.fire({
            title: 'Xác nhận khôi phục',
            html: `Bạn có chắc chắn muốn khôi phục cơ sở dữ liệu từ file <strong>${fileName}</strong>?<br>
                  <div class="alert alert-warning mt-3">
                      <i class="fas fa-exclamation-triangle"></i> Cảnh báo: Quá trình này sẽ ghi đè lên dữ liệu hiện tại và không thể hoàn tác.
                  </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý, khôi phục ngay',
            cancelButtonText: 'Hủy bỏ'
        }).then((result) => {
            if (result.isConfirmed) {
                // Hiển thị thông báo đang phục hồi với thanh tiến trình
                Swal.fire({
                    title: 'Đang khôi phục cơ sở dữ liệu...',
                    html: `
                        <div class="text-center mb-3">Vui lòng đợi, quá trình này có thể mất vài phút</div>
                        <div class="progress">
                            <div id="restore-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div class="mt-2" id="restore-status">Đang chuẩn bị...</div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false
                });

                // Mô phỏng cập nhật thanh tiến trình
                let progress = 0;
                const progressBar = document.getElementById('restore-progress-bar');
                const statusText = document.getElementById('restore-status');
                const progressInterval = setInterval(() => {
                    if (progress < 90) {
                        progress += Math.floor(Math.random() * 5) + 1;
                        progressBar.style.width = `${progress}%`;
                        
                        if (progress < 30) {
                            statusText.textContent = "Đang chuẩn bị khôi phục cơ sở dữ liệu...";
                        } else if (progress < 60) {
                            statusText.textContent = "Đang khôi phục cấu trúc cơ sở dữ liệu...";
                        } else if (progress < 90) {
                            statusText.textContent = "Đang khôi phục dữ liệu...";
                        }
                    }
                }, 500);

                // Gọi API khôi phục
                fetch(`/api/backup/restoredatabase?fileName=${encodeURIComponent(fileName)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    clearInterval(progressInterval);
                    
                    // Xử lý cả trường hợp lỗi 400 Bad Request
                    if (!response.ok) {
                        return response.json().then(errorData => {
                            throw new Error(errorData.message || 'Lỗi khi khôi phục cơ sở dữ liệu');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Hoàn tất thanh tiến trình
                    progressBar.style.width = '100%';
                    statusText.textContent = "Hoàn tất khôi phục!";
                    
                    setTimeout(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Khôi phục thành công',
                            text: data.message || 'Cơ sở dữ liệu đã được khôi phục thành công',
                            confirmButtonText: 'Đóng'
                        });
                        
                        // Tải lại dữ liệu thống kê
                        loadDatabaseStats();
                        loadBackupHistory();
                    }, 1000);
                })
                .catch(error => {
                    clearInterval(progressInterval);
                    console.error('Lỗi:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Khôi phục thất bại',
                        text: error.message || 'Đã xảy ra lỗi khi khôi phục cơ sở dữ liệu',
                        confirmButtonText: 'Đóng'
                    });
                });
            }
        });
    }
    
    /**
     * Tối ưu hóa cơ sở dữ liệu
     */
    function optimizeDatabase() {
        console.log('Optimizing database');
        
        // Hiển thị thông báo đang xử lý
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification('Đang tối ưu hóa cơ sở dữ liệu...', 'info');
        } else {
            alert('Đang tối ưu hóa cơ sở dữ liệu...');
        }
        
        // Giả lập quá trình tối ưu hóa
        simulateProgress(function() {
            // Khi hoàn thành, hiển thị thông báo thành công
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification('Tối ưu hóa cơ sở dữ liệu thành công!', 'success');
            } else {
                alert('Tối ưu hóa cơ sở dữ liệu thành công!');
            }
            
            // Cập nhật lại thống kê
            loadDatabaseStats();
        });
    }
    
    /**
     * Dọn dẹp cơ sở dữ liệu
     */
    function cleanupDatabase() {
        console.log('Cleaning up database');
        
        // Hiển thị thông báo đang xử lý
        if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
            CommonModule.showNotification('Đang dọn dẹp cơ sở dữ liệu...', 'info');
        } else {
            alert('Đang dọn dẹp cơ sở dữ liệu...');
        }
        
        // Giả lập quá trình dọn dẹp
        simulateProgress(function() {
            // Khi hoàn thành, hiển thị thông báo thành công
            if (window.CommonModule && typeof CommonModule.showNotification === 'function') {
                CommonModule.showNotification('Dọn dẹp cơ sở dữ liệu thành công!', 'success');
            } else {
                alert('Dọn dẹp cơ sở dữ liệu thành công!');
            }
            
            // Cập nhật lại thống kê
            loadDatabaseStats();
        });
    }
    
    /**
     * Giả lập tiến trình với thanh tiến độ
     */
    function simulateProgress(callback) {
        const progressBar = document.querySelector(selectors.progressBar);
        
        if (!progressBar) {
            // Nếu không có thanh tiến độ, đợi một lúc và gọi callback
            setTimeout(callback, 2000);
            return;
        }
        
        // Hiển thị thanh tiến độ
        progressBar.style.width = '0%';
        progressBar.parentElement.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(function() {
            progress += Math.random() * 10;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Ẩn thanh tiến độ sau một khoảng thời gian
                setTimeout(function() {
                    progressBar.parentElement.style.display = 'none';
                    
                    // Gọi callback khi hoàn thành
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }, 500);
            }
        }, 200);
    }
    
    /**
     * Tải lịch sử sao lưu
     */
    function loadBackupHistory() {
        console.log('Loading backup history');
        
        // Tìm bảng lịch sử sao lưu
        const backupHistoryTable = document.querySelector('.section-container:nth-of-type(5) table tbody');
        if (!backupHistoryTable) {
            console.error('Backup history table not found');
            return Promise.reject('Không tìm thấy bảng lịch sử sao lưu');
        }
        
        // Hiển thị trạng thái đang tải
        backupHistoryTable.innerHTML = '<tr><td colspan="7" class="text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';
        
        // Gọi API để lấy danh sách backup
        return fetch('/api/backup', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Backup history loaded:', data);
            
            // Cập nhật bảng lịch sử
            if (data.length === 0) {
                backupHistoryTable.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có bản sao lưu nào</td></tr>';
                return data;
            }
            
            // Tạo HTML cho từng dòng
            let html = '';
            data.forEach((backup, index) => {
                html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${backup.fileName}</td>
                    <td>${backup.createdDate}</td>
                    <td>${backup.sizeFormatted}</td>
                    <td><span class="status-badge success">Thành công</span></td>
                    <td>Quản trị viên</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn download-backup-btn" data-filename="${backup.fileName}" title="Tải xuống">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="action-btn restore-backup-btn" data-filename="${backup.fileName}" title="Phục hồi">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button class="action-btn delete-backup-btn" data-filename="${backup.fileName}" title="Xóa">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            });
            
            backupHistoryTable.innerHTML = html;
            
            // Thiết lập sự kiện cho các nút
            setupBackupHistoryButtons();
            
            return data;
        })
        .catch(error => {
            console.error('Error loading backup history:', error);
            
            backupHistoryTable.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${error.message}</td></tr>`;
            return Promise.reject(error);
        });
    }
    
    /**
     * Thiết lập các nút trong bảng lịch sử sao lưu
     */
    function setupBackupHistoryButtons() {
        // Nút tải xuống
        const downloadButtons = document.querySelectorAll('.download-backup-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function() {
                const fileName = this.getAttribute('data-filename');
                if (fileName) {
                    window.location.href = `/api/backup/downloads/${fileName}`;
                }
            });
        });
        
        // Nút phục hồi
        const restoreButtons = document.querySelectorAll('.restore-backup-btn');
        restoreButtons.forEach(button => {
            button.addEventListener('click', function() {
                const fileName = this.getAttribute('data-filename');
                if (fileName) {
                    restoreBackup(fileName);
                }
            });
        });
        
        // Nút xóa (chức năng này chưa được cài đặt ở phía backend)
        const deleteButtons = document.querySelectorAll('.delete-backup-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const fileName = this.getAttribute('data-filename');
                if (fileName) {
                    alert(`Chức năng xóa backup chưa được cài đặt: ${fileName}`);
                }
            });
        });
    }
    
    // API công khai của module
    return {
        init: init,
        createBackup: createBackup,
        restoreBackup: restoreBackup,
        optimizeDatabase: optimizeDatabase,
        cleanupDatabase: cleanupDatabase,
        trainLecture: trainLecture,
        loadLectureStats: loadLectureStats,
        loadAITrainingStats: loadAITrainingStats,
        loadBackupHistory: loadBackupHistory
    };
})();

// Tự động khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    DatabaseModule.init();
});
