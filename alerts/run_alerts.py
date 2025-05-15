#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script chạy kiểm tra cảnh báo học tập thủ công.
Sử dụng: python run_alerts.py
"""

import argparse
import logging
import sys
import os
import io

# Cấu hình stdout sử dụng UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Đảm bảo thư mục logs tồn tại
os.makedirs('alerts/logs', exist_ok=True)

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('alerts/logs/manual_run.log', encoding='utf-8'),
        logging.StreamHandler()  # Đã cấu hình stdout ở trên
    ]
)

def main():
    parser = argparse.ArgumentParser(description='Công cụ gửi cảnh báo học tập')
    
    parser.add_argument('--host', default='localhost', help='Database host')
    parser.add_argument('--user', default='root', help='Database user')
    parser.add_argument('--password', default='', help='Database password')
    parser.add_argument('--database', default='virtualadvisor', help='Database name')
    
    args = parser.parse_args()
    
    # Import module chính
    try:
        from rule_based_alerts import run_alerts
        
        # Cấu hình kết nối database
        db_config = {
            'host': args.host,
            'user': args.user,
            'password': args.password,
            'database': args.database
        }
        
        logging.info("Bắt đầu kiểm tra cảnh báo học tập...")
        
        # Chạy kiểm tra cảnh báo
        result = run_alerts(db_config)
        
        if result:
            logging.info("Kiểm tra cảnh báo học tập thành công!")
        else:
            logging.error("Kiểm tra cảnh báo học tập thất bại!")
            sys.exit(1)
            
    except ImportError:
        logging.error("Không thể import module rule_based_alerts. Kiểm tra đường dẫn và cài đặt.")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Lỗi không xác định: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 