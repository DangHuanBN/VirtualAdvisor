/**
 * Module quản lý chức năng đánh giá sinh viên
 * cho giáo viên
 */

const EvaluationModule = (function() {
    // Dữ liệu mẫu cho đánh giá sinh viên
    const sampleEvaluations = [
        {
            id: 'ev001',
            subject: 'Lập trình hướng đối tượng',
            subjectId: 1,
            course: 'Khóa học OOP nâng cao',
            courseId: 1,
            student: 'Nguyễn Văn A',
            studentId: 3,
            tracking_id: 101,
            progress: 85.5,
            status: 'hoanthanh',
            type: 'Giữa kỳ',
            typeId: 'midterm',
            score: 8.5,
            rating: 4,
            comments: 'Sinh viên nắm vững kiến thức cơ bản, cần cải thiện kỹ năng thực hành.',
            startDate: '2025-08-15',
            endDate: '2025-10-30',
            date: '30/10/2025'
        },
        {
            id: 'ev002',
            subject: 'Cơ sở dữ liệu',
            subjectId: 2,
            course: 'SQL cơ bản và nâng cao',
            courseId: 3,
            student: 'Lê Thị B',
            studentId: 4,
            tracking_id: 102,
            progress: 70.0,
            status: 'chuahoanthanh',
            type: 'Bài tập về nhà',
            typeId: 'assignment',
            score: 7.0,
            rating: 3,
            comments: 'Hoàn thành tốt bài tập, cần cải thiện phần normalization.',
            startDate: '2025-08-20',
            endDate: null,
            date: '28/10/2025'
        },
        {
            id: 'ev003',
            subject: 'Lập trình Web',
            subjectId: 3,
            course: 'Web Development với HTML, CSS và JavaScript',
            courseId: 5,
            student: 'Trần Văn C',
            studentId: 5,
            tracking_id: 103,
            progress: 90.0,
            status: 'hoanthanh',
            type: 'Dự án',
            typeId: 'project',
            score: 9.0,
            rating: 5,
            comments: 'Dự án hoàn thiện, code sạch, giao diện đẹp. Khả năng làm việc nhóm tốt.',
            startDate: '2025-08-10',
            endDate: '2025-10-25',
            date: '25/10/2025'
        },
        {
            id: 'ev004',
            subject: 'Lập trình hướng đối tượng',
            subjectId: 1,
            course: 'Khóa học OOP nâng cao',
            courseId: 1,
            student: 'Phạm Thị D',
            studentId: 6,
            tracking_id: 104,
            progress: 65.0,
            status: 'chuahoanthanh',
            type: 'Kiểm tra nhanh',
            typeId: 'quiz',
            score: 6.5,
            rating: 3,
            comments: 'Cần cải thiện hiểu biết về tính đa hình và kế thừa.',
            startDate: '2025-09-01',
            endDate: null,
            date: '22/10/2025'
        },
        {
            id: 'ev005',
            subject: 'Cơ sở dữ liệu',
            subjectId: 2,
            course: 'SQL cơ bản và nâng cao',
            courseId: 3,
            student: 'Nguyễn Văn A',
            studentId: 3,
            tracking_id: 105,
            progress: 75.0,
            status: 'hoanthanh',
            type: 'Cuối kỳ',
            typeId: 'final',
            score: 7.5,
            rating: 4,
            comments: 'Hiểu tốt kiến thức cơ bản, cần cải thiện phần truy vấn nâng cao.',
            startDate: '2025-08-05',
            endDate: '2025-10-20',
            date: '20/10/2025'
        },
    ];

    // Cài đặt ban đầu
    function init() {
        console.log('Khởi tạo module đánh giá sinh viên');
        bindEventListeners();
        setupTabSwitching();
        
        // Hiển thị dữ liệu đánh giá
        loadEvaluations();
        
        // Thiết lập các hiệu ứng UI
        setupDynamicSelects();
    }

    /**
     * Gắn các sự kiện với element tương ứng
     */
    function bindEventListeners() {
        // Xử lý form đánh giá
        const evaluationForm = document.getElementById('studentEvaluationForm');
        if (evaluationForm) {
            evaluationForm.addEventListener('submit', handleFormSubmit);
        }

        // Xử lý nút xem chi tiết
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', handleViewEvaluation);
        });

        // Xử lý nút chỉnh sửa
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', handleEditEvaluation);
        });

        // Xử lý bộ lọc lịch sử đánh giá
        const filterSelects = document.querySelectorAll('.history-filters select');
        filterSelects.forEach(select => {
            select.addEventListener('change', filterEvaluations);
        });

        // Xử lý phân trang
        setupPagination();
    }

    /**
     * Thiết lập chuyển đổi tab
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Xóa class active từ tất cả các tab và nội dung
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Thêm class active vào tab và nội dung hiện tại
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    /**
     * Xử lý khi submit form đánh giá
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Thu thập dữ liệu từ form
        const formData = new FormData(e.target);
        const trackingId = Math.floor(Math.random() * 900) + 100; // Tạo tracking ID ngẫu nhiên
        const startDate = formData.get('startDate') || new Date().toISOString().split('T')[0];
        
        const evaluationData = {
            id: 'ev' + (Math.floor(Math.random() * 900) + 100), // Tạo ID ngẫu nhiên
            subject: document.getElementById('subject').options[document.getElementById('subject').selectedIndex].text,
            subjectId: parseInt(formData.get('subject')),
            course: document.getElementById('course').options[document.getElementById('course').selectedIndex].text,
            courseId: parseInt(formData.get('course')),
            student: document.getElementById('student').options[document.getElementById('student').selectedIndex].text,
            studentId: parseInt(formData.get('student')),
            tracking_id: trackingId, // StudyTracking ID
            progress: parseFloat(formData.get('progress') || 0),
            status: formData.get('status') || 'chuahoanthanh',
            type: document.getElementById('evaluationType').options[document.getElementById('evaluationType').selectedIndex].text,
            typeId: formData.get('evaluationType'),
            score: parseFloat(formData.get('score')),
            rating: parseInt(formData.get('rating')),
            comments: formData.get('comments'),
            startDate: startDate,
            endDate: formData.get('status') === 'hoanthanh' ? new Date().toISOString().split('T')[0] : null,
            date: new Date().toLocaleDateString('vi-VN')
        };

        console.log('Đánh giá mới:', evaluationData);
        
        // Thêm vào danh sách đánh giá (trong ứng dụng thực tế sẽ gửi đến server)
        sampleEvaluations.unshift(evaluationData);
        
        // Hiển thị thông báo thành công
        showNotification('Đánh giá tiến độ học tập đã được lưu thành công!', 'success');
        
        // Reset form
        e.target.reset();
        
        // Cập nhật lại danh sách đánh giá
        loadEvaluations();
    }

    /**
     * Hiển thị thông báo
     */
    function showNotification(message, type = 'info') {
        // Sử dụng hàm showNotification từ module chính
        if (typeof TeacherApp !== 'undefined' && TeacherApp.showNotification) {
            TeacherApp.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Xử lý khi nhấn nút xem chi tiết đánh giá
     */
    function handleViewEvaluation(e) {
        const evaluationId = e.currentTarget.getAttribute('data-id');
        const evaluation = sampleEvaluations.find(ev => ev.id === evaluationId);
        
        if (!evaluation) {
            showNotification('Không tìm thấy thông tin đánh giá', 'error');
            return;
        }

        // Tạo và hiển thị modal chi tiết
        showEvaluationDetailModal(evaluation);
    }

    /**
     * Hiển thị modal chi tiết đánh giá
     */
    function showEvaluationDetailModal(evaluation) {
        // Kiểm tra xem modal đã tồn tại chưa
        let modal = document.getElementById('evaluationDetailModal');
        
        if (!modal) {
            // Tạo modal mới nếu chưa tồn tại
            modal = document.createElement('div');
            modal.id = 'evaluationDetailModal';
            modal.className = 'modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Chi tiết đánh giá</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="evaluation-details">
                            <div class="detail-row">
                                <div class="detail-label">StudyTracking ID:</div>
                                <div class="detail-value" id="detail-tracking-id"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Môn học:</div>
                                <div class="detail-value" id="detail-subject"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Khóa học:</div>
                                <div class="detail-value" id="detail-course"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Sinh viên:</div>
                                <div class="detail-value" id="detail-student"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Loại đánh giá:</div>
                                <div class="detail-value" id="detail-type"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Điểm số:</div>
                                <div class="detail-value" id="detail-score"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Tiến độ học tập:</div>
                                <div class="detail-value" id="detail-progress">
                                    <span id="detail-progress-value"></span>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" id="detail-progress-bar"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Trạng thái:</div>
                                <div class="detail-value" id="detail-status"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Thời gian học tập:</div>
                                <div class="detail-value" id="detail-study-period"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Đánh giá chất lượng:</div>
                                <div class="detail-value" id="detail-rating"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Ngày đánh giá:</div>
                                <div class="detail-value" id="detail-date"></div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Nhận xét:</div>
                                <div class="detail-value" id="detail-comments"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Xử lý đóng modal
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // Đóng modal khi click bên ngoài
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Cập nhật thông tin đánh giá vào modal
        modal.querySelector('#detail-tracking-id').textContent = evaluation.tracking_id;
        modal.querySelector('#detail-subject').textContent = evaluation.subject;
        modal.querySelector('#detail-course').textContent = evaluation.course;
        modal.querySelector('#detail-student').textContent = evaluation.student;
        modal.querySelector('#detail-type').textContent = evaluation.type;
        modal.querySelector('#detail-score').textContent = evaluation.score;
        
        // Cập nhật tiến độ với thanh tiến độ
        modal.querySelector('#detail-progress-value').textContent = `${evaluation.progress}%`;
        modal.querySelector('#detail-progress-bar').style.width = `${evaluation.progress}%`;
        
        // Cập nhật trạng thái
        modal.querySelector('#detail-status').textContent = evaluation.status === 'hoanthanh' ? 'Hoàn thành' : 'Chưa hoàn thành';
        modal.querySelector('#detail-status').className = evaluation.status === 'hoanthanh' ? 'status-complete' : 'status-incomplete';
        
        // Hiển thị thời gian học tập
        let studyPeriodText = 'Chưa bắt đầu';
        if (evaluation.startDate) {
            studyPeriodText = `Bắt đầu: ${evaluation.startDate}`;
            if (evaluation.endDate) {
                studyPeriodText += ` - Kết thúc: ${evaluation.endDate}`;
            }
        }
        modal.querySelector('#detail-study-period').textContent = studyPeriodText;
        
        // Hiển thị rating bằng sao
        const ratingHtml = Array(5)
            .fill()
            .map((_, i) => {
                return i < evaluation.rating
                    ? '<i class="fas fa-star" style="color: #FFD700;"></i>'
                    : '<i class="far fa-star"></i>';
            })
            .join('');
        modal.querySelector('#detail-rating').innerHTML = ratingHtml;
        
        modal.querySelector('#detail-date').textContent = evaluation.date;
        modal.querySelector('#detail-comments').textContent = evaluation.comments || 'Không có nhận xét';
        
        // Hiển thị modal
        modal.style.display = 'block';
    }

    /**
     * Xử lý khi nhấn nút chỉnh sửa đánh giá
     */
    function handleEditEvaluation(e) {
        const evaluationId = e.currentTarget.getAttribute('data-id');
        const evaluation = sampleEvaluations.find(ev => ev.id === evaluationId);
        
        if (!evaluation) {
            showNotification('Không tìm thấy thông tin đánh giá', 'error');
            return;
        }

        // Chuyển đến tab đánh giá mới
        document.querySelector('.tab[data-tab="new-evaluation"]').click();
        
        // Điền thông tin vào form
        document.getElementById('subject').value = evaluation.subjectId;
        document.getElementById('course').value = evaluation.courseId;
        document.getElementById('student').value = evaluation.studentId;
        document.getElementById('evaluationType').value = evaluation.typeId;
        document.getElementById('score').value = evaluation.score;
        document.getElementById('progress').value = evaluation.progress;
        document.getElementById('status').value = evaluation.status;
        
        // Hiển thị tracking ID
        const trackingIdInput = document.getElementById('trackingId');
        if (trackingIdInput) {
            trackingIdInput.value = evaluation.tracking_id;
            // Thêm text để thể hiện đây là bản ghi đã tồn tại
            trackingIdInput.placeholder = "StudyTracking ID đã liên kết";
        }
        
        // Hiển thị startDate nếu có
        const startDateInput = document.getElementById('startDate');
        if (startDateInput && evaluation.startDate) {
            startDateInput.value = evaluation.startDate;
        }
        
        // Chọn rating
        document.querySelector(`input[name="rating"][value="${evaluation.rating}"]`).checked = true;
        
        document.getElementById('comments').value = evaluation.comments;
        
        // Thay đổi nút submit thành cập nhật
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Cập nhật đánh giá';
        submitBtn.setAttribute('data-edit-id', evaluationId);
        
        // Thay đổi hành vi form submit để cập nhật thay vì tạo mới
        const form = document.getElementById('studentEvaluationForm');
        form.removeEventListener('submit', handleFormSubmit);
        form.addEventListener('submit', handleUpdateEvaluation);
    }

    /**
     * Xử lý khi cập nhật đánh giá
     */
    function handleUpdateEvaluation(e) {
        e.preventDefault();
        
        const evaluationId = document.querySelector('.submit-btn').getAttribute('data-edit-id');
        const evaluationIndex = sampleEvaluations.findIndex(ev => ev.id === evaluationId);
        
        if (evaluationIndex === -1) {
            showNotification('Không tìm thấy thông tin đánh giá để cập nhật', 'error');
            return;
        }
        
        // Thu thập dữ liệu từ form
        const formData = new FormData(e.target);
        const startDate = formData.get('startDate') || sampleEvaluations[evaluationIndex].startDate || null;
        const status = formData.get('status') || sampleEvaluations[evaluationIndex].status;
        
        // Chỉ cập nhật endDate nếu trạng thái là hoàn thành và trước đó chưa hoàn thành
        let endDate = sampleEvaluations[evaluationIndex].endDate;
        if (status === 'hoanthanh' && sampleEvaluations[evaluationIndex].status !== 'hoanthanh') {
            endDate = new Date().toISOString().split('T')[0];
        } else if (status !== 'hoanthanh') {
            endDate = null;
        }
        
        const updatedData = {
            id: evaluationId,
            subject: document.getElementById('subject').options[document.getElementById('subject').selectedIndex].text,
            subjectId: parseInt(formData.get('subject')),
            course: document.getElementById('course').options[document.getElementById('course').selectedIndex].text,
            courseId: parseInt(formData.get('course')),
            student: document.getElementById('student').options[document.getElementById('student').selectedIndex].text,
            studentId: parseInt(formData.get('student')),
            tracking_id: sampleEvaluations[evaluationIndex].tracking_id,
            progress: parseFloat(formData.get('progress') || sampleEvaluations[evaluationIndex].progress),
            status: status,
            type: document.getElementById('evaluationType').options[document.getElementById('evaluationType').selectedIndex].text,
            typeId: formData.get('evaluationType'),
            score: parseFloat(formData.get('score')),
            rating: parseInt(formData.get('rating')),
            comments: formData.get('comments'),
            startDate: startDate,
            endDate: endDate,
            date: sampleEvaluations[evaluationIndex].date
        };
        
        // Cập nhật đánh giá
        sampleEvaluations[evaluationIndex] = updatedData;
        
        // Hiển thị thông báo thành công
        showNotification('Cập nhật đánh giá thành công!', 'success');
        
        // Reset form và hành vi submit
        e.target.reset();
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Lưu đánh giá';
        submitBtn.removeAttribute('data-edit-id');
        
        // Khôi phục hành vi form submit
        e.target.removeEventListener('submit', handleUpdateEvaluation);
        e.target.addEventListener('submit', handleFormSubmit);
        
        // Cập nhật lại danh sách đánh giá
        loadEvaluations();
        
        // Chuyển sang tab lịch sử đánh giá
        document.querySelector('.tab[data-tab="evaluation-history"]').click();
    }

    /**
     * Lọc đánh giá theo các tiêu chí
     */
    function filterEvaluations() {
        const subjectFilter = document.getElementById('historySubject').value;
        const courseFilter = document.getElementById('historyCourse').value;
        const studentFilter = document.getElementById('historyStudent').value;
        const typeFilter = document.getElementById('historyType').value;
        const statusFilter = document.getElementById('historyStatus').value;
        
        // Lọc dữ liệu
        const filteredData = sampleEvaluations.filter(evaluation => {
            return (!subjectFilter || evaluation.subjectId == subjectFilter) &&
                   (!courseFilter || evaluation.courseId == courseFilter) &&
                   (!studentFilter || evaluation.studentId == studentFilter) &&
                   (!typeFilter || evaluation.typeId === typeFilter) &&
                   (!statusFilter || evaluation.status === statusFilter);
        });
        
        // Hiển thị dữ liệu đã lọc
        renderEvaluationTable(filteredData);
    }

    /**
     * Hiển thị dữ liệu đánh giá
     */
    function loadEvaluations() {
        renderEvaluationTable(sampleEvaluations);
    }

    /**
     * Hiển thị bảng đánh giá với dữ liệu cung cấp
     */
    function renderEvaluationTable(evaluations) {
        const tableBody = document.querySelector('#evaluation-history table tbody');
        if (!tableBody) return;
        
        // Xóa dữ liệu cũ
        tableBody.innerHTML = '';
        
        if (evaluations.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="10" class="text-center">Không có dữ liệu đánh giá nào.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // Hiển thị dữ liệu mới
        evaluations.forEach((evaluation, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${evaluation.subject}</td>
                <td>${evaluation.course}</td>
                <td>${evaluation.student}</td>
                <td>${evaluation.type}</td>
                <td>${evaluation.score}</td>
                <td>
                    <div class="progress-wrapper">
                        <span>${evaluation.progress}%</span>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${evaluation.progress}%"></div>
                        </div>
                    </div>
                </td>
                <td>${evaluation.status === 'hoanthanh' ? '<span class="status-complete">Hoàn thành</span>' : '<span class="status-incomplete">Chưa hoàn thành</span>'}</td>
                <td>${evaluation.date}</td>
                <td class="action-cell">
                    <button class="action-btn view-btn" title="Xem chi tiết" data-id="${evaluation.id}"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit-btn" title="Chỉnh sửa" data-id="${evaluation.id}"><i class="fas fa-edit"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Cập nhật lại sự kiện cho các nút
        tableBody.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', handleViewEvaluation);
        });
        
        tableBody.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditEvaluation);
        });
    }

    /**
     * Thiết lập phân trang
     */
    function setupPagination() {
        const prevBtn = document.querySelector('.page-btn.prev');
        const nextBtn = document.querySelector('.page-btn.next');
        const pageButtons = document.querySelectorAll('.page-btn:not(.prev):not(.next)');
        
        if (!prevBtn || !nextBtn) return;
        
        // Xử lý nút trang trước
        prevBtn.addEventListener('click', () => {
            const activePage = document.querySelector('.page-btn.active:not(.prev):not(.next)');
            if (activePage && activePage.previousElementSibling && !activePage.previousElementSibling.classList.contains('prev')) {
                activePage.previousElementSibling.click();
            }
        });
        
        // Xử lý nút trang sau
        nextBtn.addEventListener('click', () => {
            const activePage = document.querySelector('.page-btn.active:not(.prev):not(.next)');
            if (activePage && activePage.nextElementSibling && !activePage.nextElementSibling.classList.contains('next')) {
                activePage.nextElementSibling.click();
            }
        });
        
        // Xử lý các nút số trang
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                pageButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Mô phỏng việc tải dữ liệu trang mới (trong thực tế sẽ tải từ server)
                const pageNum = parseInt(button.textContent);
                const pageSize = 5;
                const start = (pageNum - 1) * pageSize;
                const end = start + pageSize;
                const pagedData = sampleEvaluations.slice(start, end);
                
                renderEvaluationTable(pagedData);
            });
        });
    }

    /**
     * Thiết lập select động (khi chọn môn học sẽ lọc khóa học theo môn học)
     */
    function setupDynamicSelects() {
        const subjectSelect = document.getElementById('subject');
        const courseSelect = document.getElementById('course');
        
        if (subjectSelect && courseSelect) {
            subjectSelect.addEventListener('change', () => {
                // Mô phỏng việc lọc khóa học theo môn học
                // Trong ứng dụng thực tế, sẽ gửi request đến server để lấy danh sách khóa học
                const subjectId = subjectSelect.value;
                if (!subjectId) {
                    // Nếu không chọn môn học, hiển thị tất cả khóa học
                    Array.from(courseSelect.options).forEach(option => {
                        option.style.display = option.value ? 'block' : 'block';
                    });
                    return;
                }
                
                // Mô phỏng lọc khóa học theo môn học
                const coursesBySubject = {
                    '1': ['1', '2'], // Môn học OOP có các khóa học 1 và 2
                    '2': ['3', '4'], // Môn học CSDL có các khóa học 3 và 4
                    '3': ['5']       // Môn học Web có khóa học 5
                };
                
                const availableCourses = coursesBySubject[subjectId] || [];
                
                // Ẩn/hiện các option tương ứng
                Array.from(courseSelect.options).forEach(option => {
                    if (!option.value) return; // Bỏ qua option trống (placeholder)
                    option.style.display = availableCourses.includes(option.value) ? 'block' : 'none';
                });
                
                // Reset giá trị course select
                courseSelect.value = '';
            });
            
            courseSelect.addEventListener('change', () => {
                // Mô phỏng việc lọc sinh viên theo khóa học
                // Trong ứng dụng thực tế, sẽ gửi request đến server để lấy danh sách sinh viên đã đăng ký khóa học
                const studentSelect = document.getElementById('student');
                const courseId = courseSelect.value;
                
                if (!courseId || !studentSelect) return;
                
                // Ở đây có thể thêm logic lọc sinh viên theo khóa học
                // ...
            });
        }
    }

    // Tiết lộ các phương thức công khai
    return {
        init: init
    };
})();

// Khởi tạo module khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EvaluationModule.init);
} else {
    EvaluationModule.init();
} 