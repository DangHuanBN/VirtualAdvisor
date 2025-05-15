document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra nếu đã đăng nhập thì chuyển hướng
    if (AuthAPI.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Lưu email giữa các bước
    let userEmail = '';
    let otpCode = '';
    
    // DOM Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    
    const emailForm = document.getElementById('emailForm');
    const verificationForm = document.getElementById('verificationForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    const emailError = document.getElementById('emailError');
    const codeError = document.getElementById('codeError');
    const passwordError = document.getElementById('passwordError');
    
    const countdownEl = document.getElementById('countdown');
    const resendCodeBtn = document.getElementById('resendCode');
    const goToLoginBtn = document.getElementById('goToLoginBtn');
    
    // Đếm ngược thời gian
    let countdownInterval;
    let remainingTime = 60;
    
    function startCountdown() {
        remainingTime = 60;
        updateCountdown();
        
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            remainingTime--;
            updateCountdown();
            
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                resendCodeBtn.classList.remove('disabled');
            }
        }, 1000);
    }
    
    function updateCountdown() {
        countdownEl.textContent = remainingTime;
    }
    
    // Chuyển đổi giữa các bước
    function showStep(step) {
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        step4.classList.remove('active');
        
        step.classList.add('active');
    }
    
    // Xử lý nhập mã OTP trong 6 ô riêng biệt
    const otpInputs = document.querySelectorAll('.verification-inputs input');
    otpInputs.forEach((input, index) => {
        // Tự động focus vào ô tiếp theo sau khi nhập
        input.addEventListener('input', (e) => {
            if (e.target.value !== '' && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            
            // Cập nhật OTP code
            updateOtpCode();
        });
        
        // Xử lý phím Backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
    
    function updateOtpCode() {
        otpCode = Array.from(otpInputs).map(input => input.value).join('');
    }
    
    // Bước 1: Gửi email để nhận mã OTP
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        emailError.textContent = '';
        
        if (!email) {
            emailError.textContent = 'Vui lòng nhập email';
            return;
        }
        
        try {
            // Disable form trong khi đang gửi
            document.getElementById('submitEmailBtn').disabled = true;
            document.getElementById('submitEmailBtn').textContent = 'Đang gửi...';
            
            // Gọi API quên mật khẩu
            console.log('Gọi API forgotPassword với email:', email);
            const response = await AuthAPI.forgotPassword(email);
            console.log('Phản hồi từ API forgotPassword:', response);
            
            if (response.success) {
                // Lưu email và chuyển sang bước tiếp theo
                userEmail = email;
                showStep(step2);
                startCountdown();
            } else {
                emailError.textContent = response.message || 'Không tìm thấy email trong hệ thống';
            }
        } catch (error) {
            emailError.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        } finally {
            // Bật lại form
            document.getElementById('submitEmailBtn').disabled = false;
            document.getElementById('submitEmailBtn').textContent = 'Gửi mã xác nhận';
        }
    });
    
    // Bước 2: Xác thực mã OTP
    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        updateOtpCode();
        codeError.textContent = '';
        
        if (otpCode.length !== 6) {
            codeError.textContent = 'Vui lòng nhập đủ 6 chữ số';
            return;
        }
        
        try {
            // Disable form trong khi đang xác thực
            document.getElementById('verifyCodeBtn').disabled = true;
            document.getElementById('verifyCodeBtn').textContent = 'Đang xác thực...';
            
            // Gọi API xác thực OTP
            const response = await AuthAPI.verifyOtp(userEmail, otpCode);
            
            if (response.success) {
                // Chuyển sang bước đặt lại mật khẩu
                showStep(step3);
            } else {
                codeError.textContent = response.message || 'Mã xác nhận không đúng';
            }
        } catch (error) {
            codeError.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        } finally {
            // Bật lại form
            document.getElementById('verifyCodeBtn').disabled = false;
            document.getElementById('verifyCodeBtn').textContent = 'Xác nhận';
        }
    });
    
    // Bước 3: Đặt lại mật khẩu
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        passwordError.textContent = '';
        
        // Kiểm tra mật khẩu
        if (!newPassword) {
            passwordError.textContent = 'Vui lòng nhập mật khẩu mới';
            return;
        }
        
        if (newPassword.length < 6) {
            passwordError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            passwordError.textContent = 'Mật khẩu xác nhận không khớp';
            return;
        }
        
        try {
            // Disable form trong khi đang đặt lại mật khẩu
            document.getElementById('resetPasswordBtn').disabled = true;
            document.getElementById('resetPasswordBtn').textContent = 'Đang xử lý...';
            
            // Gọi API đặt lại mật khẩu
            const response = await AuthAPI.resetPassword(userEmail, otpCode, newPassword, confirmPassword);
            
            if (response.success) {
                // Hiển thị thông báo thành công
                showStep(step4);
            } else {
                passwordError.textContent = response.message || 'Không thể đặt lại mật khẩu';
            }
        } catch (error) {
            passwordError.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        } finally {
            // Bật lại form
            document.getElementById('resetPasswordBtn').disabled = false;
            document.getElementById('resetPasswordBtn').textContent = 'Đặt lại mật khẩu';
        }
    });
    
    // Xử lý nút gửi lại mã
    resendCodeBtn.addEventListener('click', async () => {
        if (resendCodeBtn.classList.contains('disabled')) {
            return;
        }
        
        codeError.textContent = '';
        resendCodeBtn.classList.add('disabled');
        
        try {
            // Gọi lại API quên mật khẩu để nhận mã OTP mới
            const response = await AuthAPI.forgotPassword(userEmail);
            
            if (response.success) {
                // Reset countdown
                startCountdown();
                
                // Reset các ô input
                otpInputs.forEach(input => {
                    input.value = '';
                });
                otpInputs[0].focus();
            } else {
                codeError.textContent = response.message || 'Không thể gửi lại mã xác nhận';
            }
        } catch (error) {
            codeError.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        }
    });
    
    // Chuyển đến trang đăng nhập
    goToLoginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}); 