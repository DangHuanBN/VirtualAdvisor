/**
 * Kết quả học tập
 * Module xử lý trang kết quả học tập của sinh viên
 */

document.addEventListener('DOMContentLoaded', function() {
    initResultsPage();
});

/**
 * Khởi tạo trang kết quả học tập
 */
async function initResultsPage() {
    try {
        showLoading();
        
        // Lấy student ID từ người dùng hiện tại
        const studentId = getUserId();
        
        if (!studentId) {
            hideLoading();
            showNotification('Không thể xác định thông tin sinh viên. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        
        // Tạo phần tử hiển thị thống kê tiến độ
        createProgressSummaryElement();
        
        // Cập nhật trực tiếp các phần tử có sẵn trong DOM
        updateUIDirectly();
        
        // Load danh sách khóa học của sinh viên
        const courses = await loadStudentCourses(studentId);
        
        if (!courses || courses.length === 0) {
            hideLoading();
            document.querySelector('.grades-section').innerHTML = '<p class="no-data">Không có dữ liệu khóa học nào được tìm thấy.</p>';
            document.querySelector('.results-section').innerHTML = '<p class="no-data">Không có dữ liệu kết quả kiểm tra nào được tìm thấy.</p>';
            return;
        }
        
        // Lưu danh sách khóa học để sử dụng sau này
        window.allCourses = courses;
        
        // Điền dữ liệu vào dropdown khóa học
        populateCourseDropdown(courses);
        
        // Lắng nghe sự kiện thay đổi khóa học
        document.getElementById('courseFilter').addEventListener('change', async function() {
            await handleCourseChange(studentId);
        });
        
        // Luôn chọn "Tất cả khóa học" khi tải trang
        const courseSelect = document.getElementById('courseFilter');
        courseSelect.value = 'all';
        
        // Hiển thị tổng hợp tiến độ học tập cho tất cả khóa học
        await loadAllCoursesProgress(studentId, courses);
        hideLoading();
    } catch (error) {
        console.error('Error initializing results page:', error);
        hideLoading();
        showNotification('Đã xảy ra lỗi khi tải trang kết quả học tập', 'error');
    }
}

/**
 * Tạo phần tử HTML để hiển thị thống kê tiến độ
 */
function createProgressSummaryElement() {
    // Kiểm tra xem phần tử đã tồn tại chưa
    if (document.querySelector('.progress-summary-container')) {
        return;
    }
    
    // Tạo phần tử container
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'progress-summary-container';
    summaryContainer.style.marginTop = '20px';
    summaryContainer.style.marginBottom = '20px';
    summaryContainer.style.padding = '15px';
    summaryContainer.style.backgroundColor = 'white';
    summaryContainer.style.borderRadius = '8px';
    summaryContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    
    // Tiêu đề
    const title = document.createElement('h3');
    title.textContent = 'Thống kê tiến độ học tập';
    title.style.fontSize = '18px';
    title.style.color = '#2196F3';
    title.style.marginBottom = '15px';
    title.style.borderBottom = '1px solid #e0e0e0';
    title.style.paddingBottom = '8px';
    
    // Nội dung
    const content = document.createElement('div');
    content.className = 'progress-summary-content';
    content.innerHTML = '<p>Đang tải thông tin tiến độ...</p>';
    
    // Thêm các phần tử vào container
    summaryContainer.appendChild(title);
    summaryContainer.appendChild(content);
    
    // Thêm container vào trang
    const courseInfo = document.querySelector('.course-info');
    if (courseInfo) {
        courseInfo.parentNode.insertBefore(summaryContainer, courseInfo.nextSibling);
    } else {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const pageHeader = mainContent.querySelector('.page-header');
            if (pageHeader) {
                pageHeader.parentNode.insertBefore(summaryContainer, pageHeader.nextSibling);
            } else {
                mainContent.appendChild(summaryContainer);
            }
        }
    }
}

/**
 * Tải và hiển thị tổng hợp tiến độ của tất cả khóa học
 * @param {string} studentId ID của sinh viên
 * @param {Array} courses Danh sách khóa học
 */
async function loadAllCoursesProgress(studentId, courses) {
    try {
        showLoading();
        
        document.querySelector('.course-info').style.display = 'none';
        document.querySelector('.grades-section').innerHTML = '<p class="no-data">Vui lòng chọn một khóa học cụ thể để xem chi tiết bài học.</p>';
        document.querySelector('.results-section').style.display = 'none';
        
        // Hiển thị container thống kê
        const summaryContainer = document.querySelector('.progress-summary-container');
        if (summaryContainer) {
            summaryContainer.style.display = 'block';
        }
        
        // Tạo bảng hiển thị tiến độ từng khóa học
        let tableHtml = `
            <table class="progress-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">STT</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Mã khóa học</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Tên khóa học</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Số bài học</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Đã hoàn thành</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Tiến độ</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalProgress = 0;
        let completedCourses = 0;
        let activeCourses = 0;
        let totalLectures = 0;
        let totalCompletedLectures = 0;
        
        // Lấy thông tin tiến độ của từng khóa học
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            const courseId = course.id || course.courseId;
            const courseName = course.name || course.courseName || `Khóa học ${courseId}`;
            
            // Lấy dữ liệu tracking cho khóa học
            const progressData = await fetchCourseProgress(studentId, courseId);
            
            // Tính toán tiến độ
            let courseProgress = 0;
            let status = 'Chưa bắt đầu';
            let statusColor = 'gray';
            
            const completedLectures = progressData.completedLectures || 0;
            const totalCourseLectures = progressData.totalLectures || 0;
            
            totalLectures += totalCourseLectures;
            totalCompletedLectures += completedLectures;
            
            if (totalCourseLectures > 0) {
                courseProgress = Math.round((completedLectures / totalCourseLectures) * 100);
                
                if (courseProgress === 100) {
                    status = 'Hoàn thành';
                    statusColor = 'green';
                    completedCourses++;
                } else if (courseProgress > 0) {
                    status = 'Đang học';
                    statusColor = '#2196F3';
                    activeCourses++;
                }
            }
            
            totalProgress += courseProgress;
            
            // Thêm hàng vào bảng
            tableHtml += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${i + 1}</td>
                    <td style="padding: 10px;">${courseId}</td>
                    <td style="padding: 10px;">${courseName}</td>
                    <td style="padding: 10px; text-align: center;">${totalCourseLectures}</td>
                    <td style="padding: 10px; text-align: center;">${completedLectures}</td>
                    <td style="padding: 10px; text-align: center;">
                        <div style="width: 100%; height: 20px; background-color: #f0f0f0; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${courseProgress}%; height: 100%; background-color: #2196F3;"></div>
                        </div>
                        <div style="text-align: center; margin-top: 5px;">${courseProgress}%</div>
                    </td>
                    <td style="padding: 10px; text-align: center; color: ${statusColor}; font-weight: bold;">${status}</td>
                </tr>
            `;
        }
        
        tableHtml += '</tbody></table>';
        
        // Tính toán tiến độ trung bình
        const averageProgress = courses.length > 0 ? Math.round(totalProgress / courses.length) : 0;
        
        // Thêm thông tin tổng hợp
        const summaryHtml = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div style="flex: 1; text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 5px; margin-right: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${averageProgress}%</div>
                    <div style="font-size: 14px; color: #666;">Tiến độ trung bình</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 5px; margin-right: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: green;">${completedCourses}</div>
                    <div style="font-size: 14px; color: #666;">Khóa học đã hoàn thành</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 5px; margin-right: 10px;">
                    <div style="font-size: 24px; font-weight: bold; color: #FF9800;">${activeCourses}</div>
                    <div style="font-size: 14px; color: #666;">Khóa học đang học</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <div style="font-size: 24px; font-weight: bold; color: #673AB7;">${totalCompletedLectures}/${totalLectures}</div>
                    <div style="font-size: 14px; color: #666;">Tổng số bài học đã hoàn thành</div>
                </div>
            </div>
            <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333;">Chi tiết tiến độ từng khóa học</h4>
            ${tableHtml}
        `;
        
        // Cập nhật nội dung
        const content = document.querySelector('.progress-summary-content');
        if (content) {
            content.innerHTML = summaryHtml;
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading all courses progress:', error);
        hideLoading();
        
        // Hiển thị thông báo lỗi
        const content = document.querySelector('.progress-summary-content');
        if (content) {
            content.innerHTML = '<p class="no-data">Không thể tải dữ liệu tiến độ. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Lấy dữ liệu tiến độ cho một khóa học
 * @param {string} studentId ID của sinh viên
 * @param {string} courseId ID của khóa học
 * @returns {Promise<Object>} Dữ liệu tiến độ
 */
async function fetchCourseProgress(studentId, courseId) {
    try {
        console.log(`Đang lấy dữ liệu tiến độ cho khóa học ${courseId} của sinh viên ${studentId}`);
        
        // Tạo endpoint chính để lấy thông tin tiến độ
        const endpoint = `/api/tracking/course/${courseId}/user/${studentId}`;
        let trackingData = null;
        
        try {
            const response = await fetch(endpoint);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`Dữ liệu tiến độ từ API:`, result);
                
                if (result.success && result.data) {
                    // Khai thác dữ liệu từ API
                    const lectures = result.data.lectureProgress || [];
                    
                    // Đếm số bài giảng đã hoàn thành
                    let completedLectures = 0;
                    lectures.forEach(item => {
                        if (item.status === 'hoanthanh') {
                            completedLectures++;
                        }
                    });
                    
                    return {
                        totalLectures: lectures.length,
                        completedLectures: completedLectures,
                        courseType: result.data.courseType || 'unknown'
                    };
                }
            } else {
                console.warn(`API trả về lỗi: ${response.status} - ${response.statusText}`);
            }
        } catch (apiError) {
            console.error(`Lỗi khi truy vấn API ${endpoint}:`, apiError);
        }
        
        // Phương án dự phòng: Truy vấn dữ liệu từ bảng studytracking
        const backupEndpoint = `/api/studytracking/student/${studentId}/course/${courseId}`;
        
        try {
            const response = await fetch(backupEndpoint);
            
            if (response.ok) {
                trackingData = await response.json();
                console.log(`Dữ liệu tracking từ backup endpoint:`, trackingData);
                
                if (Array.isArray(trackingData) && trackingData.length > 0) {
                    // Đếm số bài học đã hoàn thành
                    let completedLectures = 0;
                    trackingData.forEach(item => {
                        if (item.status === 'hoanthanh') {
                            completedLectures++;
                        }
                    });
                    
                    return {
                        totalLectures: trackingData.length,
                        completedLectures: completedLectures
                    };
                }
            }
        } catch (backupError) {
            console.error(`Lỗi khi truy vấn backup endpoint:`, backupError);
        }
        
        // Kiểm tra các phần tử trực tiếp trong DOM
        const detailTable = document.querySelector(".grades-table tbody");
        if (detailTable && detailTable.children.length > 0) {
            // Đếm số bài học đã hoàn thành từ bảng chi tiết
            let completedFromTable = 0;
            let totalFromTable = detailTable.children.length;
            
            // Đếm số bài hoàn thành từ bảng hiển thị
            Array.from(detailTable.children).forEach(row => {
                const statusCell = row.querySelector("td:nth-child(5)");
                if (statusCell && statusCell.textContent.includes("Hoàn thành")) {
                    completedFromTable++;
                }
            });
            
            console.log(`Từ bảng hiển thị: ${completedFromTable}/${totalFromTable} bài học đã hoàn thành`);
            
            if (totalFromTable > 0) {
                return {
                    totalLectures: totalFromTable,
                    completedLectures: completedFromTable
                };
            }
        }
        
        // Phương án cuối cùng: Truy vấn trực tiếp SQL thông qua API
        try {
            const sqlEndpoint = `/api/tracking/sql?query=SELECT COUNT(*) as total, SUM(CASE WHEN status = 'hoanthanh' THEN 1 ELSE 0 END) as completed FROM studytracking WHERE user_id = ${studentId} AND lecture_id IN (SELECT lecture_id FROM lecture WHERE course_id = ${courseId})`;
            const sqlResponse = await fetch(sqlEndpoint);
            
            if (sqlResponse.ok) {
                const sqlResult = await sqlResponse.json();
                console.log(`Kết quả truy vấn SQL:`, sqlResult);
                
                if (sqlResult.success && sqlResult.data && sqlResult.data.length > 0) {
                    const stats = sqlResult.data[0];
                    return {
                        totalLectures: parseInt(stats.total) || 0,
                        completedLectures: parseInt(stats.completed) || 0
                    };
                }
            }
        } catch (sqlError) {
            console.error(`Lỗi khi truy vấn SQL:`, sqlError);
        }
        
        // Nếu không lấy được dữ liệu, lấy từ cache
        if (window.lastTrackingData && window.lastTrackingCourseId === courseId) {
            console.log(`Sử dụng dữ liệu cache cho khóa học ${courseId}`);
            const cachedData = window.lastTrackingData;
            
            if (Array.isArray(cachedData) && cachedData.length > 0) {
                let completedLectures = 0;
                cachedData.forEach(item => {
                    if (item.status === 'hoanthanh') {
                        completedLectures++;
                    }
                });
                
                return {
                    totalLectures: cachedData.length,
                    completedLectures: completedLectures
                };
            }
        }
        
        // Không tìm thấy dữ liệu nào, trả về mặc định
        console.warn(`Không tìm thấy dữ liệu tracking cho khóa học ${courseId}`);
        return {
            totalLectures: 0,
            completedLectures: 0
        };
    } catch (error) {
        console.error(`Error fetching progress for course ${courseId}:`, error);
        return {
            totalLectures: 0,
            completedLectures: 0
        };
    }
}

/**
 * Cập nhật trực tiếp các phần tử UI trong trang
 */
function updateUIDirectly() {
    try {
        // Cập nhật phần số 43% ở đầu trang
        const progressElements = document.querySelectorAll('.progress-percentage, .percentage-value');
        progressElements.forEach(el => {
            console.log('Tìm thấy phần tử tiến độ:', el);
        });
        
        // Cập nhật trực tiếp số hiển thị trong trang
        const progressValue = document.querySelector('.tiến-độ-học-tập');
        if (progressValue && progressValue.textContent === '43%') {
            console.log('Cập nhật tiến độ học tập trực tiếp');
        }
        
        // Cập nhật phần tử bên trái
        const leftSection = document.querySelector('.tiến-độ-học-tập-left');
        if (leftSection) {
            console.log('Đã tìm thấy phần tử bên trái');
        }
        
        // Cập nhật phần tử có id = bài-học-đã-hoàn-thành
        const completedElement = document.getElementById('bài-học-đã-hoàn-thành');
        if (completedElement) {
            console.log('Đã tìm thấy phần tử bài học đã hoàn thành');
        }
        
        // Cập nhật các phần tử có 43% trong nội dung
        document.querySelectorAll('*').forEach(el => {
            if (el.childNodes && el.childNodes.length > 0) {
                for (let i = 0; i < el.childNodes.length; i++) {
                    const node = el.childNodes[i];
                    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.includes('43%')) {
                        console.log('Tìm thấy text node chứa 43%:', el);
                    }
                }
            }
        });
        
        // Cập nhật các div/div con chứa số 43
        document.querySelectorAll('.main-content .progress-summary .summary-info p, .tiến-độ-học-tập, .progress-center').forEach(el => {
            console.log('Phần tử tiến độ trung tâm:', el.textContent);
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật UI trực tiếp:', error);
    }
}

/**
 * Lấy ID của người dùng hiện tại
 * @returns {string|null} ID của người dùng
 */
function getUserId() {
    // Kiểm tra xem có AuthHelper không
    if (typeof AuthHelper !== 'undefined' && AuthHelper.getCurrentUserId) {
        return AuthHelper.getCurrentUserId();
    }
    
    // Nếu không, kiểm tra localStorage
    const userId = localStorage.getItem('currentUserId') || localStorage.getItem('studentId');
    return userId;
}

/**
 * Lấy danh sách khóa học của sinh viên từ API
 * @param {string} studentId ID của sinh viên
 * @returns {Promise<Array>} Danh sách khóa học
 */
async function loadStudentCourses(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}/courses`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading student courses:', error);
        showNotification('Không thể tải danh sách khóa học', 'error');
        return [];
    }
}

