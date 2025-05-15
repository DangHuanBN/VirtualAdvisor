/**
 * Document Viewer - Xử lý hiển thị tài liệu PDF và theo dõi tiến độ đọc
 */

// Tải AuthHelper nếu chưa có
(function loadAuthHelper() {
    if (!window.AuthHelper) {
        const script = document.createElement('script');
        script.src = '/student/js/modules/auth-helper.js';
        script.async = true;
        script.onload = function() {
            console.log('AuthHelper đã được tải');
            // Khởi tạo lại thông tin người dùng sau khi tải AuthHelper
            if (typeof refreshUserInfo === 'function') {
                refreshUserInfo();
            }
        };
        document.head.appendChild(script);
    }
})();

// Cấu hình PDF.js và khởi tạo các biến toàn cục
pdfjsLib.GlobalWorkerOptions.workerSrc = '/libs/pdfjs/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let canvas = null;
let ctx = null;
let currentFileUrl = null;
let lectureId = null;
let userId = null;
let progress = 0;
let maxProgress = 0; // Biến lưu tiến độ cao nhất đã đạt được
let startTime = null;
let totalPages = 0;
let readPages = new Set();
let isTrackingActive = true;

/**
 * Kiểm tra và làm mới thông tin người dùng nếu cần thiết
 */
function refreshUserInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    
    if (urlUserId) {
        console.log("Sử dụng userId từ URL:", urlUserId);
        userId = parseInt(urlUserId);
        return;
    }
    
    try {
        // Thử lấy từ AuthHelper nếu có
        if (window.AuthHelper && typeof window.AuthHelper.getCurrentUserId === 'function') {
            userId = window.AuthHelper.getCurrentUserId();
            console.log("Sử dụng userId từ AuthHelper:", userId);
            return;
        }

        // Kiểm tra nhiều key khác nhau trong localStorage
        const possibleKeys = ['user', 'currentUser', 'userData', 'userInfo', 'auth'];
        
        for (const key of possibleKeys) {
            const userStr = localStorage.getItem(key);
            if (!userStr) continue;
            
            try {
                const userData = JSON.parse(userStr);
                console.log(`Dữ liệu từ localStorage[${key}]:`, userData);
                
                // Kiểm tra các trường có thể chứa userId
                if (userData.userId) {
                    userId = userData.userId;
                    console.log(`Sử dụng userId từ localStorage[${key}]:`, userId);
                    return;
                } else if (userData.user_id) {
                    userId = userData.user_id;
                    console.log(`Sử dụng user_id từ localStorage[${key}]:`, userId);
                    return;
                } else if (userData.id) {
                    userId = userData.id;
                    console.log(`Sử dụng id từ localStorage[${key}]:`, userId);
                    return;
                }
            } catch (error) {
                console.error(`Lỗi khi parse dữ liệu từ localStorage[${key}]:`, error);
            }
        }
        
        // Nếu không tìm thấy, trả về ID mặc định
        console.warn("Không tìm thấy userId, sử dụng giá trị mặc định: 12");
        userId = 12; // ID mặc định theo AuthHelper
    } catch (e) {
        console.error("Lỗi khi làm mới thông tin người dùng:", e);
        userId = 12; // ID mặc định theo AuthHelper
    }
}

/**
 * Hiển thị thông báo lỗi và ẩn bộ chỉ thị đang tải
 * @param {string} message - Thông báo lỗi để hiển thị
 */
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const loadingElement = document.getElementById('pdfLoading');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Trích xuất phần mở rộng tệp tin từ đường dẫn tệp
 * @param {string} filePath - Đường dẫn tệp tin cần trích xuất phần mở rộng
 * @returns {string} Phần mở rộng tệp tin (không có dấu chấm), đã được chuyển thành chữ thường
 */
