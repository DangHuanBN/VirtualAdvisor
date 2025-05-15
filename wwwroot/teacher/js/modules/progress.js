/**
 * Module quản lý theo dõi tiến độ học tập
 */
const ProgressModule = (function() {
    // Lưu trữ dữ liệu
    const data = {
        subjects: [],
        coursesBySubject: {},
        studentsByCourse: {},
        selectedCourse: null,
        selectedStudent: null
    };

    /**
     * Khởi tạo module
     */
    function init() {
        console.log('Module theo dõi tiến độ học tập đã được khởi tạo');
        displayTeacherInfo();
        setupLogout();
        setupEventListeners();
        loadSubjects();
    }

    /**
     * Hiển thị tên giảng viên từ thông tin người dùng
     */
    function displayTeacherInfo() {
        try {
            // Kiểm tra xem có sẵn AuthAPI từ common.js hay không
            if (typeof AuthAPI !== 'undefined' && AuthAPI.getCurrentUser) {
                const user = AuthAPI.getCurrentUser();
                if (user) {
                    console.log("Thông tin người dùng:", user);
                    const teacherNameElement = document.getElementById('teacherName');
                    if (teacherNameElement) {
                        const displayName = user.fullName || user.username || 'Giáo viên';
                        teacherNameElement.textContent = displayName;
                        console.log("Tên giảng viên đã được cập nhật:", displayName);
                    }
                } else {
                    console.warn("Không tìm thấy thông tin người dùng");
                    setDefaultTeacherName();
                }
            } else {
                // Nếu không có AuthAPI, lấy thông tin từ localStorage trực tiếp
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    const teacherNameElement = document.getElementById('teacherName');
                    if (teacherNameElement && user.fullName) {
                        teacherNameElement.textContent = user.fullName;
                    } else {
                        setDefaultTeacherName();
                    }
                } else {
                    setDefaultTeacherName();
                }
            }
        } catch (error) {
            console.error("Lỗi khi hiển thị tên giảng viên:", error);
            setDefaultTeacherName();
        }
    }

    /**
     * Thiết lập tên giảng viên mặc định nếu không lấy được thông tin
     */
    function setDefaultTeacherName() {
        const teacherNameElement = document.getElementById('teacherName');
        if (teacherNameElement) {
            teacherNameElement.textContent = 'Giáo viên';
        }
    }

    /**
     * Thiết lập chức năng đăng xuất
     */
    function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Kiểm tra xem có AuthAPI không
                if (typeof AuthAPI !== 'undefined' && AuthAPI.logout) {
                    AuthAPI.logout();
                } else {
                    // Nếu không có AuthAPI, xử lý đăng xuất thủ công
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/main/login.html';
                }
            });
        }
    }

    /**
     * Thiết lập các sự kiện lắng nghe
     */
    function setupEventListeners() {
        // Lắng nghe sự kiện thay đổi môn học
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', function() {
                const subjectId = this.value;
                if (subjectId) {
                    loadCoursesBySubject(subjectId);
                } else {
                    resetCourseFilter();
                }
            });
        }

        // Lắng nghe sự kiện thay đổi khóa học từ dropdown
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.addEventListener('change', function() {
                const courseId = this.value;
                if (courseId) {
                    loadStudentsByCourse(courseId);
                }
            });
        }

        // Nút quay lại danh sách khóa học
        const backToCoursesBtn = document.getElementById('backToCourses');
        if (backToCoursesBtn) {
            backToCoursesBtn.addEventListener('click', function() {
                showCoursesList();
            });
        }

        // Nút quay lại danh sách sinh viên
        const backToStudentsBtn = document.getElementById('backToStudents');
        if (backToStudentsBtn) {
            backToStudentsBtn.addEventListener('click', function() {
                showStudentsList();
            });
        }

        // Tìm kiếm sinh viên
        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('input', function() {
                filterStudents(this.value);
            });
        }

        // Thiết lập các tab trong chi tiết tiến độ
        setupTabSwitching();
    }

    /**
     * Thiết lập chuyển đổi tab trong chi tiết tiến độ
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.progress-tabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Xóa active class từ tất cả tabs và tab contents
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Thêm active class vào tab và content được chọn
                this.classList.add('active');
                document.getElementById(tabId + 'Content').classList.add('active');
            });
        });
    }

    /**
     * Tải danh sách môn học từ API
     */
    function loadSubjects() {
        fetch('/api/progress/subjects')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách môn học');
                }
                return response.json();
            })
            .then(subjects => {
                data.subjects = subjects;
                populateSubjectFilter(subjects);
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách môn học:', error);
                showErrorMessage('Không thể tải danh sách môn học. Vui lòng thử lại sau.');
        });
    }

    /**
     * Điền dữ liệu môn học vào dropdown
     */
    function populateSubjectFilter(subjects) {
        const subjectFilter = document.getElementById('subjectFilter');
        if (!subjectFilter) return;

        // Giữ lại option mặc định
        const defaultOption = subjectFilter.querySelector('option');
        subjectFilter.innerHTML = '';
        subjectFilter.appendChild(defaultOption);

        // Thêm các môn học
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.subjectId;
            option.textContent = subject.subjectName;
            subjectFilter.appendChild(option);
        });
    }

    /**
     * Tải danh sách khóa học theo môn học
     */
    function loadCoursesBySubject(subjectId) {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;
        
        // Reset and disable course filter while loading
        resetCourseFilter();
        courseFilter.disabled = true;
        
        fetch(`/api/progress/courses-by-subject/${subjectId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách khóa học');
                }
                return response.json();
            })
            .then(courses => {
                // Store courses data
                data.coursesBySubject[subjectId] = courses;
                
                // Enable and populate course filter
                courseFilter.disabled = false;
                populateCourseFilter(courses);
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách khóa học:', error);
                showErrorMessage('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
                courseFilter.disabled = false;
            });
    }

    /**
     * Reset dropdown khóa học
     */
    function resetCourseFilter() {
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">-- Chọn khóa học --</option>';
            courseFilter.disabled = true;
        }
    }

    /**
     * Điền dữ liệu khóa học vào dropdown
     */
    function populateCourseFilter(courses) {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter) return;

        // Giữ lại option mặc định
        const defaultOption = courseFilter.querySelector('option');
        courseFilter.innerHTML = '';
        courseFilter.appendChild(defaultOption);

        // Thêm các khóa học
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.courseId;
            option.textContent = course.courseName;
            courseFilter.appendChild(option);
        });
    }

    /**
     * Tải danh sách sinh viên theo khóa học
     */
    function loadStudentsByCourse(courseId) {
        // Hiển thị loading
        const studentListBody = document.getElementById('studentListBody');
        if (studentListBody) {
            studentListBody.innerHTML = '<tr><td colspan="6" class="loading-data">Đang tải dữ liệu sinh viên...</td></tr>';
        }

        // Hiển thị container danh sách sinh viên
        showStudentsList();
        
        // Lưu khóa học đã chọn
        data.selectedCourse = courseId;
        
        // Cập nhật tiêu đề
        updateSelectedCourseTitle(courseId);
        
        fetch(`/api/progress/students-by-course/${courseId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách sinh viên');
                }
                return response.json();
            })
            .then(students => {
                // Lưu dữ liệu sinh viên
                data.studentsByCourse[courseId] = students;
                
                // Render danh sách sinh viên
                renderStudentsList(students);
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách sinh viên:', error);
                if (studentListBody) {
                    studentListBody.innerHTML = '<tr><td colspan="6" class="error-message">Lỗi khi tải dữ liệu sinh viên. Vui lòng thử lại sau.</td></tr>';
                }
            });
    }

    /**
     * Cập nhật tiêu đề khóa học đã chọn
     */
    function updateSelectedCourseTitle(courseId) {
        const selectedCourseTitle = document.getElementById('selectedCourseTitle');
        if (!selectedCourseTitle) return;
        
        // Tìm thông tin khóa học từ dữ liệu đã lưu
        let courseName = 'Khóa học không xác định';
        
        // Tìm trong tất cả các môn học
        for (const subjectId in data.coursesBySubject) {
            const courses = data.coursesBySubject[subjectId];
            const course = courses.find(c => c.courseId == courseId);
            if (course) {
                courseName = course.courseName;
                break;
            }
        }
        
        selectedCourseTitle.textContent = `Danh sách sinh viên - ${courseName}`;
    }

    /**
     * Hiển thị danh sách sinh viên
     */
    function renderStudentsList(students) {
        const studentListBody = document.getElementById('studentListBody');
        if (!studentListBody) return;
        
        if (!students || students.length === 0) {
            studentListBody.innerHTML = '<tr><td colspan="6" class="no-data">Không có sinh viên trong khóa học này</td></tr>';
                return;
            }

        // Xóa dữ liệu cũ
        studentListBody.innerHTML = '';
        
        // Thêm dữ liệu sinh viên
            students.forEach(student => {
            const row = document.createElement('tr');
            
            // Xác định các class màu sắc cho các thanh tiến độ
            const overallClass = getProgressColorClass(student.overallProgress);
            const attendanceClass = getProgressColorClass(student.attendanceProgress);
            const assignmentClass = getProgressColorClass(student.assignmentProgress);
            
            // Tạo các thuộc tính class, tránh lỗi khi class rỗng
            const overallClassAttr = overallClass ? ` ${overallClass}` : '';
            const attendanceClassAttr = attendanceClass ? ` ${attendanceClass}` : '';
            const assignmentClassAttr = assignmentClass ? ` ${assignmentClass}` : '';
            
            // Log để gỡ lỗi
            console.log(`Sinh viên: ${student.fullName}, Tiến độ: ${student.overallProgress}%, Class: ${overallClass}`);
            
            // Tạo các ô dữ liệu
            row.innerHTML = `
                <td>${student.userId}</td>
                <td>${student.fullName}</td>
                <td>
                    <div class="progress-pill">
                        <div class="progress-bar${overallClassAttr}" style="width: ${student.overallProgress}%"></div>
                        <span>${student.overallProgress}%</span>
                            </div>
                        </td>
                        <td>
                    <div class="progress-pill">
                        <div class="progress-bar${attendanceClassAttr}" style="width: ${student.attendanceProgress}%"></div>
                        <span>${student.attendanceProgress}%</span>
                            </div>
                        </td>
                        <td>
                    <div class="progress-pill">
                        <div class="progress-bar${assignmentClassAttr}" style="width: ${student.assignmentProgress}%"></div>
                        <span>${student.assignmentProgress}%</span>
                            </div>
                        </td>
                        <td>
                    <button class="view-progress-btn" data-student-id="${student.userId}">Xem chi tiết</button>
                        </td>
            `;
            
            // Thêm hàng vào bảng
            studentListBody.appendChild(row);
            
            // Thêm sự kiện lắng nghe cho nút xem chi tiết
            const viewBtn = row.querySelector('.view-progress-btn');
            viewBtn.addEventListener('click', function() {
                    const studentId = this.getAttribute('data-student-id');
                loadStudentProgressDetails(studentId);
            });
        });
    }

    /**
     * Lọc sinh viên theo từ khóa
     */
    function filterStudents(keyword) {
        if (!data.selectedCourse || !data.studentsByCourse[data.selectedCourse]) return;
        
        const students = data.studentsByCourse[data.selectedCourse];
        if (!students) return;
        
        if (!keyword) {
            // Nếu không có từ khóa, hiển thị tất cả
            renderStudentsList(students);
            return;
        }
        
        // Lọc sinh viên theo từ khóa (tên hoặc ID)
        const keywordLower = keyword.toLowerCase();
        const filteredStudents = students.filter(student => 
            student.fullName.toLowerCase().includes(keywordLower) || 
            student.userId.toString().includes(keywordLower)
        );
        
        renderStudentsList(filteredStudents);
    }

    /**
     * Tải chi tiết tiến độ học tập của sinh viên
     */
    function loadStudentProgressDetails(studentId) {
        // Hiển thị loading
        const progressTableBody = document.getElementById('progressTableBody');
        if (progressTableBody) {
            progressTableBody.innerHTML = '<tr><td colspan="4" class="loading-data">Đang tải dữ liệu tiến độ...</td></tr>';
        }

        // Hiển thị container chi tiết tiến độ
        showStudentProgress();
        
        // Lưu id sinh viên đã chọn
        data.selectedStudent = studentId;
        
        // Cập nhật tiêu đề
        updateSelectedStudentTitle(studentId);
        updateCourseNameInProgress();
        
        // Tải thông tin tiến độ tổng quát
        fetch(`/api/progress/student/${data.selectedCourse}/${studentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải thông tin tiến độ tổng quát');
                }
                return response.json();
            })
            .then(progressSummary => {
                // Cập nhật giao diện hiển thị tiến độ tổng quát
                updateProgressBar('overallProgress', progressSummary.overallProgress);
                updateProgressBar('attendanceProgress', progressSummary.attendanceProgress);
                updateProgressBar('assignmentProgress', progressSummary.assignmentProgress);
            })
            .catch(error => {
                console.error('Lỗi khi tải thông tin tiến độ tổng quát:', error);
            });

        // Tải chi tiết tiến độ theo từng bài giảng
        fetch(`/api/progress/details/${data.selectedCourse}/${studentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể tải chi tiết tiến độ');
                }
                return response.json();
            })
            .then(progressDetails => {
                renderStudentProgressDetails(progressDetails);
            })
            .catch(error => {
                console.error('Lỗi khi tải chi tiết tiến độ:', error);
                if (progressTableBody) {
                    progressTableBody.innerHTML = '<tr><td colspan="4" class="error-message">Lỗi khi tải dữ liệu tiến độ. Vui lòng thử lại sau.</td></tr>';
                }
            });
    }

    /**
     * Cập nhật thanh tiến độ và áp dụng màu sắc phù hợp
     */
    function updateProgressBar(elementId, progressValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Cập nhật giá trị phần trăm
        element.textContent = progressValue + '%';
        
        // Cập nhật thanh tiến độ
        const progressBar = element.parentElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = progressValue + '%';
            
            // Xóa các class màu sắc hiện có
            progressBar.classList.remove('progress-excellent', 'progress-good', 'progress-average', 'progress-poor');
            
            // Thêm class màu sắc phù hợp
            const colorClass = getProgressColorClass(progressValue);
            if (colorClass) { // Chỉ thêm class nếu không rỗng
                progressBar.classList.add(colorClass);
            }
        }
        
        // Log để gỡ lỗi
        console.log(`Cập nhật tiến độ ${elementId}: ${progressValue}%, class: ${getProgressColorClass(progressValue)}`);
    }

    /**
     * Cập nhật tiêu đề sinh viên đã chọn
     */
    function updateSelectedStudentTitle(studentId) {
        const selectedStudentTitle = document.getElementById('selectedStudentTitle');
        if (!selectedStudentTitle) return;
        
        // Tìm thông tin sinh viên từ dữ liệu đã lưu
        let studentName = 'Sinh viên không xác định';
        const students = data.studentsByCourse[data.selectedCourse];
        
        if (students) {
            const student = students.find(s => s.userId == studentId);
            if (student) {
                studentName = student.fullName;
            }
        }
        
        selectedStudentTitle.textContent = `Tiến độ học tập của sinh viên - ${studentName}`;
        
        // Cập nhật tên khóa học trong thông tin tổng quan
        updateCourseNameInProgress();
    }

    /**
     * Cập nhật tên khóa học trong thông tin tổng quan
     */
    function updateCourseNameInProgress() {
        const progressCourseName = document.getElementById('progressCourseName');
        if (!progressCourseName || !data.selectedCourse) return;
        
        // Tìm thông tin khóa học từ dữ liệu đã lưu
        let courseName = 'Khóa học không xác định';
        
        // Tìm trong tất cả các môn học
        for (const subjectId in data.coursesBySubject) {
            const courses = data.coursesBySubject[subjectId];
            const course = courses.find(c => c.courseId == data.selectedCourse);
            if (course) {
                courseName = course.courseName;
                break;
            }
        }
        
        progressCourseName.textContent = courseName;
    }

    /**
     * Render chi tiết tiến độ của sinh viên
     */
    function renderStudentProgressDetails(progressDetails) {
        const lessonsTableBody = document.getElementById('lessonsTableBody');
        if (!lessonsTableBody) return;
        
        if (!progressDetails || progressDetails.length === 0) {
            lessonsTableBody.innerHTML = '<tr><td colspan="4" class="no-data">Không có dữ liệu bài giảng cho khóa học này</td></tr>';
            return;
        }
        
        // Cập nhật thông tin tổng quan
        updateProgressOverview(progressDetails);
        
        // Render danh sách bài giảng
        let html = '';
        
        progressDetails.forEach(detail => {
            // Xác định class cho tiến độ
            const progressColorClass = getProgressColorClass(detail.progress);
            const progressClassAttr = progressColorClass ? ` ${progressColorClass}` : '';
            
                html += `
                    <tr>
                    <td>${detail.title}</td>
                    <td>${formatDate(detail.startDate)} - ${formatDate(detail.endDate)}</td>
                    <td>
                        <div class="progress-status ${detail.status === 'hoanthanh' ? 'completed' : 'in-progress'}">
                            ${getStatusText(detail.status)}
                        </div>
                    </td>
                    <td>
                        <div class="progress-percentage">${detail.progress.toFixed(1)}%</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar${progressClassAttr}" 
                                style="width: ${detail.progress}%"></div>
                        </div>
                    </td>
                    </tr>
                `;
            });
            
        lessonsTableBody.innerHTML = html;
    }

    /**
     * Cập nhật thông tin tổng quan về tiến độ
     */
    function updateProgressOverview(progressDetails) {
        if (!progressDetails || progressDetails.length === 0) return;
        
        // Phân loại các bài giảng dựa vào trường type
        const lectures = progressDetails.filter(detail => detail.type === 'baigiang');
        const exams = progressDetails.filter(detail => detail.type === 'baikiemtra' || detail.type === 'baithi');
        
        // Tính tiến độ cho bài giảng (hoàn thành khi đạt 80%)
        let lectureProgress = 0;
        if (lectures.length > 0) {
            const completedLectures = lectures.filter(detail => detail.progress >= 80).length;
            lectureProgress = (completedLectures / lectures.length) * 100;
        }
        
        // Tính tiến độ cho bài kiểm tra/bài thi (hoàn thành khi đạt 50%)
        let examProgress = 0;
        if (exams.length > 0) {
            const completedExams = exams.filter(detail => detail.progress >= 50).length;
            examProgress = (completedExams / exams.length) * 100;
        }
        
        // Tính tiến độ tổng thể
        const totalProgress = progressDetails.reduce((sum, detail) => sum + detail.progress, 0) / progressDetails.length;
        
        // Tính tiến độ tham gia (có ngày bắt đầu)
        const startedLectures = progressDetails.filter(detail => detail.startDate).length;
        const attendancePercentage = (startedLectures / progressDetails.length) * 100;
        
        console.log('Tiến độ bài giảng:', lectureProgress);
        console.log('Tiến độ bài kiểm tra/thi:', examProgress);
        console.log('Tiến độ tổng thể:', totalProgress);
        
        // Cập nhật giá trị vào giao diện
        updateProgressBar('overallProgress', totalProgress);
        updateProgressBar('attendanceProgress', attendancePercentage);
        
        // Tính tiến độ hoàn thành tổng hợp từ cả bài giảng và bài kiểm tra
        let completionPercentage = 0;
        if (lectures.length > 0 && exams.length > 0) {
            // Nếu có cả bài giảng và bài kiểm tra, tính trung bình có trọng số
            completionPercentage = (lectureProgress * 0.7) + (examProgress * 0.3);
        } else if (lectures.length > 0) {
            // Nếu chỉ có bài giảng
            completionPercentage = lectureProgress;
        } else if (exams.length > 0) {
            // Nếu chỉ có bài kiểm tra
            completionPercentage = examProgress;
        }
        
        updateProgressBar('assignmentProgress', completionPercentage);
    }

    /**
     * Cập nhật một phần tử tiến độ cụ thể
     */
    function updateProgressElement(baseId, value) {
        const progressValue = document.getElementById(`${baseId}Value`);
        const progressBar = document.getElementById(`${baseId}Bar`);
        
        if (progressValue) {
            progressValue.textContent = `${value.toFixed(1)}%`;
        }
        
        if (progressBar) {
            progressBar.style.width = `${value}%`;
            progressBar.className = `progress-bar-fill ${getProgressClass(value)}`;
        }
    }

    /**
     * Chuyển đổi trạng thái thành văn bản
     */
    function getStatusText(status) {
        switch (status) {
            case 'hoanthanh':
                return 'Hoàn thành';
            case 'chuahoanthanh':
                return 'Chưa hoàn thành';
            default:
                return 'Không xác định';
        }
    }

    /**
     * Định dạng ngày tháng
     */
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    /**
     * Lấy class CSS dựa trên giá trị tiến độ
     */
    function getProgressClass(progress) {
        if (progress >= 80) return 'excellent';
        if (progress >= 70) return 'good';
        if (progress >= 50) return 'average';
        return 'poor';
    }

    /**
     * Lấy class màu sắc dựa trên giá trị tiến độ
     */
    function getProgressColorClass(progress) {
        if (progress >= 80) return 'progress-excellent';
        if (progress >= 70) return 'progress-good';
        if (progress >= 50) return 'progress-average';
        if (progress > 0) return 'progress-poor';
        return ''; // Trả về chuỗi rỗng nếu progress = 0
    }

    /**
     * Hiển thị danh sách khóa học
     */
    function showCoursesList() {
        document.getElementById('courseListContainer').style.display = 'block';
        document.getElementById('studentListContainer').style.display = 'none';
        document.getElementById('studentProgressContainer').style.display = 'none';
    }

    /**
     * Hiển thị danh sách sinh viên
     */
    function showStudentsList() {
        document.getElementById('courseListContainer').style.display = 'none';
        document.getElementById('studentListContainer').style.display = 'block';
        document.getElementById('studentProgressContainer').style.display = 'none';
    }

    /**
     * Hiển thị chi tiết tiến độ của sinh viên
     */
    function showStudentProgress() {
        document.getElementById('courseListContainer').style.display = 'none';
        document.getElementById('studentListContainer').style.display = 'none';
        document.getElementById('studentProgressContainer').style.display = 'block';
    }

    /**
     * Hiển thị thông báo lỗi
     */
    function showErrorMessage(message) {
        // Implement error notification if needed
        console.error(message);
    }

    // API công khai của module
    return {
        init: init
    };
})();

// Khởi tạo module khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    ProgressModule.init();
}); 