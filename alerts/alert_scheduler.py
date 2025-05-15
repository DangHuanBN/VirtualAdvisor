import schedule
import time
import logging
from rule_based_alerts import run_alerts
import os
import io
import sys

# Cấu hình stdout sử dụng UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Đảm bảo thư mục logs tồn tại
os.makedirs('alerts/logs', exist_ok=True)

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='alerts/logs/scheduler.log',
    encoding='utf-8'  # Thêm hỗ trợ UTF-8
)

def job():
    """Hàm chạy công việc kiểm tra cảnh báo"""
    logging.info("Bắt đầu kiểm tra cảnh báo học tập")
    try:
        result = run_alerts()
        if result:
            logging.info("Kiểm tra cảnh báo học tập thành công")
        else:
            logging.error("Kiểm tra cảnh báo học tập thất bại")
    except Exception as e:
        logging.error(f"Lỗi khi chạy kiểm tra cảnh báo: {str(e)}")

def run_scheduler():
    """Khởi động lịch trình kiểm tra cảnh báo"""
    # Chạy kiểm tra cảnh báo mỗi 12 giờ
    schedule.every(12).hours.do(job)
    
    # Chạy kiểm tra cảnh báo ngay lập tức khi khởi động
    job()
    
    logging.info("Đã khởi động lịch trình kiểm tra cảnh báo")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Kiểm tra mỗi phút

if __name__ == "__main__":
    run_scheduler() 