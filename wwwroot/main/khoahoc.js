// Tạo các hàm khởi tạo và hiệu ứng cho trang
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo hiệu ứng Cyber
    initCyberEffects();
    
    // Lấy dữ liệu môn học và khóa học
    fetchPopularSubjectsWithCourses();
});

// Hàm khởi tạo hiệu ứng cyber
function initCyberEffects() {
    // Xử lý toggle level sections
    document.querySelectorAll('.cyber-level-header').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isActive = content.classList.contains('active');
            
            // Đóng tất cả các section khác
            document.querySelectorAll('.cyber-level-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.cyber-level-header').forEach(h => h.classList.remove('active'));
            
            // Mở/đóng section hiện tại
            if (!isActive) {
                content.classList.add('active');
                this.classList.add('active');
            }
        });
    });
    
    // Hiệu ứng glitch cho text
    const glitchElement = document.querySelector('.cyber-glitch');
    if (glitchElement) {
        const text = glitchElement.textContent;
        glitchElement.setAttribute('data-text', text);
    }
    
    // Lọc khóa học theo loại
    document.querySelectorAll('.cyber-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Xử lý active tab
            document.querySelectorAll('.cyber-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Lọc khóa học theo loại
function filterCourses(type) {
    // Reset all visibilities
    document.querySelectorAll('.cyber-level').forEach(level => {
        level.style.display = 'block';
    });
    
    // If not "all", then filter
    if (type !== 'all') {
        document.querySelectorAll('.cyber-level').forEach(level => {
            if (!level.classList.contains(type)) {
                level.style.display = 'none';
            }
        });
    }
}

// Toggle level content
function toggleLevel(element) {
    const content = element.nextElementSibling;
    const isActive = content.classList.contains('active');
    
    // Toggle active class
    if (isActive) {
        content.classList.remove('active');
        element.classList.remove('active');
    } else {
        content.classList.add('active');
        element.classList.add('active');
    }
}

// Hàm lấy dữ liệu môn học và khóa học từ API
async function fetchPopularSubjectsWithCourses() {
    try {
        // Hiển thị thông báo đang tải
        console.log('Đang tải dữ liệu môn học và khóa học...');
        
        // Gọi API thông qua service
        const data = await SubjectCourseAPI.getPopularSubjectsWithCourses();
        console.log('API response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            // Hiển thị dữ liệu
            displaySubjectsWithCourses(data.data);
        } else {
            console.error('Dữ liệu không hợp lệ:', data);
            // Trong trường hợp lỗi, hiển thị dữ liệu mẫu
            displaySampleData();
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        // Trong trường hợp lỗi, hiển thị dữ liệu mẫu
        displaySampleData();
    }
}

// Hàm hiển thị dữ liệu môn học và khóa học
function displaySubjectsWithCourses(subjects) {
    const mainContainer = document.querySelector('.cyber-main');
    if (!mainContainer) {
        console.error('Không tìm thấy container để hiển thị dữ liệu');
        return;
    }
    
    // Xóa nội dung hiện tại (nếu có)
    mainContainer.innerHTML = '';
    
    // Tạo các section cho từng môn học
    subjects.forEach(subject => {
        // Tạo container cho môn học
        const subjectSection = document.createElement('section');
        subjectSection.className = 'cyber-level all'; // Thêm class 'all' để hiển thị tất cả
        
        // Thêm header cho môn học
        const headerHTML = `
            <div class="cyber-level-header" onclick="toggleLevel(this)">
                <h2 class="cyber-title">
                    <span class="cyber-hover">${subject.subjectName}</span>
                    <span class="cyber-underline"></span>
                </h2>
                <div class="cyber-icon">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
        `;
        subjectSection.innerHTML = headerHTML;
        
        // Tạo container cho nội dung
        const contentDiv = document.createElement('div');
        contentDiv.className = 'cyber-level-content';
        
        // Tạo container cho khối lớp
        const gradeDiv = document.createElement('div');
        gradeDiv.className = 'cyber-grade';
        
        // Tạo container cho khóa học
        const coursesDiv = document.createElement('div');
        coursesDiv.className = 'cyber-courses';
        
        // Thêm các khóa học vào container
        subject.courses.forEach(course => {
            // Xác định category cho khóa học (mặc định là 'ai')
            const categoryClass = getCategoryClassFromName(course.courseName);
            
            // Tạo card cho khóa học
            const courseCard = document.createElement('div');
            courseCard.className = `cyber-card ${categoryClass}`;
            
            const courseHTML = `
                <div class="cyber-card-inner">
                    <div class="cyber-card-front">
                        <i class="${getCategoryIconFromName(course.courseName)}"></i>
                        <h4>${course.courseName}</h4>
                    </div>
                    <div class="cyber-card-back">
                        <p>${getCourseDescription(course.courseName)}</p>
                        <div class="card-button-container">
                            <a href="login.html?course=${course.courseId}" class="cyber-button">Đăng ký học thử</a>
                        </div>
                    </div>
                </div>
            `;
            
            courseCard.innerHTML = courseHTML;
            coursesDiv.appendChild(courseCard);
        });
        
        // Kết hợp tất cả các phần
        gradeDiv.appendChild(coursesDiv);
        contentDiv.appendChild(gradeDiv);
        subjectSection.appendChild(contentDiv);
        
        // Thêm section vào main container
        mainContainer.appendChild(subjectSection);
    });
}

// Hàm lấy mô tả khóa học dựa trên tên
function getCourseDescription(courseName) {
    // Mô tả mặc định
    return `Khóa học ${courseName} sẽ giúp bạn nắm vững kiến thức cơ bản và nâng cao.`;
}

// Hàm lấy class cho khóa học dựa trên tên
function getCategoryClassFromName(courseName) {
    const lowerName = courseName.toLowerCase();
    
    if (lowerName.includes('toán')) return 'math';
    if (lowerName.includes('văn') || lowerName.includes('ngữ văn') || lowerName.includes('tiếng việt')) return 'literature';
    if (lowerName.includes('anh') || lowerName.includes('tiếng anh')) return 'english';
    if (lowerName.includes('lý') || lowerName.includes('vật lý')) return 'physics';
    if (lowerName.includes('hóa') || lowerName.includes('hóa học')) return 'chemistry';
    if (lowerName.includes('sinh') || lowerName.includes('sinh học')) return 'biology';
    if (lowerName.includes('sử') || lowerName.includes('lịch sử')) return 'history';
    if (lowerName.includes('địa') || lowerName.includes('địa lý')) return 'geography';
    if (lowerName.includes('tin') || lowerName.includes('cntt') || lowerName.includes('python')) return 'it';
    if (lowerName.includes('web') || lowerName.includes('html') || lowerName.includes('javascript')) return 'web';
    if (lowerName.includes('mobile') || lowerName.includes('android') || lowerName.includes('ios')) return 'mobile';
    if (lowerName.includes('data') || lowerName.includes('dữ liệu')) return 'data';
    if (lowerName.includes('ai') || lowerName.includes('ml') || lowerName.includes('trí tuệ')) return 'ai';
    
    // Mặc định
    return 'ai';
}

// Hàm lấy icon cho khóa học dựa trên tên
function getCategoryIconFromName(courseName) {
    const lowerName = courseName.toLowerCase();
    
    if (lowerName.includes('toán')) return 'fas fa-square-root-alt';
    if (lowerName.includes('văn') || lowerName.includes('ngữ văn') || lowerName.includes('tiếng việt')) return 'fas fa-book-open';
    if (lowerName.includes('anh') || lowerName.includes('tiếng anh')) return 'fas fa-language';
    if (lowerName.includes('lý') || lowerName.includes('vật lý')) return 'fas fa-atom';
    if (lowerName.includes('hóa') || lowerName.includes('hóa học')) return 'fas fa-flask';
    if (lowerName.includes('sinh') || lowerName.includes('sinh học')) return 'fas fa-dna';
    if (lowerName.includes('sử') || lowerName.includes('lịch sử')) return 'fas fa-landmark';
    if (lowerName.includes('địa') || lowerName.includes('địa lý')) return 'fas fa-globe-asia';
    if (lowerName.includes('tin') || lowerName.includes('cntt')) return 'fas fa-laptop';
    if (lowerName.includes('web') || lowerName.includes('html')) return 'fas fa-globe';
    if (lowerName.includes('mobile') || lowerName.includes('android') || lowerName.includes('ios')) return 'fas fa-mobile-alt';
    if (lowerName.includes('data') || lowerName.includes('dữ liệu')) return 'fas fa-chart-line';
    if (lowerName.includes('ai') || lowerName.includes('ml') || lowerName.includes('trí tuệ')) return 'fas fa-robot';
    if (lowerName.includes('python')) return 'fab fa-python';
    
    // Mặc định
    return 'fas fa-book';
}

// Hiển thị dữ liệu mẫu trong trường hợp API lỗi
function displaySampleData() {
    console.log('Hiển thị dữ liệu mẫu');
    
    const sampleData = [
        {
            subjectId: 1,
            subjectName: "Toán học",
            courses: [
                { courseId: 1, courseName: "Toán lớp 1", studentCount: 120, lectureCount: 10 },
                { courseId: 2, courseName: "Toán lớp 2", studentCount: 90, lectureCount: 12 },
                { courseId: 3, courseName: "Toán lớp 3", studentCount: 85, lectureCount: 15 }
            ]
        },
        {
            subjectId: 2,
            subjectName: "Ngữ văn",
            courses: [
                { courseId: 4, courseName: "Ngữ văn lớp 6", studentCount: 110, lectureCount: 12 },
                { courseId: 5, courseName: "Ngữ văn lớp 7", studentCount: 95, lectureCount: 14 }
            ]
        },
        {
            subjectId: 3,
            subjectName: "Lập trình",
            courses: [
                { courseId: 6, courseName: "Python cơ bản", studentCount: 150, lectureCount: 20 },
                { courseId: 7, courseName: "Web Fullstack", studentCount: 130, lectureCount: 25 },
                { courseId: 8, courseName: "Machine Learning", studentCount: 80, lectureCount: 18 }
            ]
        }
    ];
    
    // Hiển thị dữ liệu mẫu
    displaySubjectsWithCourses(sampleData);
}

// Khởi tạo Particles.js
document.addEventListener('DOMContentLoaded', function() {
    // Cấu hình particles
    particlesJS('particles-container', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#00f0ff"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": true,
                    "speed": 2,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#00f0ff",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": true,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 0.5
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });

    // Mở khối đầu tiên
    const firstLevel = document.querySelector('.cyber-level-header');
    toggleLevel(firstLevel);
});

// Hiệu ứng hover cho card
document.querySelectorAll('.cyber-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Hiệu ứng cho các tab
document.querySelectorAll('.cyber-tab').forEach(tab => {
    tab.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
            this.style.transform = 'translateY(-3px)';
        }
    });
    
    tab.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