function getFileExtension(filePath) {
    if (!filePath) return '';
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filePath.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * Lấy trang được chỉ định từ tài liệu PDF và hiển thị lên canvas
 * @param {number} num - Số trang cần hiển thị
 */
function renderPage(num) {
    if (!pdfDoc) return;
    
    pageRendering = true;
    
    // Hiển thị bộ chỉ thị đang tải
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        
        if (canvas && ctx) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render PDF page vào canvas
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            
            // Đợi cho quá trình render hoàn thành
            renderTask.promise.then(function() {
                pageRendering = false;
                
                // Ẩn bộ chỉ thị đang tải
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Nếu pageNumPending không phải là null, nghĩa là người dùng đã chuyển 
                // trang trong khi đang render, nên bắt đầu render trang mới
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                } else {
                    // Cập nhật trạng thái đọc cho trang hiện tại
                    trackPageRead(num);
                }
            }).catch(function(error) {
                console.error('Lỗi khi render trang PDF:', error);
                showError('Không thể hiển thị trang PDF. Vui lòng thử lại.');
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            });
        }
    }).catch(function(error) {
        console.error('Lỗi khi lấy trang PDF:', error);
        showError('Không thể tải trang PDF. Vui lòng thử lại.');
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        pageRendering = false;
    });
}

/**
 * Khởi tạo PDF viewer và tải tài liệu
 */
function initPdfViewer() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileUrl = urlParams.get('file');
    lectureId = urlParams.get('lectureId');
    const title = urlParams.get('title') || 'Tài liệu không có tiêu đề';
    
    // Làm mới thông tin người dùng
    refreshUserInfo();
    
    // Cập nhật tiêu đề và thông tin sinh viên
    const docTitleElement = document.getElementById('documentTitle');
    const studentNameElement = document.getElementById('studentName');
    const studentIdElement = document.getElementById('studentId');
    
    // Lấy thông tin người dùng đầy đủ
    const userInfo = getUserInfo();
    
    if (docTitleElement) {
        docTitleElement.textContent = title;
    }
    
    if (studentNameElement) {
        studentNameElement.textContent = userInfo?.fullName || userInfo?.name || 'Sinh viên';
    }
    
    if (studentIdElement) {
        // Chỉ hiển thị ID, không thêm tiền tố "ID: " để tránh trùng lặp
        studentIdElement.textContent = userInfo?.studentId || userId;
    }
    
    // Cập nhật nút tải xuống
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn && fileUrl) {
        downloadBtn.addEventListener('click', function() {
            window.open(fileUrl, '_blank');
        });
    }
    
    if (fileUrl && lectureId) {
        console.log('Mở tài liệu:', fileUrl, 'Lecture ID:', lectureId, 'User ID:', userId);
        currentFileUrl = fileUrl;
        convertAndOpenFile(fileUrl, lectureId, userId);
    } else {
        showError('Thiếu thông tin tài liệu hoặc người dùng. Vui lòng thử lại.');
        console.error('Lỗi: Thiếu thông tin', {fileUrl, lectureId, userId});
    }
    
    setupEventListeners();
}

/**
 * Thiết lập các trình xử lý sự kiện cho các nút điều khiển
 */
function setupEventListeners() {
    // Xác định các phần tử DOM
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    
    // Thiết lập sự kiện cho nút Trang trước
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        });
    }
    
    // Thiết lập sự kiện cho nút Trang sau
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (pageNum >= totalPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        });
    }
    
    // Thiết lập sự kiện cho nút Phóng to
    if (zoomInButton) {
        zoomInButton.addEventListener('click', function() {
            scale += 0.25;
            queueRenderPage(pageNum);
        });
    }
    
    // Thiết lập sự kiện cho nút Thu nhỏ
    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', function() {
            if (scale <= 0.5) return;
            scale -= 0.25;
            queueRenderPage(pageNum);
        });
    }
    
    // Sự kiện khi đóng trình duyệt hoặc chuyển trang
    window.addEventListener('beforeunload', function() {
        saveProgress();
    });
}

