/**
 * Module xử lý bài kiểm tra/bài thi
 */

/**
 * Tải dữ liệu bài kiểm tra từ server
 * @param {number} lectureId - ID của bài giảng dạng bài kiểm tra
 * @returns {Promise<Object>} - Dữ liệu bài kiểm tra
 */
async function loadQuizData(lectureId) {
    try {
        const response = await fetch(`/api/quiz/${lectureId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi API (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        
        // Log dữ liệu thời gian nhận được
        console.log('DEBUG - Raw data từ server:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Không thể tải dữ liệu bài kiểm tra');
        }
        
        // Đảm bảo timeLimit được truyền về đúng cách từ response
        const quizData = { 
            ...result.data,
            timeLimit: result.timeLimit,
            lectureInfo: result.lectureInfo
        };
        
        console.log('DEBUG - Dữ liệu sau khi xử lý:', quizData);
        
        return quizData;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bài kiểm tra:', error);
        throw error;
    }
}

/**
 * Tạo form làm bài kiểm tra từ dữ liệu JSON
 * @param {Object} quizData - Dữ liệu bài kiểm tra
 * @param {HTMLElement} container - Container để hiển thị form
 * @param {boolean} isRetaking - Đánh dấu đang làm lại bài
 */
function renderQuizForm(quizData, container, isRetaking = false) {
    // Xóa nội dung hiện tại
    container.innerHTML = '';
    
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        container.innerHTML = '<div class="error-message">Không có câu hỏi nào trong bài kiểm tra này</div>';
        return;
    }
    
    // Tạo form
    const quizForm = document.createElement('div');
    quizForm.className = 'quiz-form';
    quizForm.innerHTML = `
        <div class="quiz-header">
            <h2>Bài kiểm tra</h2>
            <p class="quiz-instructions">Vui lòng chọn đáp án đúng cho mỗi câu hỏi.</p>
            <div class="quiz-meta">
                <span>Tổng số câu hỏi: ${quizData.questions.length}</span>
            </div>
        </div>
        <div class="quiz-questions"></div>
        <div class="quiz-actions">
            <button id="submitQuiz" class="submit-quiz-btn" disabled>Nộp bài</button>
        </div>
    `;
    
    container.appendChild(quizForm);
    
    const questionsContainer = quizForm.querySelector('.quiz-questions');
    
    // Render từng câu hỏi
    quizData.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'quiz-question';
        questionElement.dataset.questionIndex = index;
        
        // Tạo HTML cho câu hỏi
        let optionsHtml = '';
        for (const [key, value] of Object.entries(question.options)) {
            optionsHtml += `
                <div class="quiz-option">
                    <input type="radio" id="q${index}_${key}" name="question${index}" value="${key}" data-question-index="${index}">
                    <label for="q${index}_${key}">${key}. ${value}</label>
                </div>
            `;
        }
        
        questionElement.innerHTML = `
            <div class="question-header">
                <h3>Câu ${index + 1}</h3>
                <div class="question-status" id="status_${index}"></div>
            </div>
            <div class="question-content">
                <p>${question.question}</p>
                <div class="question-options">
                    ${optionsHtml}
                </div>
            </div>
        `;
        
        questionsContainer.appendChild(questionElement);
    });
    
    // Thêm CSS để cho phép click vào toàn bộ khu vực đáp án
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .quiz-option {
            display: block;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .quiz-option:hover {
            background-color: #f5f5f5;
            border-color: #ccc;
        }
        
        .quiz-option input[type="radio"] {
            margin-right: 10px;
            vertical-align: middle;
        }
        
        .quiz-option label {
            cursor: pointer;
            display: inline-block;
            width: calc(100% - 30px);
            vertical-align: middle;
        }
    `;
    document.head.appendChild(styleEl);
    
    // Theo dõi các câu đã trả lời
    setupQuizEventListeners(quizForm, quizData.questions.length, isRetaking);
}

/**
 * Cài đặt các event listener cho form bài kiểm tra
 * @param {HTMLElement} quizForm - Form bài kiểm tra
 * @param {number} totalQuestions - Tổng số câu hỏi
 * @param {boolean} isRetaking - Đánh dấu đang làm lại bài
 */
function setupQuizEventListeners(quizForm, totalQuestions, isRetaking) {
    const submitBtn = quizForm.querySelector('#submitQuiz');
    const radioInputs = quizForm.querySelectorAll('input[type="radio"]');
    const optionDivs = quizForm.querySelectorAll('.quiz-option');
    
    // Mảng theo dõi câu trả lời
    const answeredQuestions = new Set();
    
    // Sự kiện khi chọn đáp án bằng radio
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            const questionIndex = parseInt(this.dataset.questionIndex);
            answeredQuestions.add(questionIndex);
            
            // Kích hoạt nút nộp bài nếu đã trả lời tất cả câu hỏi
            submitBtn.disabled = (answeredQuestions.size < totalQuestions);
        });
    });
    
    // Thêm sự kiện click cho toàn bộ ô đáp án
    optionDivs.forEach(option => {
        option.addEventListener('click', function(e) {
            // Ngăn chặn xử lý nếu đã click trực tiếp vào radio button 
            // hoặc nếu click vào chính radio button để tránh xử lý kép
            if (e.target.type === 'radio') {
                return;
            }
            
            // Tìm radio button trong ô đáp án này
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                // Kiểm tra radio nếu chưa được chọn
                if (!radio.checked) {
                    radio.checked = true;
                    
                    // Kích hoạt sự kiện change thủ công
                    const event = new Event('change');
                    radio.dispatchEvent(event);
                }
            }
        });
    });
    
    // Nếu đang làm lại, thêm thông báo
    if (isRetaking) {
        const retakingInfo = document.createElement('div');
        retakingInfo.className = 'retaking-info';
        retakingInfo.innerHTML = '<div class="retaking-badge">Đang làm lại - Kết quả không được tính điểm</div>';
        quizForm.querySelector('.quiz-header').appendChild(retakingInfo);
        
        // Thêm CSS cho badge
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .retaking-badge {
                display: inline-block;
                background-color: #f39c12;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 600;
                margin-top: 10px;
            }
            
            .retaking-info {
                margin-top: 5px;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Sự kiện nộp bài
    submitBtn.addEventListener('click', async function() {
        if (answeredQuestions.size < totalQuestions) {
            alert('Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài!');
            return;
        }
        
        // Hiển thị xác nhận
        if (!confirm('Bạn có chắc chắn muốn nộp bài?')) {
            return;
        }
        
        // Vô hiệu hóa nút nộp bài và các input
        submitBtn.disabled = true;
        radioInputs.forEach(input => input.disabled = true);
        
        try {
            // Thu thập câu trả lời
            const answers = [];
            const lectureId = parseInt(quizForm.closest('.quiz-container').dataset.lectureId);
            const userId = getCurrentUserId();
            
            radioInputs.forEach(input => {
                if (input.checked) {
                    const questionIndex = parseInt(input.dataset.questionIndex);
                    answers.push({
                        questionIndex: questionIndex,
                        answer: input.value
                    });
                }
            });
            
            // Gửi câu trả lời lên server cùng với trạng thái làm lại
            const result = await submitQuizAnswers(userId, lectureId, answers, isRetaking);
            
            // Hiển thị kết quả
            displayQuizResults(result, quizForm, isRetaking);
            
        } catch (error) {
            console.error('Lỗi khi nộp bài:', error);
            alert(`Lỗi khi nộp bài: ${error.message}`);
            
            // Bật lại nút nộp bài và các input
            submitBtn.disabled = false;
            radioInputs.forEach(input => input.disabled = false);
        }
    });
}

/**
 * Gửi câu trả lời lên server
 * @param {number} userId - ID người dùng
 * @param {number} lectureId - ID bài giảng
 * @param {Array} answers - Mảng câu trả lời
 * @param {boolean} isRetaking - Đánh dấu đang làm lại bài
 * @returns {Promise<Object>} - Kết quả bài kiểm tra
 */
async function submitQuizAnswers(userId, lectureId, answers, isRetaking) {
    try {
        // Dừng đồng hồ đếm thời gian
        if (typeof window.stopTimer === 'function') {
            window.stopTimer();
        }
        
        // Tìm nút submit và thay đổi nó thành trạng thái loading
        const submitBtn = document.querySelector('#submitQuiz');
        let originalText = ''; // Khai báo biến với scope rộng hơn
        
        if (submitBtn) {
            originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<div class="submit-loading-state"><div class="loading-spinner"></div>Đang xử lý...</div>`;
        }
        
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                lectureId: lectureId,
                answers: answers,
                isRetaking: isRetaking || false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            // Khôi phục nút nếu có lỗi
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            throw new Error(`Lỗi API (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            // Khôi phục nút nếu có lỗi
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            throw new Error(result.message || 'Không thể nộp bài kiểm tra');
        }
        
        // Gọi API tạo cảnh báo học tập sau khi nộp bài thành công
        try {
            console.log('Đang tạo cảnh báo học tập tự động...');
            const alertResponse = await fetch('/api/quiz/testalert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    lectureId: lectureId,
                    progress: result.data.progress,
                    isRetaking: isRetaking || false
                })
            });
            
            if (alertResponse.ok) {
                const alertResult = await alertResponse.json();
                console.log('Kết quả tạo cảnh báo học tập:', alertResult);
                
                // Hiển thị cảnh báo học tập nếu có
                if (alertResult.success && alertResult.data && alertResult.data.alert) {
                    setTimeout(() => {
                        displayLearningAlert(alertResult.data.alert);
                    }, 1000); // Hiển thị sau khi đã hiển thị kết quả
                }
            } else {
                console.warn('Không thể tạo cảnh báo học tập:', await alertResponse.text());
            }
        } catch (alertError) {
            console.error('Lỗi khi tạo cảnh báo học tập:', alertError);
            // Không ảnh hưởng đến luồng chính, chỉ ghi log lỗi
        }
        
        // Tính điểm thang 10
        const progress = result.data.progress;
        const score = progress / 10.0;
        console.log(`Điểm số: ${score.toFixed(2)}/10 (từ progress=${progress}%)`);
        
        return result.data;
    } catch (error) {
        console.error('Lỗi khi nộp bài kiểm tra:', error);
        throw error;
    }
}

