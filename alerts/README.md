# Module Cảnh Báo Học Tập

Module này giúp phân tích và gửi cảnh báo học tập cho sinh viên dựa trên các quy tắc (rule-based analysis).

## Cấu trúc thư mục

```
alerts/
├── rule_based_alerts.py  # Module xử lý cảnh báo chính
├── alert_scheduler.py    # Lên lịch kiểm tra cảnh báo định kỳ
├── requirements.txt      # Các thư viện yêu cầu
├── logs/                 # Thư mục chứa logs và dữ liệu thời gian học
│   ├── rule_alerts.log   # Log của module xử lý cảnh báo
│   ├── scheduler.log     # Log của scheduler
│   └── lecture_*_user_*.json  # Dữ liệu thời gian học của từng sinh viên
└── README.md             # Tài liệu hướng dẫn
```

## Cài đặt

1. Cài đặt các thư viện yêu cầu:

```bash
pip install -r alerts/requirements.txt
```

## Cách sử dụng

### Chạy kiểm tra cảnh báo thủ công

```python
from alerts.rule_based_alerts import run_alerts

# Cấu hình kết nối database (tùy chỉnh tùy theo môi trường)
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',
    'database': 'virtualadvisor'
}

# Chạy kiểm tra cảnh báo
run_alerts(db_config)
```

### Lên lịch tự động kiểm tra cảnh báo

```bash
# Chạy scheduler (kiểm tra mỗi 12 giờ)
python alerts/alert_scheduler.py
```

## Các quy tắc cảnh báo

Module này theo dõi và gửi các cảnh báo sau:

### Với bài giảng thông thường:
1. Chưa bắt đầu học sau 3 ngày đăng ký
2. Học quá chậm so với thời lượng đề xuất
3. Học quá thời gian đề xuất
4. Học nhiều mà chưa hoàn thành
5. Học trễ tiến độ theo số trang
6. Học quá nhanh mà vẫn hoàn thành

### Với bài kiểm tra và bài thi:
1. Điểm thấp (ước tính từ tiến độ)
2. Hoàn thành quá nhanh (trong cùng một ngày)
3. Gợi ý bài giảng liên quan (dựa trên nội dung bài kiểm tra)

## Cấu trúc dữ liệu thời gian học

Dữ liệu thời gian học được lưu trong thư mục `logs` với định dạng: `lecture_<lecture_id>_user_<user_id>.json`

Mỗi file JSON có cấu trúc:
```json
{
  "user_id": 12,
  "lecture_id": 57,
  "sessions": [
    {
      "start": "2025-05-02T23:00:26.821000+07:00",
      "end": "2025-05-02T23:27:27.526000+07:00"
    },
    ...
  ]
}
```

## Lưu ý

- Cần đảm bảo thư mục `logs` có quyền đọc/ghi
- Module sẽ tự động tạo các file log cần thiết
- Các thông báo sẽ được lưu vào bảng `notification` trong database 