/**
 * Điền dữ liệu vào dropdown khóa học
 * @param {Array} courses Danh sách khóa học
 */
function populateCourseDropdown(courses) {
    try {
        const dropdown = document.getElementById('courseFilter');
        
        // Xóa tất cả các tùy chọn hiện tại
        dropdown.innerHTML = '';
        
        // Thêm tùy chọn "Tất cả khóa học" và đặt là mặc định được chọn
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'Tất cả khóa học';
        allOption.selected = true;
        dropdown.appendChild(allOption);
        
        // Thêm các khóa học vào dropdown
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id || course.courseId;
            option.textContent = course.name || course.courseName || `Khóa học ${option.value}`;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating course dropdown:', error);
    }
}

/**
 * Xử lý sự kiện khi thay đổi khóa học
 * @param {string} studentId ID của sinh viên
 */
async function handleCourseChange(studentId) {
    showLoading();
    
    const courseId = document.getElementById('courseFilter').value;
    
    // Hiển thị hoặc ẩn container thống kê tiến độ
    const summaryContainer = document.querySelector('.progress-summary-container');
    if (summaryContainer) {
        if (courseId === 'all') {
            summaryContainer.style.display = 'block';
        } else {
            summaryContainer.style.display = 'none';
        }
    }
    
    if (courseId === 'all') {
        document.querySelector('.course-info').style.display = 'none';
        document.querySelector('.grades-section').innerHTML = '<p class="no-data">Vui lòng chọn một khóa học cụ thể để xem kết quả.</p>';
        document.querySelector('.results-section').innerHTML = '<p class="no-data">Vui lòng chọn một khóa học cụ thể để xem kết quả kiểm tra.</p>';
        
        // Hiển thị tổng hợp tiến độ học tập khi chọn "Tất cả khóa học"
        await loadAllCoursesProgress(studentId, window.allCourses || []);
        hideLoading();
        return;
    }
    
    // Lấy tên khóa học từ dropdown để cập nhật giao diện
    const courseSelect = document.getElementById('courseFilter');
    const selectedOption = courseSelect.options[courseSelect.selectedIndex];
    const courseName = selectedOption.getAttribute('data-name') || selectedOption.textContent;
    
    // Cập nhật tiêu đề khóa học ngay lập tức
    const titleElement = document.querySelector('.course-title h3');
    if (titleElement) {
        titleElement.textContent = courseName;
    }
    
    await loadStudentResults(studentId, courseId, courseName);
}