/**
 * Hiển thị kết quả bài kiểm tra
 * @param {Object} result - Kết quả bài kiểm tra
 * @param {HTMLElement} quizForm - Form bài kiểm tra
 * @param {boolean} isRetaking - Đánh dấu đang làm lại bài
 */
function displayQuizResults(result, quizForm, isRetaking) {
    // Thay thế nút nộp bài bằng các nút khác
    const actionsContainer = quizForm.querySelector('.quiz-actions');
    
    // Hiển thị khác nhau nếu làm lại
    let headerHtml = '';
    if (isRetaking) {
        headerHtml = `<div class="retaking-result-header">Kết quả làm lại - Không được tính điểm!</div>`;
    }
    
    actionsContainer.innerHTML = `
        ${headerHtml}
        <div class="quiz-results-summary">
            <div class="result-item">
                <span class="result-label">Số câu đúng:</span>
                <span class="result-value">${result.correctAnswers}/${result.totalQuestions}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Điểm số:</span>
                <span class="result-value">${result.score.toFixed(2)}/10</span>
            </div>
            <div class="result-item">
                <span class="result-label">Tiến độ:</span>
                <span class="result-value">${result.progress.toFixed(2)}%</span>
            </div>
        </div>
        <button id="reviewQuiz" class="review-quiz-btn">Xem lại bài làm</button>
    `;
    
    // Thêm CSS cho thông báo làm lại
    if (isRetaking) {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .retaking-result-header {
                background-color: #f39c12;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-weight: 600;
                margin-bottom: 15px;
                text-align: center;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Thêm sự kiện xem lại bài làm
    const reviewBtn = actionsContainer.querySelector('#reviewQuiz');
    reviewBtn.addEventListener('click', function() {
        showQuizReview(result.detailedResults, quizForm);
    });
    
    // Hiển thị thông báo
    let message = `Bạn đã hoàn thành bài kiểm tra với số điểm: ${result.score.toFixed(2)}/10`;
    if (isRetaking) {
        message = `Bạn đã hoàn thành bài làm lại với số điểm: ${result.score.toFixed(2)}/10 (không được tính vào điểm chính thức)`;
    }
    alert(message);
    
    // Nếu kết quả có thông tin cảnh báo học tập, hiển thị nó
    if (result.learningAlert) {
        setTimeout(() => {
            displayLearningAlert(result.learningAlert);
        }, 1000); // Hiển thị sau khi đã hiển thị kết quả
    }
}

/**
 * Hiển thị xem lại bài làm
 * @param {Array} detailedResults - Kết quả chi tiết từng câu
 * @param {HTMLElement} quizForm - Form bài kiểm tra
 */
function showQuizReview(detailedResults, quizForm) {
    const questions = quizForm.querySelectorAll('.quiz-question');
    
    detailedResults.forEach(result => {
        const questionEl = questions[result.questionIndex];
        const statusEl = questionEl.querySelector(`#status_${result.questionIndex}`);
        const options = questionEl.querySelectorAll('.quiz-option');
        
        // Hiển thị trạng thái đúng/sai
        statusEl.innerHTML = result.isCorrect 
            ? '<span class="correct-answer">✅ 1/1</span>' 
            : '<span class="wrong-answer">❌ 0/1</span>';
        
        // Đánh dấu đáp án đúng và sai
        options.forEach(option => {
            const input = option.querySelector('input');
            const optionValue = input.value;
            
            if (optionValue === result.correctAnswer) {
                // Đáp án đúng
                option.classList.add('correct-option');
            } else if (optionValue === result.userAnswer && optionValue !== result.correctAnswer) {
                // Đáp án sai người dùng đã chọn
                option.classList.add('wrong-option');
            }
        });
    });
}

/**
 * Tạo container cho bài kiểm tra
 * @param {number} lectureId - ID bài giảng
 * @param {string} lectureTitle - Tiêu đề bài giảng
 * @returns {HTMLElement} - Container cho bài kiểm tra
 */
function createQuizContainer(lectureId, lectureTitle) {
    const container = document.createElement('div');
    container.className = 'quiz-container';
    container.dataset.lectureId = lectureId;
    
    // Thêm CSS vào trang
    addQuizStyles();
    
    return container;
}

/**
 * Thêm CSS cho bài kiểm tra
 */
function addQuizStyles() {
    // Kiểm tra xem CSS đã được thêm chưa
    if (document.getElementById('quiz-styles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'quiz-styles';
    styleElement.textContent = `
        .quiz-container {
            font-family: 'Roboto', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .quiz-header {
            margin-bottom: 30px;
            text-align: center;
        }
        
        .quiz-header h2 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .quiz-instructions {
            color: #7f8c8d;
            margin-bottom: 15px;
        }
        
        .quiz-meta {
            display: flex;
            justify-content: center;
            font-size: 0.9em;
            color: #34495e;
        }
        
        .quiz-question {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .question-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.2em;
        }
        
        .question-content p {
            font-size: 1.1em;
            margin-bottom: 15px;
            color: #34495e;
        }
        
        .question-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .quiz-option {
            padding: 10px 15px;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .quiz-option:hover {
            background: #f1f1f1;
        }
        
        .quiz-option input[type="radio"] {
            margin-right: 10px;
        }
        
        .quiz-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 30px;
            gap: 20px;
        }
        
        .submit-quiz-btn, .review-quiz-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .submit-quiz-btn:hover, .review-quiz-btn:hover {
            background: #2980b9;
        }
        
        .submit-quiz-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        
        .quiz-results-summary {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 15px;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .result-item {
            background: #f1f1f1;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            min-width: 120px;
        }
        
        .result-label {
            display: block;
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 5px;
        }
        
        .result-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .correct-option {
            background: rgba(46, 204, 113, 0.2);
        }
        
        .wrong-option {
            background: rgba(231, 76, 60, 0.2);
        }
        
        .correct-answer {
            color: #2ecc71;
            font-weight: bold;
        }
        
        .wrong-answer {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .error-message {
            padding: 20px;
            text-align: center;
            color: #e74c3c;
            font-size: 1.1em;
            background: rgba(231, 76, 60, 0.1);
            border-radius: 5px;
        }
        
        .submit-loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Thêm CSS cho timer khi đã dừng */
        .timer-stopped {
            color: #2ecc71;
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * Khởi tạo bài kiểm tra
 * @param {number} lectureId - ID bài giảng
 * @param {string} lectureTitle - Tiêu đề bài giảng
 * @param {HTMLElement} targetContainer - Container để hiển thị bài kiểm tra
 * @param {boolean} isRetaking - Đánh dấu đang làm lại bài
 * @returns {Promise<Object>} - Dữ liệu bài kiểm tra bao gồm thời gian làm bài
 */
async function initializeQuiz(lectureId, lectureTitle, targetContainer, isRetaking = false) {
    try {
        // Hiển thị hiệu ứng loading
        targetContainer.innerHTML = `
            <div class="quiz-loading">
                <div class="loading-spinner" style="width: 40px; height: 40px; border-width: 5px; border-color: rgba(52, 152, 219, 0.3); border-top-color: #3498db;"></div>
                <p>Đang tải bài kiểm tra...</p>
            </div>
        `;
        
        // Thêm CSS cho loading
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .quiz-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                width: 100%;
            }
            
            .quiz-loading p {
                margin-top: 20px;
                color: #3498db;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styleEl);
        
        // Tạo container cho bài kiểm tra
        const quizContainer = createQuizContainer(lectureId, lectureTitle);
        
        // Thêm container vào DOM
        targetContainer.innerHTML = '';
        targetContainer.appendChild(quizContainer);
        
        // Tải dữ liệu bài kiểm tra
        const quizData = await loadQuizData(lectureId);
        
        // In log giá trị timeLimit nhận được từ server
        console.log(`DEBUG - Dữ liệu nhận từ server: timeLimit = ${quizData.timeLimit}, lectureInfo =`, quizData.lectureInfo);
        console.log(`DEBUG - Trạng thái làm lại: ${isRetaking ? 'Đang làm lại' : 'Lần đầu làm'}`);
        
        // Render form bài kiểm tra
        renderQuizForm(quizData, quizContainer, isRetaking);
        
        // Trả về dữ liệu bài kiểm tra bao gồm thời gian làm bài
        return {
            ...quizData,
            timeLimit: quizData.timeLimit || 60, // Mặc định 60 phút nếu không có
            isRetaking: isRetaking
        };
    } catch (error) {
        console.error('Lỗi khi khởi tạo bài kiểm tra:', error);
        targetContainer.innerHTML = `
            <div class="error-message">
                <p>Lỗi khi tải bài kiểm tra: ${error.message}</p>
                <button onclick="window.history.back()" class="review-quiz-btn">Quay lại</button>
            </div>
        `;
        // Trả về null nếu có lỗi
        return null;
    }
}

/**
 * Hiển thị cảnh báo học tập sau khi hoàn thành bài kiểm tra
 * @param {string} alertMessage - Nội dung cảnh báo học tập
 */
function displayLearningAlert(alertMessage) {
    // Tìm container để thêm thông báo
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.warn('Không tìm thấy container để hiển thị cảnh báo học tập');
        return;
    }
    
    // Tạo thông báo cảnh báo học tập
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-info learning-alert';
    alertElement.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-lightbulb alert-icon"></i>
            <div class="alert-message">
                <strong>Gợi ý học tập cho bạn</strong>
                <div>${alertMessage}</div>
            </div>
        </div>
        <button class="close-alert"><i class="fas fa-times"></i></button>
    `;
    
    // Thêm CSS riêng cho learning-alert
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .learning-alert {
            background-color: rgba(52, 152, 219, 0.1);
            border-left: 4px solid #3498db;
            margin-bottom: 20px;
            animation: slideIn 0.5s ease-out;
        }
        
        .learning-alert .alert-icon {
            color: #f39c12;
            font-size: 1.5rem;
        }
        
        .learning-alert .close-alert {
            background: none;
            border: none;
            color: #7f8c8d;
            cursor: pointer;
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 1rem;
        }
        
        .learning-alert .close-alert:hover {
            color: #e74c3c;
        }
        
        @keyframes slideIn {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleEl);
    
    // Thêm sự kiện đóng thông báo
    alertElement.querySelector('.close-alert').addEventListener('click', function() {
        alertElement.remove();
    });
    
    // Thêm vào container thông báo
    messagesContainer.appendChild(alertElement);
    
    // Cuộn đến thông báo
    alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
} 