/**
 * Chuyển đến trang mới, xếp hàng đợi nếu đang render
 * @param {number} num - Số trang cần chuyển đến
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
    
    // Cập nhật hiển thị số trang
    const pageNumElement = document.getElementById('page_num');
    if (pageNumElement) {
        pageNumElement.textContent = num;
    }
    
    // Đánh dấu trang hiện tại là đã đọc
    trackPageRead(num);
}

/**
 * Lấy thông tin người dùng từ localStorage
 * @returns {Object} Thông tin người dùng
 */
function getUserInfo() {
    try {
        // Ưu tiên sử dụng AuthHelper nếu có sẵn
        if (window.AuthHelper && typeof window.AuthHelper.getCurrentUserId === 'function') {
            console.log("Đang sử dụng AuthHelper để lấy thông tin người dùng");
            
            // Lấy ID từ AuthHelper
            const userId = window.AuthHelper.getCurrentUserId();
            
            // Kiểm tra các key khác nhau trong localStorage
            const possibleKeys = ['user', 'currentUser', 'userData', 'userInfo', 'auth'];
            
            for (const key of possibleKeys) {
                const userStr = localStorage.getItem(key);
                if (!userStr) continue;
                
                try {
                    const userData = JSON.parse(userStr);
                    console.log(`Đã parse dữ liệu từ localStorage[${key}]:`, userData);
                    
                    // Kiểm tra và trả về thông tin hợp lệ
                    if (userData) {
                        // Nếu đây là object chứa thông tin người dùng trực tiếp
                        if (userData.fullName || userData.name || userData.username) {
                            return {
                                userId: userId,
                                fullName: userData.fullName || userData.name || userData.username,
                                studentId: userData.studentId || userData.student_id || userData.mssv || userId
                            };
                        }
                        
                        // Nếu dữ liệu người dùng được lưu trong thuộc tính user
                        if (userData.user) {
                            return {
                                userId: userId,
                                fullName: userData.user.fullName || userData.user.name || userData.user.username,
                                studentId: userData.user.studentId || userData.user.student_id || userData.user.mssv || userId
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Lỗi khi parse dữ liệu từ localStorage[${key}]:`, error);
                }
            }
            
            // Nếu không tìm thấy tên, trả về object với ID
            return { 
                userId: userId,
                fullName: "Sinh viên", // Tên mặc định thay vì "Không xác định"
                studentId: userId 
            };
        }
        
        // Nếu không có AuthHelper, thử lấy trực tiếp từ localStorage
        const userStr = localStorage.getItem('currentUser');
        console.log("Raw localStorage data (currentUser):", userStr);
        
        if (userStr) {
            const userData = JSON.parse(userStr);
            console.log("Parsed user data from currentUser:", userData);
            return {
                userId: userData.userId || userData.id || 1,
                fullName: userData.fullName || userData.name || userData.username || "Sinh viên",
                studentId: userData.studentId || userData.student_id || userData.mssv || userData.userId || userData.id || 1
            };
        }
        
        console.log("Không tìm thấy dữ liệu người dùng trong localStorage, sử dụng giá trị mặc định");
        return { 
            userId: 1, 
            fullName: "Sinh viên", 
            studentId: 1 
        };
    } catch (e) {
        console.error('Lỗi khi lấy thông tin người dùng:', e);
        return { 
            userId: 1, 
            fullName: "Sinh viên", 
            studentId: 1 
        };
    }
}

/**
 * Xử lý mở tài liệu, tự động chuyển đổi từ DOCX/PPTX sang PDF nếu có thể
 * @param {string} fileUrl - URL của tài liệu cần mở
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function convertAndOpenFile(fileUrl, id, user) {
    if (!fileUrl) {
        showError('URL tài liệu không hợp lệ.');
        return;
    }
    
    // Lấy phần mở rộng tệp tin
    const fileExtension = getFileExtension(fileUrl);
    
    // Kiểm tra nếu đã là PDF, mở trực tiếp
    if (fileExtension === 'pdf') {
        openPdfFile(fileUrl, id, user);
        return;
    }
    
    // Hiển thị bộ chỉ thị đang tải
    const loadingElement = document.getElementById('pdfLoading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
    
    const viewerContainer = document.getElementById('viewerContainer');
    if (viewerContainer) {
        viewerContainer.classList.add('hidden');
    }
    
    // Nếu là DOCX hoặc PPTX, thử xác định đường dẫn đến file PDF tương ứng
    if (['docx', 'doc', 'pptx', 'ppt'].includes(fileExtension)) {
        console.log('Tự động chuyển đổi đường dẫn từ ' + fileExtension + ' sang PDF:', fileUrl);
        
        // Cách 1: Thay trực tiếp phần mở rộng để tạo đường dẫn PDF
        const lastDotIndex = fileUrl.lastIndexOf('.');
        const pdfUrl = fileUrl.substring(0, lastDotIndex) + '.pdf';
        
        // Kiểm tra xem file PDF đã tồn tại chưa
        fetch(pdfUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // Nếu file PDF đã tồn tại, mở trực tiếp
                    console.log('Đã tìm thấy file PDF cùng tên:', pdfUrl);
                    openPdfFile(pdfUrl, id, user);
                } else {
                    // Cách 2: Kiểm tra nếu là GUID_TenBai.pptx, tìm GUID_TenBai.pdf
                    if (fileUrl.includes('/uploads/')) {
                        // Trích xuất phần tên file từ URL
                        const urlParts = fileUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
                        
                        // Thử tìm trong AI_Training/uploads
                        const aiTrainingPdfUrl = `/AI_Training/uploads/${baseName}.pdf`;
                        console.log('Thử tìm PDF trong AI_Training/uploads:', aiTrainingPdfUrl);
                        
                        fetch(aiTrainingPdfUrl, { method: 'HEAD' })
                            .then(aiResponse => {
                                if (aiResponse.ok) {
                                    console.log('Đã tìm thấy file PDF trong AI_Training/uploads:', aiTrainingPdfUrl);
                                    openPdfFile(aiTrainingPdfUrl, id, user);
                                    return;
                                } else {
                                    // Không tìm thấy trong AI_Training/uploads, thử cách khác
                                    findPdfFromFileConverter(fileUrl, id, user);
                                }
                            })
                            .catch(() => {
                                console.log('Không tìm thấy trong AI_Training/uploads, thử cách khác');
                                findPdfFromFileConverter(fileUrl, id, user);
                            });
                    } else {
                        // Không phải URL từ uploads, thử tìm từ FileConverter
                        findPdfFromFileConverter(fileUrl, id, user);
                    }
                }
            })
            .catch(error => {
                console.log('Lỗi khi kiểm tra file PDF cùng tên:', error);
                findPdfFromFileConverter(fileUrl, id, user);
            });
    } else {
        showError(`Định dạng tệp tin ${fileExtension} không được hỗ trợ.`);
    }
}

/**
 * Tìm file PDF từ FileConverter API
 * @param {string} fileUrl - URL của tài liệu gốc
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function findPdfFromFileConverter(fileUrl, id, user) {
    // Kiểm tra xem có phải là URL từ API FileConverter/serve
    if (fileUrl.includes('/api/FileConverter/serve')) {
        // Trích xuất tên file gốc để tạo URL phù hợp
        const params = new URLSearchParams(fileUrl.split('?')[1]);
        const originalFilePath = params.get('filePath');
        
        if (originalFilePath) {
            const fileName = originalFilePath.split('/').pop() || originalFilePath;
            
            // Tạo tên file PDF
            const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
            const pdfFileName = fileNameWithoutExt + '.pdf';
            
            // Thử mở file PDF trực tiếp từ FileConverter
            const directPdfUrl = `/api/FileConverter/serve?filePath=${pdfFileName}`;
            console.log('Thử mở PDF từ FileConverter:', directPdfUrl);
            
            fetch(directPdfUrl, { method: 'HEAD' })
                .then(pdfResponse => {
                    if (pdfResponse.ok) {
                        console.log('Đã tìm thấy file PDF từ FileConverter:', directPdfUrl);
                        openPdfFile(directPdfUrl, id, user);
                    } else {
                        console.log('Không tìm thấy PDF từ FileConverter, thử chuyển đổi');
                        callConvertApi(fileUrl, id, user);
                    }
                })
                .catch(() => {
                    console.log('Lỗi khi kiểm tra PDF từ FileConverter, thử chuyển đổi');
                    callConvertApi(fileUrl, id, user);
                });
        } else {
            console.log('Không thể trích xuất tên file, tải file gốc');
            openPdfFile(fileUrl, id, user);
        }
    } else {
        // Đây là URL thông thường, gọi API chuyển đổi
        console.log('URL thông thường, gọi API chuyển đổi');
        callConvertApi(fileUrl, id, user);
    }
}

/**
 * Gọi API chuyển đổi tài liệu sang PDF
 * @param {string} fileUrl - URL của tài liệu cần chuyển đổi
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function callConvertApi(fileUrl, id, user) {
    // Kiểm tra nếu đường dẫn đã có sẵn dấu "?"
    const separator = fileUrl.includes('?') ? '&' : '?';
    const apiUrl = `/api/fileconverter/convert${separator}fileUrl=${encodeURIComponent(fileUrl)}`;
    
    console.log('Gọi API chuyển đổi:', apiUrl);
    
    fetch(apiUrl, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.pdfUrl) {
            console.log('Chuyển đổi thành công:', data.pdfUrl);
            openPdfFile(data.pdfUrl, id, user);
        } else {
            console.error('Lỗi chuyển đổi tài liệu:', data.message || 'Không rõ lỗi');
            showError('Không thể chuyển đổi tài liệu. ' + (data.message || 'Vui lòng thử lại.'));
            
            // Nếu không thể chuyển đổi, thử mở file gốc
            if (confirm('Không thể chuyển đổi tài liệu sang PDF. Bạn có muốn mở tệp tin gốc không?')) {
                openOriginalFile(fileUrl, id, user);
            }
        }
    })
    .catch(error => {
        console.error('Lỗi khi chuyển đổi tài liệu:', error);
        showError('Lỗi khi chuyển đổi tài liệu: ' + error.message);
        
        // Trong trường hợp lỗi, thử mở tệp tin gốc
        if (confirm('Không thể chuyển đổi tài liệu. Bạn có muốn tải xuống tệp tin gốc không?')) {
            window.open(fileUrl, '_blank');
        }
    });
}

/**
 * Mở file gốc nếu không thể chuyển đổi sang PDF
 * @param {string} fileUrl - URL của tài liệu gốc
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function openOriginalFile(fileUrl, id, user) {
    const loadingElement = document.getElementById('pdfLoading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = 'Đang tải xuống tệp tin gốc...';
        errorElement.classList.remove('hidden');
    }
    
    window.open(fileUrl, '_blank');
    
    // Cập nhật tiến độ đọc
    if (id && user) {
        fetch('/api/tracking/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lectureId: parseInt(id),
                userId: parseInt(user),
                progress: 100,
                pagesRead: [1],
                totalPages: 1
            })
        })
        .then(() => {
            console.log('Đã cập nhật tiến độ đọc cho tệp tin gốc');
        })
        .catch(err => {
            console.error('Lỗi khi cập nhật tiến độ:', err);
        });
    }
}

/**
 * Mở tài liệu PDF và khởi tạo viewer
 * @param {string} pdfUrl - URL của tài liệu PDF cần mở
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function openPdfFile(pdfUrl, id, user) {
    if (!pdfUrl) {
        showError('URL tài liệu PDF không hợp lệ.');
        return;
    }
    
    console.log('Mở file PDF:', pdfUrl);
    
    const loadingElement = document.getElementById('pdfLoading');
    const viewerContainer = document.getElementById('viewerContainer');
    
    if (loadingElement) {
        loadingElement.innerHTML = '<div class="loader"></div><p>Đang tải tài liệu PDF...</p>';
        loadingElement.classList.remove('hidden');
    }
    
    if (viewerContainer) {
        viewerContainer.classList.add('hidden');
    }
    
    // Thiết lập canvas và context
    canvas = document.getElementById('pdfCanvas');
    ctx = canvas.getContext('2d');
    
    // Lưu thời gian bắt đầu để theo dõi
    startTime = new Date();
    
    // Kiểm tra xem pdfdoc đã được tải trước đó chưa
    if (pdfDoc) {
        console.log('Đóng tài liệu PDF hiện tại trước khi mở tài liệu mới');
        pdfDoc = null;
    }
    
    // Lấy tiến độ đọc từ server
    if (id && user) {
        fetchReadingProgress(id, user);
    }
    
    // Tải và hiển thị tài liệu PDF
    pdfjsLib.getDocument(pdfUrl).promise
        .then(function(pdf) {
            console.log('PDF tải thành công, số trang:', pdf.numPages);
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            
            // Cập nhật tổng số trang
            document.getElementById('numPages').textContent = pdf.numPages;
            
            // Ẩn loading, hiển thị viewer
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
            
            if (viewerContainer) {
                viewerContainer.classList.remove('hidden');
            }
            
            // Render trang đầu tiên
            pageNum = 1;
            renderPage(pageNum);
            
            // Thiết lập các event listener
            setupEventListeners();
            
            // Đánh dấu trang đầu tiên đã đọc
            trackPageRead(1);
        })
        .catch(function(error) {
            console.error('Lỗi khi tải PDF:', error);
            
            // Xử lý các lỗi khác nhau
            let errorMessage = 'Không thể tải tài liệu PDF.';
            
            if (error.name === 'MissingPDFException') {
                errorMessage = 'Không tìm thấy tài liệu PDF. Vui lòng kiểm tra đường dẫn.';
            } else if (error.name === 'InvalidPDFException') {
                errorMessage = 'Tài liệu PDF không hợp lệ hoặc bị hỏng.';
            } else if (error.name === 'PasswordException') {
                errorMessage = 'Tài liệu PDF được bảo vệ bằng mật khẩu.';
            } else if (error.message && error.message.includes('HTTP error')) {
                // Xử lý lỗi HTTP, đặc biệt là lỗi 400
                if (error.message.includes('status: 400')) {
                    errorMessage = 'Lỗi khi chuyển đổi tài liệu: HTTP error! status: 400';
                    
                    // Hiển thị hộp thoại hỏi người dùng có muốn tải xuống file gốc không
                    const confirmDownload = confirm("localhost:5261 cho biết\nKhông thể chuyển đổi tài liệu. Bạn có muốn tải xuống tệp tin gốc không?");
                    if (confirmDownload) {
                        // Trích xuất file gốc từ URL hiện tại
                        const urlParams = new URLSearchParams(window.location.search);
                        const originalFileUrl = urlParams.get('file');
                        if (originalFileUrl) {
                            window.open(originalFileUrl, '_blank');
                        }
                    }
                } else {
                    errorMessage = `Lỗi khi tải tài liệu: ${error.message}`;
                }
            }
            
            showError(errorMessage);
            
            // Ẩn loading indicator
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        });
}

/**
 * Đánh dấu trang đã đọc và cập nhật tiến độ
 * @param {number} pageNumber - Số trang đã đọc
 */
function trackPageRead(pageNumber) {
    if (!isTrackingActive || !lectureId || !userId) return;
    
    // Kiểm tra xem trang này đã được đọc chưa
    const isNewPage = !readPages.has(pageNumber);
    
    // Thêm trang hiện tại vào danh sách đã đọc
    readPages.add(pageNumber);
    
    // Nếu là trang mới, cập nhật tiến độ ngay lập tức
    if (isNewPage) {
        console.log(`Trang mới ${pageNumber} được đánh dấu là đã đọc`);
        updateProgress();
        
        // Kiểm tra nếu đã đọc đến ngưỡng lưu tiến độ
        const currentTimeStamp = new Date().getTime();
        if (!startTime || (currentTimeStamp - startTime.getTime()) > 15000) { // 15 giây
            saveProgress();
            startTime = new Date();
        }
    }
    
    // Kiểm tra nếu đã đọc hết tài liệu
    if (readPages.size >= totalPages) {
        console.log('Đã đọc hoàn tất tài liệu!');
        markAsCompleted();
    }
}

/**
 * Cập nhật tiến độ đọc
 */
function updateProgress() {
    try {
        // Tính toán phần trăm tiến độ
        if (totalPages > 0) {
            const newProgress = Math.floor((readPages.size / totalPages) * 100);
            
            // In thông tin chi tiết để debug
            console.log(`Tiến độ: ${readPages.size}/${totalPages} trang = ${newProgress}%`);
            
            // Cập nhật biến progress
            progress = newProgress;
            
            // Cập nhật maxProgress nếu progress mới cao hơn
            if (progress > maxProgress) {
                console.log(`Cập nhật tiến độ từ ${maxProgress}% lên ${progress}%`);
                maxProgress = progress;
            }
        } else {
            progress = 0;
        }

        // Cập nhật thanh tiến độ và phần trăm hiển thị
        const readingProgress = document.getElementById('readingProgress');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (readingProgress) {
            // Luôn hiển thị tiến độ cao nhất đã đạt được
            readingProgress.style.width = `${maxProgress}%`;
        }
        
        if (progressPercentage) {
            // Luôn hiển thị phần trăm cao nhất đã đạt được
            progressPercentage.textContent = `${maxProgress}%`;
        }
        
        // Kiểm tra và hiển thị trạng thái hoàn thành
        if (maxProgress >= 80) {
            const completionStatus = document.getElementById('completionStatus');
            if (completionStatus) {
                completionStatus.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật hiển thị tiến độ:', error);
    }
}

/**
 * Lưu tiến độ đọc lên server
 */
function saveProgress() {
    try {
        // Đảm bảo làm mới thông tin người dùng trước khi lưu
        if (!userId || userId <= 0) {
            refreshUserInfo();
        }
        
        if (!userId || !lectureId) {
            console.error('Thiếu thông tin userId hoặc lectureId để lưu tiến độ', { userId, lectureId });
            return;
        }

        console.log("Lưu tiến độ với userId =", userId, "lectureId =", lectureId);

        // Cập nhật tiến độ đọc trước khi lưu
        updateProgress();

        // Chuyển đổi Set thành Array để gửi lên server
        const pagesReadArray = Array.from(readPages);
        
        const progressData = {
            userId: parseInt(userId),
            lectureId: parseInt(lectureId),
            progress: maxProgress, // Luôn sử dụng tiến độ cao nhất để lưu
            pagesRead: pagesReadArray,
            totalPages: totalPages,
            status: maxProgress >= 80 ? "hoanthanh" : "chuahoanthanh"
        };
        
        console.log("Dữ liệu gửi lên server:", progressData);
        
        // Gửi dữ liệu lên server
        fetch('/api/Tracking/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progressData)
        })
        .then(response => {
            console.log("Kết quả API:", response.status, response.statusText);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Lưu tiến độ thành công:', data);
                
                // Cập nhật thông tin thời gian học
                if (typeof fetchLearningTimeInfo === 'function') {
                    fetchLearningTimeInfo();
                }
            } else {
                console.error('Lỗi khi lưu tiến độ:', data.message);
            }
        })
        .catch(error => {
            console.error('Lỗi kết nối khi lưu tiến độ:', error);
        });
    } catch (error) {
        console.error('Lỗi khi lưu tiến độ:', error);
    }
}

/**
 * Đánh dấu tài liệu là đã hoàn thành
 */
function markAsCompleted() {
    if (!isTrackingActive || !lectureId || !userId) return;
    
    const progressData = {
        userId: parseInt(userId),
        lectureId: parseInt(lectureId),
        progress: maxProgress, // Sử dụng tiến độ cao nhất
        pagesRead: Array.from(readPages),
        totalPages: totalPages,
        status: "hoanthanh"
    };
    
    // Sử dụng endpoint cập nhật tiến độ từ TrackingController
    fetch('/api/Tracking/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Đánh dấu hoàn thành thành công:', data);
            
            // Hiển thị thông báo hoàn thành
            const completionStatus = document.getElementById('completionStatus');
            if (completionStatus) {
                completionStatus.classList.remove('hidden');
            }
            
            // Cập nhật thông tin thời gian học
            if (typeof fetchLearningTimeInfo === 'function') {
                fetchLearningTimeInfo();
            }
        } else {
            console.error('Lỗi khi đánh dấu hoàn thành:', data.message);
        }
    })
    .catch(error => {
        console.error('Lỗi khi đánh dấu hoàn thành:', error);
    });
}

/**
 * Lấy tiến độ đọc trước đó từ server
 * @param {number} id - ID của bài giảng
 * @param {number} user - ID của người dùng
 */
function fetchReadingProgress(id, user) {
    if (!isTrackingActive || !id || !user) return;
    
    // Sử dụng endpoint mới từ TrackingController
    fetch('/api/Tracking/lecture/' + id + '/user/' + user, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                console.log('Chưa có tiến độ đọc trước đó.');
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            const trackingData = data.data;
            console.log('Đã tải tiến độ đọc:', trackingData);
            
            // Cập nhật tiến độ và các trang đã đọc
            progress = trackingData.progress || 0;
            maxProgress = trackingData.progress || 0; // Khởi tạo maxProgress bằng tiến độ đã lưu
            
            // Khôi phục danh sách các trang đã đọc
            readPages = new Set();
            
            // Nếu có danh sách trang đã đọc, sử dụng nó
            if (trackingData.pagesRead && Array.isArray(trackingData.pagesRead)) {
                trackingData.pagesRead.forEach(page => readPages.add(parseInt(page)));
            } else {
                // Nếu không có danh sách cụ thể, tạo danh sách dựa vào tiến độ
                // Giả định rằng tất cả các trang từ 1 đến trang tương ứng với tiến độ đã được đọc
                const estimatedPagesRead = Math.floor((trackingData.progress / 100) * totalPages);
                for (let i = 1; i <= estimatedPagesRead; i++) {
                    readPages.add(i);
                }
            }
            
            console.log(`Đã khôi phục ${readPages.size} trang đã đọc.`);
            
            // Cập nhật hiển thị tiến độ
            updateProgress();
            
            // Nếu đã hoàn thành, hiển thị thông báo
            if (trackingData.status === "hoanthanh" || maxProgress >= 80) {
                const completionStatus = document.getElementById('completionStatus');
                if (completionStatus) {
                    completionStatus.classList.remove('hidden');
                }
            }
            
            // Tự động nhảy đến trang dựa trên tiến độ đã học
            if (totalPages > 0 && maxProgress > 0) {
                // Tính toán số trang tương ứng với phần trăm tiến độ: ceil(totalPages * progress / 100)
                const targetPage = Math.max(1, Math.min(totalPages, Math.ceil(totalPages * maxProgress / 100)));
                console.log(`Tự động nhảy đến trang ${targetPage} (${maxProgress}%)`);
                
                // Đảm bảo trang hợp lệ và chỉ chuyển trang nếu khác trang hiện tại
                if (targetPage > 0 && targetPage <= totalPages && targetPage !== pageNum) {
                    pageNum = targetPage;
                    queueRenderPage(pageNum);
                }
            }
            
            // Cập nhật thông tin thời gian học
            if (typeof fetchLearningTimeInfo === 'function') {
                fetchLearningTimeInfo();
            }
        }
    })
    .catch(error => {
        console.error('Lỗi khi tải tiến độ đọc:', error);
    });
} 