/**
 * Lấy kết quả học tập của sinh viên cho một khóa học cụ thể
 * @param {string} studentId ID của sinh viên
 * @param {string} courseId ID của khóa học
 * @param {string} courseName Tên khóa học
 */
async function loadStudentResults(studentId, courseId, courseName) {
    try {
        showLoading();
        
        // Reset dữ liệu tracking cũ khi chuyển khóa học
        window.lastTrackingData = null;
        window.currentCourseId = courseId;
        
        // API URL chính
        let apiUrl = `/api/students/${studentId}/courses/${courseId}/results`;
        
        console.log('Đang gọi API kết quả:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        console.log('Dữ liệu kết quả học tập:', results);
        
        // Truy vấn dữ liệu studytracking từ CSDL
        try {
            // Đảm bảo dữ liệu luôn được lấy mới từ server
            const timestamp = new Date().getTime();
            
            // Truy vấn trực tiếp CSDL studytracking
            const trackingEndpoints = [
                `/api/studytracking?userId=${studentId}&courseId=${courseId}&t=${timestamp}`,
                `/api/tracking/${studentId}/${courseId}?t=${timestamp}`,
                `/api/studytracking/student/${studentId}/course/${courseId}?t=${timestamp}`,
                `/api/tracking?userId=${studentId}&courseId=${courseId}&t=${timestamp}`
            ];
            
            let trackingData = null;
            let successfulEndpoint = '';
            
            // Thử lần lượt các endpoint cho đến khi có một cái hoạt động
            for (const endpoint of trackingEndpoints) {
                try {
                    console.log('Thử truy vấn dữ liệu tracking qua:', endpoint);
                    const trackingResponse = await fetch(endpoint);
                    
                    if (trackingResponse.ok) {
                        trackingData = await trackingResponse.json();
                        successfulEndpoint = endpoint;
                        console.log('Dữ liệu tracking từ CSDL:', trackingData);
                        break;
                    }
                } catch (endpointError) {
                    console.warn(`Không thể truy vấn qua endpoint ${endpoint}:`, endpointError);
                }
            }
            
            if (trackingData && Array.isArray(trackingData) && trackingData.length > 0) {
                console.log('Đã lấy dữ liệu tracking thành công từ:', successfulEndpoint);
                // Lưu dữ liệu tracking và thông tin khóa học hiện tại
                window.lastTrackingData = trackingData;
                window.lastTrackingCourseId = courseId;
                
                // Cập nhật kết quả với dữ liệu tracking
                updateResultsWithTrackingData(results, trackingData);
                
                // Hiển thị dữ liệu tracking ngay cả khi không có dữ liệu lectures
                if (!results.lectures || !results.lectures.length) {
                    results.lectures = trackingData;
                }
                
                if (!results.lectureResults || !results.lectureResults.length) {
                    results.lectureResults = trackingData;
                }
            } else {
                console.warn('Không thể lấy dữ liệu tracking từ bất kỳ endpoint nào');
                // Đảm bảo không có dữ liệu tracking cũ
                window.lastTrackingData = null;
                window.lastTrackingCourseId = null;
            }
        } catch (error) {
            console.error('Lỗi khi truy vấn dữ liệu tracking:', error);
            // Đảm bảo không có dữ liệu tracking cũ
            window.lastTrackingData = null;
            window.lastTrackingCourseId = null;
        }
        
        // Thêm thông tin tên khóa học vào kết quả
        if (!results.courseInfo) {
            results.courseInfo = {
                name: courseName,
                id: courseId
            };
        } else {
            results.courseInfo.name = courseName || results.courseInfo.name;
        }
        
        // Hiển thị kết quả
        displayStudentResults(results, courseId);
        hideLoading();
    } catch (error) {
        console.error('Error loading student results:', error);
        hideLoading();
        showNotification('Không thể tải kết quả học tập. Lỗi: ' + error.message, 'error');
        
        // Hiển thị thông báo lỗi trên giao diện
        const gradesSection = document.querySelector('.grades-section');
        if (gradesSection) {
            gradesSection.innerHTML = '<p class="no-data">Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.</p>';
        }
        
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            resultsSection.innerHTML = '<p class="no-data">Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Cập nhật dữ liệu kết quả với dữ liệu tracking từ bảng studytracking
 * @param {Object} results Dữ liệu kết quả học tập
 * @param {Array} trackingData Dữ liệu tracking từ bảng studytracking
 */
function updateResultsWithTrackingData(results, trackingData) {
    try {
        console.log('Dữ liệu kết quả nhận được:', results);
        console.log('Dữ liệu tracking nhận được:', trackingData);
        
        if (!results) {
            console.error('Dữ liệu kết quả không hợp lệ: results là null hoặc undefined');
            return;
        }

        // Chuyển đổi kết quả nếu cần thiết
        if (!results.lectureResults && Array.isArray(results.LectureResults)) {
            results.lectureResults = results.LectureResults;
        }
        
        // Nếu không có lecture hay lectureResults, tạo từ dữ liệu tracking
        if (!results.lectureResults && !results.lectures) {
            console.log('Không tìm thấy dữ liệu bài giảng trong kết quả, tạo từ dữ liệu tracking');
            results.lectures = [];
            results.lectureResults = [];
            
            if (Array.isArray(trackingData) && trackingData.length > 0) {
                trackingData.forEach(tracking => {
                    const lecture = {
                        lectureId: tracking.lectureId,
                        title: tracking.title || 'Bài giảng ' + tracking.lectureId,
                        type: tracking.type || 'baigiang',
                        progress: tracking.progress || 0,
                        status: tracking.status || 'chuahoanthanh',
                        startDate: tracking.startDate || tracking.start_date || null,
                        endDate: tracking.endDate || tracking.end_date || null
                    };
                    
                    results.lectures.push(lecture);
                    results.lectureResults.push(lecture);
                });
            }
        } else if (results.lectureResults && Array.isArray(results.lectureResults)) {
            // Cập nhật dữ liệu lectureResults từ tracking
            results.lectureResults.forEach(lecture => {
                // Tìm dữ liệu tracking tương ứng
                const trackingInfo = trackingData.find(tracking => tracking.lectureId === lecture.lectureId);
                
                if (trackingInfo) {
                    console.log(`Cập nhật dữ liệu tracking cho bài giảng ${lecture.title}:`, trackingInfo);
                    
                    // Cập nhật dữ liệu từ bảng studytracking
                    lecture.progress = trackingInfo.progress || 0;
                    lecture.status = trackingInfo.status || 'chuahoanthanh';
                    lecture.startDate = trackingInfo.startDate || trackingInfo.start_date || null;
                    lecture.endDate = trackingInfo.endDate || trackingInfo.end_date || null;
                }
            });
        } else if (results.lectures && Array.isArray(results.lectures)) {
            // Nếu chỉ có lectures, cập nhật dữ liệu từ tracking
            results.lectures.forEach(lecture => {
                // Tìm dữ liệu tracking tương ứng
                const trackingInfo = trackingData.find(tracking => 
                    tracking.lectureId === lecture.lectureId || 
                    tracking.lectureId === lecture.id);
                
                if (trackingInfo) {
                    console.log(`Cập nhật dữ liệu tracking cho bài giảng ${lecture.title}:`, trackingInfo);
                    
                    // Cập nhật dữ liệu từ bảng studytracking
                    lecture.progress = trackingInfo.progress || 0;
                    lecture.status = trackingInfo.status || 'chuahoanthanh';
                    lecture.startDate = trackingInfo.startDate || trackingInfo.start_date || null;
                    lecture.endDate = trackingInfo.endDate || trackingInfo.end_date || null;
                }
            });
        }
        
        // Cập nhật thống kê tổng quan
        updateStatisticsFromTracking(results, trackingData);
        
        console.log('Kết quả sau khi cập nhật với dữ liệu tracking:', results);
    } catch (error) {
        console.error('Lỗi khi cập nhật kết quả với dữ liệu tracking:', error);
    }
}

/**
 * Cập nhật thống kê từ dữ liệu tracking
 * @param {Object} results Dữ liệu kết quả học tập
 * @param {Array} trackingData Dữ liệu tracking từ bảng studytracking
 */
function updateStatisticsFromTracking(results, trackingData) {
    // Lấy danh sách bài giảng từ kết quả hoặc từ dữ liệu tracking
    const lectures = results.lectures || results.lectureResults || trackingData || [];
    
    if (lectures.length === 0) return;
    
    // Tính toán thống kê
    let completedLessons = 0;
    let totalProgress = 0;
    
    lectures.forEach(lecture => {
        totalProgress += Number(lecture.progress || 0);
        if (lecture.status === 'hoanthanh') {
            completedLessons++;
        }
    });
    
    // Tính toán tiến độ trung bình
    const averageProgress = lectures.length > 0 ? Math.round(totalProgress / lectures.length) : 0;
    
    // Cập nhật các phần tử hiển thị tiến độ ở phần thông tin khóa học
    updateProgressDisplay(averageProgress, completedLessons, lectures.length);
    
    // Cập nhật overview nếu tồn tại
    if (results.overview) {
        results.overview.completedLessons = completedLessons;
        results.overview.totalLessons = lectures.length;
        results.overview.completionRate = lectures.length > 0 ? Math.round((completedLessons / lectures.length) * 100) : 0;
        results.overview.averageProgress = averageProgress;
        
        // Xác định trạng thái hiện tại
        if (completedLessons === lectures.length && lectures.length > 0) {
            results.overview.status = 'completed';
        } else if (completedLessons > 0) {
            results.overview.status = 'in-progress';
        } else {
            results.overview.status = 'not-started';
        }
    } else {
        // Tạo object overview nếu chưa có
        results.overview = {
            completedLessons: completedLessons,
            totalLessons: lectures.length,
            completionRate: lectures.length > 0 ? Math.round((completedLessons / lectures.length) * 100) : 0,
            averageProgress: averageProgress,
            status: completedLessons === lectures.length && lectures.length > 0 ? 'completed' : 
                    completedLessons > 0 ? 'in-progress' : 'not-started'
        };
    }
    
    // Cập nhật thống kê khóa học - loại bỏ điểm
    if (!results.courseInfo) {
        results.courseInfo = {
            progress: averageProgress
        };
    }
}

/**
 * Cập nhật hiển thị tiến độ trên giao diện
 * @param {number} progress Tiến độ trung bình
 * @param {number} completed Số bài học đã hoàn thành
 * @param {number} total Tổng số bài học
 */
function updateProgressDisplay(progress, completed, total) {
    try {
        console.log(`Cập nhật hiển thị tiến độ: ${progress}%, ${completed}/${total} bài học`);
        
        // Tiến độ trong phần khóa học
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues && statValues.length >= 1) {
            statValues[0].textContent = `${progress}%`;
            console.log('Đã cập nhật tiến độ khóa học');
        }
        
        // Cập nhật tiến độ học tập ở bên trái
        const sidebarProgress = document.querySelector('.tiến-độ-học-tập');
        if (sidebarProgress) {
            sidebarProgress.textContent = `${progress}%`;
        }
        
        // Cập nhật tiến độ học tập ở phần tiêu đề
        const progressSection = document.querySelector('.tiến-độ');
        if (progressSection) {
            progressSection.textContent = `${progress}%`;
        }
        
        // Cập nhật phần "43%" dưới tiêu đề "Tiến độ học tập"
        const progressValue = document.querySelector('.tiến-độ-học-tập + .progress-value');
        if (progressValue) {
            progressValue.textContent = `${progress}%`;
        } else {
            // Thử cách khác để tìm phần tử tiến độ
            const progressPercentages = document.querySelectorAll('.progress-percentage');
            progressPercentages.forEach(el => {
                el.textContent = `${progress}%`;
            });
        }
        
        // Thử cập nhật tiến độ trong tất cả các phần tử có thể chứa giá trị tiến độ
        document.querySelectorAll('.progress-value, .progress-text, .progress-percentage, .percentage').forEach(el => {
            if (el.textContent.includes('%') || !isNaN(parseFloat(el.textContent))) {
                el.textContent = `${progress}%`;
            }
        });
        
        // Cập nhật tiến độ học tập trong phần summary
        const summaryInfos = document.querySelectorAll('.summary-info p');
        if (summaryInfos && summaryInfos.length >= 1) {
            summaryInfos[0].textContent = `${progress}%`;
            console.log('Đã cập nhật tiến độ trong summary');
        }
        
        // Cập nhật số bài học đã hoàn thành
        if (summaryInfos && summaryInfos.length >= 2) {
            summaryInfos[1].textContent = `${completed}/${total} bài học`;
            console.log('Đã cập nhật số bài học đã hoàn thành');
        }
        
        // Cập nhật số bài hoàn thành trong phần box ở trên cùng
        document.querySelectorAll('.bài-học-đã-hoàn-thành, .completed-lessons, .completed-count').forEach(el => {
            el.textContent = `${completed}/${total} bài học`;
        });
        
        // Cập nhật hiển thị trạng thái
        const statusText = completed === total && total > 0 ? 'Hoàn thành' : 
                          completed > 0 ? 'Đang học' : 'Chưa bắt đầu';
                          
        if (summaryInfos && summaryInfos.length >= 3) {
            summaryInfos[2].textContent = statusText;
            console.log('Đã cập nhật trạng thái');
        }
        
        // Cập nhật trực tiếp các giá trị 43% hiển thị ở các box
        const percentageElements = document.querySelectorAll('.tiến-độ-học-tập-box .value');
        percentageElements.forEach(el => {
            if (el.textContent.includes('%')) {
                el.textContent = `${progress}%`;
            }
        });
        
        // Cập nhật cả text node con
        for (let i = 0; i < document.body.childNodes.length; i++) {
            const node = document.body.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('43%')) {
                node.textContent = node.textContent.replace('43%', `${progress}%`);
            }
        }
        
        // Cập nhật trực tiếp phần tử hiển thị "43%" ở trang results
        const directProgressElement = document.getElementById('tiến-độ-học-tập');
        if (directProgressElement) {
            directProgressElement.textContent = `${progress}%`;
        }
        
        // Cập nhật giá trị trong phần trạng thái hiện tại
        const statusElement = document.querySelector('.trạng-thái-hiện-tại');
        if (statusElement) {
            statusElement.textContent = statusText;
        }
        
        console.log('Hoàn tất cập nhật hiển thị tiến độ');
    } catch (error) {
        console.error('Lỗi khi cập nhật hiển thị tiến độ:', error);
    }
}

/**
 * Thêm một hàng vào bảng hiển thị kết quả học tập
 * @param {HTMLTableSectionElement} tableBody Phần tbody của bảng
 * @param {Object} lecture Thông tin bài giảng
 */
function addLectureRowToTable(tableBody, lecture) {
    const row = document.createElement('tr');
    
    // Lecture ID
    const idCell = document.createElement('td');
    idCell.textContent = lecture.lectureId || lecture.id || '-';
    row.appendChild(idCell);
    
    // Lecture title
    const titleCell = document.createElement('td');
    titleCell.textContent = lecture.title || '-';
    row.appendChild(titleCell);
    
    // Lecture type
    const typeCell = document.createElement('td');
    typeCell.textContent = getLectureType(lecture.type) || '-';
    row.appendChild(typeCell);
    
    // Progress - chỉ hiển thị số % không cần thanh progress
    const progressCell = document.createElement('td');
    const progress = Number(lecture.progress || 0);
    progressCell.textContent = `${progress}%`;
    row.appendChild(progressCell);
    
    // Status
    const statusCell = document.createElement('td');
    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';
    
    // Xác định biểu tượng trạng thái dựa vào status từ bảng studytracking
    if (lecture.status === 'hoanthanh') {
        // Đã hoàn thành: Dấu tích
        statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: green;"></i>';
        statusCell.textContent = ' Hoàn thành';
        statusCell.prepend(statusIcon);
    } else {
        // Chưa hoàn thành: Biểu tượng khóa
        statusIcon.innerHTML = '<i class="fas fa-lock" style="color: gray;"></i>';
        statusCell.textContent = ' Chưa hoàn thành';
        statusCell.prepend(statusIcon);
    }
    
    row.appendChild(statusCell);
    
    // Start date
    const startDateCell = document.createElement('td');
    startDateCell.textContent = lecture.startDate ? formatDate(lecture.startDate) : '-';
    row.appendChild(startDateCell);
    
    // End date
    const endDateCell = document.createElement('td');
    endDateCell.textContent = lecture.endDate ? formatDate(lecture.endDate) : '-';
    row.appendChild(endDateCell);
    
    tableBody.appendChild(row);
}

/**
 * Hiển thị kết quả học tập
 * @param {Object} results Kết quả học tập
 * @param {string} currentCourseId ID của khóa học hiện tại
 */
function displayStudentResults(results, currentCourseId) {
    try {
        if (!results) {
            document.querySelector('.course-info').style.display = 'none';
            document.querySelector('.grades-section').innerHTML = '<p class="no-data">Không có dữ liệu nào được tìm thấy.</p>';
            document.querySelector('.results-section').innerHTML = '<p class="no-data">Không có dữ liệu kết quả kiểm tra nào được tìm thấy.</p>';
            return;
        }
        
        // Hiển thị thông tin khóa học
        if (results.courseInfo) {
            updateCourseInfo(results.courseInfo);
        }
        
        // Hiển thị thông tin tiến độ tổng quan
        if (results.overview) {
            updateProgressSummary(results.overview);
        }
        
        // Hiển thị bảng điểm theo từng phần
        const gradesSection = document.querySelector('.grades-section');
        if (!gradesSection) {
            console.error('Không tìm thấy phần tử .grades-section');
        } else if (results.lectureResults && results.lectureResults.length > 0) {
            // Ưu tiên sử dụng lectureResults từ API
            updateGradesTable(results.lectureResults);
        } else if (results.LectureResults && results.LectureResults.length > 0) {
            // Trường hợp cho LectureResults (viết hoa)
            updateGradesTable(results.LectureResults);
        } else if (results.lectures && Array.isArray(results.lectures) && results.lectures.length > 0) {
            // Sử dụng lectures nếu có
            updateGradesTable(results.lectures);
        } else {
            // Kiểm tra xem có dữ liệu tracking hợp lệ không (cho khóa học hiện tại)
            const trackingData = window.lastTrackingData;
            const trackingCourseId = window.lastTrackingCourseId;
            
            if (trackingData && Array.isArray(trackingData) && trackingData.length > 0 && trackingCourseId === currentCourseId) {
                console.log('Hiển thị dữ liệu từ bảng studytracking:', trackingData);
                updateGradesTable(trackingData);
            } else {
                gradesSection.innerHTML = '<p class="no-data">Khóa học này không có dữ liệu bài giảng nào.</p>';
            }
        }
        
        // Ẩn phần kết quả kiểm tra
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Lỗi khi hiển thị kết quả học tập:', error);
        showNotification('Không thể hiển thị kết quả học tập', 'error');
    }
}

/**
 * Cập nhật thông tin khóa học
 * @param {Object} courseInfo Thông tin khóa học
 */
function updateCourseInfo(courseInfo) {
    // Hiển thị phần thông tin khóa học
    document.querySelector('.course-info').style.display = 'flex';
    
    // Cập nhật tiêu đề khóa học
    const titleElement = document.querySelector('.course-title h3');
    const descElement = document.querySelector('.course-title p');
    
    if (titleElement) {
        titleElement.textContent = courseInfo.name || courseInfo.courseName || 'Chưa có tên khóa học';
    }
    
    if (descElement) {
        descElement.textContent = courseInfo.description || `Mã khóa học: ${courseInfo.id || courseInfo.courseId}`;
    }
    
    // Cập nhật thống kê khóa học
    const statValues = document.querySelectorAll('.stat-value');
    
    if (statValues && statValues.length >= 3) {
        // Tiến độ
        statValues[0].textContent = `${courseInfo.progress || courseInfo.overallProgress || 0}%`;
        
        // Ẩn phần hiển thị điểm
        const statItems = document.querySelectorAll('.stat-item');
        if (statItems && statItems.length >= 3) {
            // Ẩn phần điểm tổng kết
            statItems[1].style.display = 'none';
            // Ẩn phần xếp loại
            statItems[2].style.display = 'none';
        }
    }
}

/**
 * Cập nhật thông tin tiến độ tổng quan
 * @param {Object} progressData Dữ liệu tiến độ
 */
function updateProgressSummary(progressData) {
    const summaryInfos = document.querySelectorAll('.summary-info p');
    
    if (summaryInfos && summaryInfos.length >= 3) {
        // Tiến độ học tập
        summaryInfos[0].textContent = `${progressData.averageProgress || progressData.overallProgress || 0}%`;
        
        // Bài học đã hoàn thành
        summaryInfos[1].textContent = `${progressData.completedLessons || 0}/${progressData.totalLessons || 0} bài học`;
        
        // Trạng thái hiện tại
        const statusText = getStatusText(progressData.status);
        summaryInfos[2].textContent = statusText;
    }
    
    // Cập nhật các phần tử hiển thị tiến độ khác
    updateOtherProgressElements(
        progressData.averageProgress || progressData.overallProgress || 0,
        progressData.completedLessons || 0,
        progressData.totalLessons || 0
    );
}

/**
 * Cập nhật các phần tử tiến độ khác trong giao diện
 * @param {number} progress Tiến độ học tập
 * @param {number} completed Số bài học đã hoàn thành
 * @param {number} total Tổng số bài học
 */
function updateOtherProgressElements(progress, completed, total) {
    try {
        console.log(`Cập nhật các phần tử tiến độ khác: ${progress}%, ${completed}/${total}`);
        
        // Cập nhật tiến độ học tập trong box bên trái
        const progressBox = document.querySelector('.tiến-độ-học-tập');
        if (progressBox) {
            progressBox.textContent = `${progress}%`;
        }
        
        // Cập nhật phần trung tâm hiển thị % tiến độ
        const centralProgress = document.querySelector('.progress-center');
        if (centralProgress) {
            centralProgress.textContent = `${progress}%`;
        }
        
        // Cập nhật hầu hết các phần tử hiển thị 43%
        document.querySelectorAll('[id="43%"], [class*="43"], .progress-value, .progress-text').forEach(el => {
            if (el && (el.textContent.includes('%') || !isNaN(parseFloat(el.textContent)))) {
                el.textContent = `${progress}%`;
            }
        });
        
        // Cập nhật trạng thái hiện tại
        const statusText = completed === total && total > 0 ? 'Hoàn thành' : 
                         completed > 0 ? 'Đang học' : 'Chưa bắt đầu';
        
        document.querySelectorAll('.status-text, .current-status').forEach(el => {
            if (el) el.textContent = statusText;
        });
        
        // Cập nhật số bài học đã hoàn thành
        document.querySelectorAll('.completed-count, .lessons-completed').forEach(el => {
            if (el) el.textContent = `${completed}/${total} bài học`;
        });
        
        // Cập nhật trực tiếp các phần tử hiển thị 43% trong bài học
        document.querySelectorAll('.bài-hoàn-thành').forEach(el => {
            const fractionText = el.textContent;
            if (fractionText && fractionText.includes('/')) {
                el.textContent = `${completed}/${total}`;
            }
        });
        
        // Tìm phần tử hiển thị số 43 và cập nhật
        const progressNumberElements = document.querySelectorAll('.number-43, .percentage-43');
        progressNumberElements.forEach(el => {
            if (el) el.textContent = `${progress}`;
        });
        
        // Cập nhật giá trị trong document với content edit = 43%
        const spans = document.querySelectorAll('span');
        spans.forEach(span => {
            if (span.textContent === '43%') {
                span.textContent = `${progress}%`;
            }
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật các phần tử tiến độ khác:', error);
    }
}

/**
 * Cập nhật bảng điểm theo từng phần
 * @param {Array} lectures Danh sách bài giảng hoặc dữ liệu tracking
 */
function updateGradesTable(lectures) {
    if (!lectures || lectures.length === 0) {
        document.querySelector('.grades-section').innerHTML = '<p class="no-data">Không có dữ liệu bài giảng nào được tìm thấy.</p>';
        return;
    }
    
    const gradesSection = document.querySelector('.grades-section');
    if (!gradesSection) {
        console.error('Không tìm thấy phần tử .grades-section');
        return;
    }
    
    // Cập nhật tiêu đề để không sử dụng từ "điểm"
    const heading = gradesSection.querySelector('h3');
    if (heading) {
        heading.textContent = 'Chi tiết kết quả học tập từ bảng studytracking';
    }
    
    // Kiểm tra nếu không có bảng, thì tạo bảng mới
    let tableContainer = gradesSection.querySelector('.grades-table-container');
    if (!tableContainer) {
        console.warn('Không tìm thấy phần tử .grades-table-container, tạo mới');
        // Tạo tiêu đề chính nếu chưa có
        gradesSection.innerHTML = '<h3>Chi tiết kết quả học tập từ bảng studytracking</h3>';
        
        // Tạo container cho bảng
        tableContainer = document.createElement('div');
        tableContainer.className = 'grades-table-container';
        gradesSection.appendChild(tableContainer);
        
        // Tạo bảng
        const table = document.createElement('table');
        table.className = 'grades-table';
        tableContainer.appendChild(table);
        
        // Tạo thead
        const thead = document.createElement('thead');
        table.appendChild(thead);
        
        // Tạo hàng tiêu đề
        const headerRow = document.createElement('tr');
        thead.appendChild(headerRow);
        
        // Các cột tiêu đề - loại bỏ cột điểm
        const headers = ['Lecture ID', 'Tên bài học', 'Loại bài', 'Tiến độ', 'Trạng thái', 'Ngày bắt đầu', 'Ngày kết thúc'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        // Tạo tbody
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
    } else {
        // Cập nhật tiêu đề để hiển thị nguồn dữ liệu
        const heading = gradesSection.querySelector('h3');
        if (heading) {
            heading.textContent = 'Chi tiết kết quả học tập từ bảng studytracking';
        }
    }
    
    // Lấy lại table và tbody sau khi đã đảm bảo nó tồn tại
    const table = tableContainer.querySelector('.grades-table');
    if (!table) {
        console.error('Không tìm thấy phần tử .grades-table');
        return;
    }
    
    const tableBody = table.querySelector('tbody');
    if (!tableBody) {
        console.error('Không tìm thấy phần tử tbody');
        return;
    }
    
    // Xóa nội dung tbody hiện tại
    tableBody.innerHTML = '';
    
    // Kiểm tra cấu trúc dữ liệu
    console.log('Dữ liệu cần hiển thị trong bảng:', lectures);
    
    // Hiển thị số dòng trong bảng
    document.querySelector('.grades-section h3').textContent = 
        `Chi tiết kết quả học tập từ bảng studytracking (${lectures.length} bản ghi)`;
    
    // Thêm dữ liệu từ bài giảng hoặc dữ liệu tracking
    lectures.forEach(item => {
        addLectureRowToTable(tableBody, item);
    });
}

/**
 * Cập nhật kết quả kiểm tra
 * @param {Array} assessments Danh sách bài kiểm tra
 */
function updateAssessmentResults(assessments) {
    // Trước khi tìm kiếm phần tử, kiểm tra xem assessments có dữ liệu không
    if (!assessments || assessments.length === 0) {
        // Không cần tìm DOM, chỉ trả về vì displayStudentResults đã xử lý
        return;
    }
    
    // Tìm kiếm phần tử chứa danh sách kết quả kiểm tra
    const resultsSection = document.querySelector('.results-section');
    if (!resultsSection) {
        console.error('Không tìm thấy phần tử .results-section');
        return;
    }
    
    // Kiểm tra xem phần tử assessment-cards đã tồn tại chưa
    let assessmentContainer = resultsSection.querySelector('.assessment-cards');
    
    // Nếu chưa có, tạo mới phần tử này
    if (!assessmentContainer) {
        assessmentContainer = document.createElement('div');
        assessmentContainer.className = 'assessment-cards';
        
        // Đảm bảo có tiêu đề
        resultsSection.innerHTML = '<h3>Kết quả kiểm tra</h3>';
        resultsSection.appendChild(assessmentContainer);
    } else {
        // Nếu đã có, xóa nội dung cũ
        assessmentContainer.innerHTML = '';
    }
    
    // Thêm các thẻ kết quả kiểm tra
    assessments.forEach(assessment => {
        const card = document.createElement('div');
        card.className = 'assessment-card';
        
        const score = assessment.score || assessment.grade || 0;
        const maxScore = assessment.maxScore || assessment.totalPoints || 10;
        const percentage = Math.round((score / maxScore) * 100);
        
        // Thêm class dựa trên điểm số
        if (percentage >= 80) {
            card.classList.add('excellent');
        } else if (percentage >= 60) {
            card.classList.add('good');
        } else if (percentage >= 40) {
            card.classList.add('average');
        } else {
            card.classList.add('poor');
        }
        
        // Nội dung card
        card.innerHTML = `
            <div class="assessment-header">
                <h4>${assessment.name || assessment.title}</h4>
                <span class="assessment-date">${formatDate(assessment.date || assessment.submissionDate)}</span>
            </div>
            <div class="assessment-score">
                <div class="score-circle">
                    <span>${score}/${maxScore}</span>
                </div>
                <div class="score-percentage">${percentage}%</div>
            </div>
            <div class="assessment-details">
                <div class="detail-item">
                    <span class="detail-label">Loại kiểm tra:</span>
                    <span class="detail-value">${assessment.type || getAssessmentType(assessment.assessmentType)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Thời gian:</span>
                    <span class="detail-value">${assessment.duration || '60'} phút</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Trạng thái:</span>
                    <span class="detail-value">${assessment.status || 'Đã hoàn thành'}</span>
                </div>
            </div>
        `;
        
        assessmentContainer.appendChild(card);
    });
}

/**
 * Lấy loại bài giảng dựa trên mã loại
 * @param {string|number} type Mã loại bài giảng
 * @returns {string} Tên loại bài giảng
 */
function getLectureType(type) {
    switch (type) {
        case 'baigiang':
            return 'Bài giảng';
        case 'baikiemtra':
            return 'Bài kiểm tra';
        case 'baithi':
            return 'Bài thi';
        default:
            return type || 'Bài giảng';
    }
}

/**
 * Lấy trạng thái hoàn thành dựa trên tiến độ
 * @param {boolean} completed Trạng thái hoàn thành
 * @param {number} progress Tiến độ
 * @returns {string} Trạng thái
 */
function getCompletionStatus(completed, progress) {
    if (completed) {
        return 'Hoàn thành';
    } else if (progress > 0) {
        return 'Đang thực hiện';
    } else {
        return 'Chưa bắt đầu';
    }
}

/**
 * Lấy loại đánh giá dựa trên mã loại
 * @param {string|number} type Mã loại đánh giá
 * @returns {string} Tên loại đánh giá
 */
function getAssessmentType(type) {
    const types = {
        1: 'Kiểm tra trắc nghiệm',
        2: 'Kiểm tra tự luận',
        3: 'Bài tập lớn',
        4: 'Dự án',
        5: 'Khác'
    };
    
    return types[type] || 'Kiểm tra';
}

/**
 * Lấy nội dung text cho trạng thái
 * @param {string} status Trạng thái
 * @returns {string} Chuỗi trạng thái hiển thị
 */
function getStatusText(status) {
    if (!status) return 'Chưa hoàn thành';
    
    // Chuyển đổi trạng thái từ bảng studytracking
    switch(status.toLowerCase()) {
        case 'hoanthanh':
            return 'Hoàn thành';
        case 'chuahoanthanh':
            return 'Chưa hoàn thành';
        // Trạng thái từ API
        case 'completed':
        case 'hoàn thành':
            return 'Hoàn thành';
        case 'in-progress':
        case 'đang học':
        case 'đang thực hiện':
            return 'Đang học';
        case 'not-started':
        case 'chưa bắt đầu':
        case 'chưa hoàn thành':
            return 'Chưa hoàn thành';
        default:
            return status;
    }
}

/**
 * Định dạng ngày tháng
 * @param {string|Date} dateString Chuỗi hoặc đối tượng ngày
 * @returns {string} Chuỗi ngày đã định dạng
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        
        // Kiểm tra ngày hợp lệ
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        // Định dạng ngày tháng năm: DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Lỗi khi định dạng ngày:', error);
        return '-';
    }
}

/**
 * Hiển thị thông báo
 * @param {string} message Nội dung thông báo
 * @param {string} type Loại thông báo (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Kiểm tra xem CommonModule có tồn tại không
    if (typeof CommonModule !== 'undefined' && CommonModule.showNotification) {
        // Dùng hàm showNotification từ CommonModule để tránh đệ quy
        CommonModule.showNotification(message, type);
        return;
    }
    
    // Nếu không có CommonModule, chỉ hiển thị trong console
    console.log(`Thông báo (${type}): ${message}`);
    
    try {
        // Hiển thị thông báo đơn giản nếu không có sẵn
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Hiển thị
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Tự động ẩn
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    } catch (error) {
        // Tránh lỗi nếu DOM chưa sẵn sàng
        console.error('Lỗi hiển thị thông báo:', error);
    }
}

/**
 * Hiển thị loading
 */
function showLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

/**
 * Ẩn loading
 */
function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
} 