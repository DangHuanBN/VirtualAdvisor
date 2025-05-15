$(document).ready(function() {
    // Khởi tạo DataTable cho bảng sao lưu
    $('#backupTable').DataTable({
        language: {
            url: '/admin/assets/vi.json'
        },
        responsive: true,
        order: [[0, 'desc']]
    });

    // Hiển thị modal sao lưu khi nhấn nút sao lưu
    $('#createBackupBtn').on('click', function() {
        $('#backupModal').modal('show');
    });

    // Xử lý checkbox lên lịch sao lưu
    $('#backupSchedule').on('change', function() {
        if ($(this).is(':checked')) {
            $('#backupScheduleInterval').prop('disabled', false);
        } else {
            $('#backupScheduleInterval').prop('disabled', true);
        }
    });

    // Xử lý khi nhấn nút bắt đầu sao lưu
    $('#startBackupBtn').on('click', function() {
        // Lấy thông tin sao lưu từ form
        const backupName = $('#backupName').val() || 'backup_' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const backupUsers = $('#backupUsers').is(':checked');
        const backupCourses = $('#backupCourses').is(':checked');
        const backupStudentData = $('#backupStudentData').is(':checked');
        const backupAIData = $('#backupAIData').is(':checked');
        const compression = $('#backupCompression').is(':checked');
        const encryption = $('#backupEncryption').is(':checked');

        // Validate
        if (!backupUsers && !backupCourses && !backupStudentData && !backupAIData) {
            toastr.error('Vui lòng chọn ít nhất một loại dữ liệu để sao lưu');
            return;
        }

        // Đóng modal sao lưu
        $('#backupModal').modal('hide');

        // Hiển thị thanh tiến độ
        showProgressBar();

        // Giả lập quá trình sao lưu
        simulateBackup(backupName, {
            users: backupUsers,
            courses: backupCourses,
            studentData: backupStudentData,
            aiData: backupAIData,
            compression: compression,
            encryption: encryption
        });
    });

    // Xử lý khi nhấn nút tải xuống
    $('#downloadBackupBtn').on('click', function() {
        const backupName = $('#resultBackupName').text();
        
        // Tạo URL giả lập cho việc tải file
        const downloadUrl = '/api/backup/download/' + backupName.replace(/\s/g, '');
        
        // Tạo một thẻ a ẩn và trigger sự kiện click để tải xuống
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', backupName + '.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toastr.success('Đang tải xuống bản sao lưu...');
    });

    // Xử lý khi nhấn nút khôi phục dữ liệu
    $('.restore-backup-btn').on('click', function() {
        const backupId = $(this).data('id');
        const backupName = $(this).data('name');
        
        if (confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu từ bản sao lưu "${backupName}"?\nHệ thống sẽ bị gián đoạn trong quá trình khôi phục.`)) {
            showProgressBar();
            simulateRestore(backupId, backupName);
        }
    });

    // Xử lý khi nhấn nút xóa
    $('.delete-backup-btn').on('click', function() {
        const backupId = $(this).data('id');
        const backupName = $(this).data('name');
        
        if (confirm(`Bạn có chắc chắn muốn xóa bản sao lưu "${backupName}"?`)) {
            // Gọi API xóa backup
            $.ajax({
                url: '/api/backup/' + backupId,
                type: 'DELETE',
                success: function(result) {
                    toastr.success('Đã xóa bản sao lưu thành công!');
                    // Reload trang sau 1 giây
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                },
                error: function(err) {
                    toastr.error('Lỗi khi xóa bản sao lưu: ' + err.responseJSON.message);
                }
            });
        }
    });
});

// Hiển thị thanh tiến độ
function showProgressBar() {
    const progressBar = $('#progress-container');
    progressBar.css('display', 'flex');
    $('.progress-bar').css('width', '0%');
}

// Ẩn thanh tiến độ
function hideProgressBar() {
    const progressBar = $('#progress-container');
    progressBar.css('display', 'none');
}

// Cập nhật thanh tiến độ
function updateProgressBar(percent) {
    $('.progress-bar').css('width', percent + '%');
}

// Giả lập quá trình sao lưu dữ liệu
function simulateBackup(backupName, options) {
    // Tạo các bước sao lưu
    const steps = [];
    
    if (options.users) steps.push('Đang sao lưu dữ liệu người dùng...');
    if (options.courses) steps.push('Đang sao lưu dữ liệu khóa học...');
    if (options.studentData) steps.push('Đang sao lưu dữ liệu sinh viên...');
    if (options.aiData) steps.push('Đang sao lưu dữ liệu AI...');
    if (options.compression) steps.push('Đang nén dữ liệu...');
    if (options.encryption) steps.push('Đang mã hóa dữ liệu...');
    
    // Thêm bước hoàn thiện
    steps.push('Đang hoàn thiện bản sao lưu...');
    
    let currentStep = 0;
    const stepProgress = 100 / steps.length;
    
    // Hiển thị thông báo bắt đầu
    toastr.info(steps[currentStep]);
    
    // Giả lập tiến trình sao lưu
    const backupInterval = setInterval(function() {
        currentStep++;
        const progress = Math.min(stepProgress * currentStep, 100);
        
        // Cập nhật thanh tiến độ
        updateProgressBar(progress);
        
        if (currentStep < steps.length) {
            // Hiển thị thông báo cho bước tiếp theo
            toastr.info(steps[currentStep]);
        } else {
            // Hoàn thành quá trình sao lưu
            clearInterval(backupInterval);
            
            // Ẩn thanh tiến độ sau 0.5 giây
            setTimeout(function() {
                hideProgressBar();
                
                // Hiển thị kết quả sao lưu
                showBackupResult(backupName, options);
            }, 500);
        }
    }, 1500); // Mỗi bước kéo dài 1.5 giây
}

// Giả lập quá trình khôi phục dữ liệu
function simulateRestore(backupId, backupName) {
    let progress = 0;
    
    // Hiển thị thông báo bắt đầu
    toastr.info('Đang chuẩn bị khôi phục dữ liệu từ ' + backupName);
    
    // Giả lập tiến trình khôi phục
    const restoreInterval = setInterval(function() {
        progress += 10;
        
        // Cập nhật thanh tiến độ
        updateProgressBar(Math.min(progress, 100));
        
        if (progress >= 100) {
            // Hoàn thành quá trình khôi phục
            clearInterval(restoreInterval);
            
            // Ẩn thanh tiến độ sau 1 giây
            setTimeout(function() {
                hideProgressBar();
                toastr.success('Khôi phục dữ liệu thành công!');
                
                // Reload trang sau 2 giây
                setTimeout(function() {
                    location.reload();
                }, 2000);
            }, 1000);
        } else {
            // Hiển thị các thông báo tiến trình
            if (progress === 20) {
                toastr.info('Đang khôi phục cơ sở dữ liệu...');
            } else if (progress === 50) {
                toastr.info('Đang áp dụng các thay đổi...');
            } else if (progress === 80) {
                toastr.info('Đang hoàn thiện quá trình khôi phục...');
            }
        }
    }, 1000); // Mỗi bước kéo dài 1 giây
}

// Hiển thị kết quả sao lưu
function showBackupResult(backupName, options) {
    // Tạo thông tin chi tiết về bản sao lưu
    const currentTime = new Date().toLocaleString('vi-VN');
    const fileSize = calculateBackupSize(options);
    const location = '/backup/' + (options.encryption ? 'secured/' : 'standard/');
    
    // Cập nhật thông tin trong modal kết quả
    $('#resultBackupName').text(backupName);
    $('#resultBackupTime').text(currentTime);
    $('#resultBackupSize').text(fileSize);
    $('#resultBackupLocation').text(location);
    
    // Hiển thị modal kết quả
    $('#backupResultModal').modal('show');
    
    // Thêm bản sao lưu mới vào bảng (giả lập)
    addBackupToTable({
        id: generateRandomId(),
        name: backupName,
        time: currentTime,
        size: fileSize,
        location: location
    });
}

// Tính toán kích thước bản sao lưu (giả lập)
function calculateBackupSize(options) {
    let size = 0;
    
    if (options.users) size += Math.random() * 10 + 5; // 5-15 MB
    if (options.courses) size += Math.random() * 50 + 20; // 20-70 MB
    if (options.studentData) size += Math.random() * 100 + 50; // 50-150 MB
    if (options.aiData) size += Math.random() * 200 + 100; // 100-300 MB
    
    // Nếu có nén, giảm kích thước xuống 40-60%
    if (options.compression) {
        size *= (Math.random() * 0.2 + 0.4);
    }
    
    // Làm tròn đến 1 chữ số thập phân
    size = Math.round(size * 10) / 10;
    
    return size + ' MB';
}

// Tạo ID ngẫu nhiên
function generateRandomId() {
    return 'backup_' + Math.random().toString(36).substr(2, 9);
}

// Thêm bản sao lưu mới vào bảng
function addBackupToTable(backup) {
    const table = $('#backupTable').DataTable();
    
    // Tạo các nút hành động
    const actions = `
        <button class="btn btn-sm btn-info restore-backup-btn" data-id="${backup.id}" data-name="${backup.name}">
            <i class="fas fa-undo-alt"></i> Khôi phục
        </button>
        <button class="btn btn-sm btn-danger delete-backup-btn ml-1" data-id="${backup.id}" data-name="${backup.name}">
            <i class="fas fa-trash"></i> Xóa
        </button>
    `;
    
    // Thêm hàng mới vào bảng
    table.row.add([
        backup.name,
        backup.time,
        backup.size,
        backup.location,
        actions
    ]).draw(false);
    
    // Khởi tạo lại sự kiện cho các nút mới
    $('.restore-backup-btn').off('click').on('click', function() {
        const backupId = $(this).data('id');
        const backupName = $(this).data('name');
        
        if (confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu từ bản sao lưu "${backupName}"?\nHệ thống sẽ bị gián đoạn trong quá trình khôi phục.`)) {
            showProgressBar();
            simulateRestore(backupId, backupName);
        }
    });
    
    $('.delete-backup-btn').off('click').on('click', function() {
        const backupId = $(this).data('id');
        const backupName = $(this).data('name');
        
        if (confirm(`Bạn có chắc chắn muốn xóa bản sao lưu "${backupName}"?`)) {
            // Gọi API xóa backup
            $.ajax({
                url: '/api/backup/' + backupId,
                type: 'DELETE',
                success: function(result) {
                    toastr.success('Đã xóa bản sao lưu thành công!');
                    // Reload trang sau 1 giây
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                },
                error: function(err) {
                    toastr.error('Lỗi khi xóa bản sao lưu: ' + (err.responseJSON ? err.responseJSON.message : 'Không xác định'));
                }
            });
        }
    });
} 