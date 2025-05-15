import os
import json
import mysql.connector
from datetime import datetime, timedelta
import glob
import logging
import io
import sys
import re
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
import fitz

# Đảm bảo thư mục logs tồn tại
os.makedirs('alerts/logs', exist_ok=True)

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='alerts/logs/rule_alerts.log',
    encoding='utf-8'  # Thêm hỗ trợ UTF-8
)

class RuleBasedAlerts:
    def __init__(self, db_config):
        """
        Khởi tạo module cảnh báo học tập
        
        Args:
            db_config (dict): Cấu hình kết nối database
        """
        self.db_config = db_config
        self.db_connection = None
        self.cursor = None
        self.log_path = "alerts/logs"

    def connect_db(self):
        """Kết nối đến MySQL database"""
        try:
            self.db_connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.db_connection.cursor(dictionary=True)
            return True
        except Exception as e:
            logging.error(f"Lỗi kết nối đến database: {str(e)}")
            return False
    
    def close_db_connection(self):
        """Đóng kết nối đến database"""
        if self.cursor:
            self.cursor.close()
        if self.db_connection:
            self.db_connection.close()
    
    def get_study_data(self):
        """Lấy dữ liệu học tập từ bảng studytracking, lecture và users"""
        query = """
        SELECT 
            st.user_id, 
            st.lecture_id, 
            st.progress, 
            st.status, 
            st.start_date, 
            st.end_date,
            l.title as lecture_name,
            l.maxhours,
            l.content,
            l.type as lecture_type,
            l.attachment, 
            u.username,
            u.full_name,
            u.email
        FROM 
            studytracking st
        JOIN 
            lecture l ON st.lecture_id = l.lecture_id
        JOIN 
            users u ON st.user_id = u.user_id
        WHERE 
            st.start_date IS NOT NULL
        """
        try:
            self.cursor.execute(query)
            return self.cursor.fetchall()
        except Exception as e:
            logging.error(f"Lỗi khi lấy dữ liệu học tập: {str(e)}")
            return []
    
    def get_time_spent(self, user_id, lecture_id):
        """
        Tính toán tổng thời gian học từ file JSON
        
        Args:
            user_id (int): ID của người dùng
            lecture_id (int): ID của bài giảng
            
        Returns:
            float: Tổng số giờ đã học
        """
        try:
            file_path = os.path.join(self.log_path, f"lecture_{lecture_id}_user_{user_id}.json")
            if not os.path.exists(file_path):
                return 0
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            total_seconds = 0
            for session in data.get('sessions', []):
                start_time = datetime.fromisoformat(session['start'].replace('Z', '+00:00'))
                end_time = datetime.fromisoformat(session['end'].replace('Z', '+00:00'))
                session_seconds = (end_time - start_time).total_seconds()
                total_seconds += session_seconds
            
            # Chuyển đổi từ giây sang giờ
            return total_seconds / 3600
        except Exception as e:
            logging.error(f"Lỗi khi tính thời gian học: {str(e)}")
            return 0
    
    def send_notification(self, user_id, lecture_name, message, rule_reason=None):
        """
        Gửi thông báo cho người dùng
        
        Args:
            user_id (int): ID của người dùng
            lecture_name (str): Tên bài giảng
            message (str): Nội dung thông báo
            rule_reason (str, optional): Lý do kỹ thuật cho cảnh báo
        """
        try:
            content = f"{lecture_name}: {message}"
            query = "INSERT INTO notification (user_id, content) VALUES (%s, %s)"
            self.cursor.execute(query, (user_id, content))
            self.db_connection.commit()
            
            # Log cả thông tin và lý do
            base_log = f"Đã gửi thông báo cho user {user_id}: {content}"
            if rule_reason:
                logging.info(f"{base_log} | Lý do: {rule_reason}")
            else:
                logging.info(base_log)
                
            return True
        except Exception as e:
            logging.error(f"Lỗi khi gửi thông báo: {str(e)}")
            return False
    def get_pdf_page_count(self, file_path):
        try:
            with fitz.open(file_path) as pdf:
                return len(pdf)
        except Exception as e:
            logging.error(f"Lỗi khi đọc số trang PDF: {e}")
        return 1

    def get_lecture_page_count(self, attachment_name, fallback_content=None):
        """
        Tính số trang bài giảng từ file PDF thật dựa trên tên file attachment

        Args:
            attachment_name (str): Tên file gốc (.docx/.pptx)
            fallback_content (str): fallback nếu không có file PDF

        Returns:
            int: Số trang
        """
        try:
            if not attachment_name:
                raise ValueError("Không có tên file đính kèm.")
        
            base_name = os.path.splitext(attachment_name)[0]  # bỏ .docx/.pptx
            pdf_path = os.path.join("AI_Training/uploads", base_name + ".pdf")
            
            if os.path.exists(pdf_path):
                return self.get_pdf_page_count(pdf_path)
            
            if fallback_content:
                return max(1, len(fallback_content) // 3000)
            return 1
        except Exception as e:
            logging.error(f"Lỗi xác định số trang từ file PDF: {e}")
            return 1

    
    def get_max_days_from_pages(self, page_count):
        """
        Lấy số ngày tối đa để hoàn thành dựa vào số trang
        
        Args:
            page_count (int): Số trang PDF
            
        Returns:
            int: Số ngày tối đa
        """
        if page_count <= 40:
            return 3
        elif page_count <= 70:
            return 4
        elif page_count <= 100:
            return 5
        else:
            return 7
    
    def find_related_lectures(self, keyword):
        """
        Tìm bài giảng liên quan đến từ khóa
        
        Args:
            keyword (str): Từ khóa cần tìm
            
        Returns:
            list: Danh sách ID bài giảng liên quan
        """
        query = """
        SELECT 
            lecture_id, title
        FROM 
            lecture
        WHERE 
            type = 'baigiang' AND 
            (title LIKE %s OR content LIKE %s)
        LIMIT 3
        """
        
        search_pattern = f"%{keyword}%"
        try:
            self.cursor.execute(query, (search_pattern, search_pattern))
            return self.cursor.fetchall()
        except Exception as e:
            logging.error(f"Lỗi khi tìm bài giảng liên quan: {str(e)}")
            return []
    
    def process_test_alerts(self, user_id, lecture_id, lecture_name, lecture_type, progress, status):
        """
        Xử lý cảnh báo cho bài kiểm tra/thi
        
        Args:
            user_id (int): ID của người dùng
            lecture_id (int): ID của bài kiểm tra/thi
            lecture_name (str): Tên bài kiểm tra/thi
            lecture_type (str): Loại bài (baikiemtra hoặc baithi)
            progress (float): Tiến độ học tập (%)
            status (str): Trạng thái học tập
        """
        # Log thông tin cơ bản
        logging.info(f"Phân tích cảnh báo kiểm tra/thi cho user {user_id}, lecture {lecture_id} - {lecture_name}")
        logging.info(f"  - Progress: {progress}%, Status: {status}")
        
        # Thiết lập mô phỏng score dựa trên progress
        estimated_score = (progress / 100) * 10  # Giả định: progress 100% = điểm 10
        
        # Cảnh báo 1: Điểm thấp (dựa trên progress)
        if estimated_score < 5.0 and status == 'hoanthanh':
            reason = f"Ước tính điểm: {estimated_score:.2f} < 5.0"
            self.send_notification(user_id, lecture_name,
                                 f"Bạn có thể chưa nắm vững kiến thức trong bài {lecture_name}. Hãy xem lại kiến thức cơ bản.",
                                 reason)
        
        # Cảnh báo 2: Gợi ý bài giảng liên quan (dựa trên nội dung bài kiểm tra)
        if progress < 70 or status == 'hoanthanh':
            # Lấy các từ khóa từ nội dung bài kiểm tra
            query = """
            SELECT 
                title, content
            FROM 
                lecture
            WHERE 
                lecture_id = %s
            """
            
            try:
                self.cursor.execute(query, (lecture_id,))
                result = self.cursor.fetchone()
                
                if result and 'content' in result:
                    content = result['content']
                    
                    # Trích xuất từ khóa từ nội dung bài kiểm tra
                    keywords = self.extract_keywords_from_content(content)
                    
                    for keyword in keywords[:2]:  # Chỉ sử dụng 2 từ khóa hàng đầu
                        related_lectures = self.find_related_lectures(keyword)
                        
                        if related_lectures:
                            related_titles = ", ".join([lecture["title"] for lecture in related_lectures])
                            reason = f"Từ khóa: '{keyword}' tìm thấy trong các bài giảng: {related_titles}"
                            self.send_notification(user_id, lecture_name,
                                                 f"Bạn nên xem lại các bài giảng về '{keyword}' để cải thiện kết quả.",
                                                 reason)
            except Exception as e:
                logging.error(f"Lỗi khi tìm bài giảng liên quan: {str(e)}")
    
    def extract_keywords_from_content(self, content):
        """
        Trích xuất từ khóa từ nội dung bài giảng/kiểm tra
        
        Args:
            content (str): Nội dung bài giảng/kiểm tra
            
        Returns:
            list: Danh sách từ khóa
        """
        try:
            # Xử lý nội dung để trích xuất từ khóa
            if not content or len(content) < 10:
                return []
                
            # Chia nội dung thành các đoạn
            paragraphs = content.split('\n')
            paragraphs = [p for p in paragraphs if len(p) > 20]  # Chỉ giữ đoạn có ý nghĩa
            
            if not paragraphs:
                return []
                
            # Sử dụng TF-IDF để trích xuất từ khóa
            try:
                vectorizer = TfidfVectorizer(
                    max_df=0.8, 
                    min_df=1, 
                    max_features=10,
                    stop_words=['và', 'của', 'là', 'cho', 'các', 'có', 'đến', 'trong', 'từ', 'với']
                )
                
                tfidf_matrix = vectorizer.fit_transform(paragraphs)
                feature_names = vectorizer.get_feature_names_out()
                
                # Tính tổng trọng số TF-IDF cho mỗi từ
                tfidf_sums = tfidf_matrix.sum(axis=0).A1
                
                # Sắp xếp từ khóa theo trọng số TF-IDF
                keywords = [(feature_names[i], tfidf_sums[i]) for i in range(len(feature_names))]
                keywords.sort(key=lambda x: x[1], reverse=True)
                
                # Lấy top từ khóa
                top_keywords = [keyword for keyword, _ in keywords[:5]]
                
                return top_keywords
            except Exception:
                # Fallback nếu không thể sử dụng TF-IDF
                # Chia nội dung thành từ và lấy các từ dài hơn 5 ký tự
                words = content.split()
                words = [w for w in words if len(w) > 5]
                word_count = Counter(words)
                top_words = [word for word, _ in word_count.most_common(5)]
                return top_words
                
        except Exception as e:
            logging.error(f"Lỗi khi trích xuất từ khóa từ nội dung: {str(e)}")
            return []
    
    def analyze_alert_rules(self):
        """Phân tích và gửi cảnh báo theo các quy tắc"""
        if not self.connect_db():
            return False
        
        try:
            study_data = self.get_study_data()
            current_date = datetime.now().date()
            
            for record in study_data:
                user_id = record['user_id']
                lecture_id = record['lecture_id']
                progress = float(record['progress']) if record['progress'] else 0
                status = record['status']
                start_date = record['start_date']
                lecture_name = record['lecture_name']
                max_hours = float(record['maxhours']) if record['maxhours'] else 0
                attachment = record.get('attachment', '')
                lecture_type = record['lecture_type']
                content = record.get('content', '')
                # Xử lý riêng cho bài kiểm tra và bài thi
                if lecture_type in ['baikiemtra', 'baithi']:
                    self.process_test_alerts(user_id, lecture_id, lecture_name, lecture_type, progress, status)
                    continue
                
                # Xử lý cho bài giảng thông thường
                # Tính toán thời gian học thực tế
                time_spent = self.get_time_spent(user_id, lecture_id)
                page_count = self.get_lecture_page_count(attachment, fallback_content=content)
                max_days = self.get_max_days_from_pages(page_count)
                # Log thông tin cơ bản
                logging.info(f"Kiểm tra cảnh báo cho user {user_id}, lecture {lecture_id} - {lecture_name}")
                logging.info(f"  - Progress: {progress}%, Status: {status}, MaxHours: {max_hours}h, Time Spent: {time_spent:.2f}h")
                if start_date:
                    days_since_start = (current_date - start_date).days
                    logging.info(f"  - Ngày bắt đầu: {start_date}, Số ngày đã trôi qua: {days_since_start}")
                
                # Cảnh báo 1: Chưa bắt đầu học sau 3 ngày đăng ký
                if progress == 0 and (current_date - start_date).days >= 3:
                    reason = f"Progress = {progress}%, Ngày hiện tại - ngày bắt đầu = {(current_date - start_date).days} ngày >= 3"
                    self.send_notification(user_id, lecture_name, 
                                         "Bạn đã đăng ký khóa học nhưng chưa bắt đầu học.",
                                         reason)
                
                # Cảnh báo 2: Học quá chậm (cập nhật điều kiện)
                days_since_start = (current_date - start_date).days
                expected_hours_per_day = max_hours / max_days  # max_days lấy theo số trang
                actual_hours_per_day = time_spent / max(1, days_since_start)

                    # Nếu học < 60% tốc độ dự kiến
                if actual_hours_per_day < expected_hours_per_day * 0.6 and progress < 100:
                    reason = f"Tốc độ học {actual_hours_per_day:.2f}h/ngày < 60% tốc độ đề xuất ({expected_hours_per_day:.2f}h/ngày)"
                    self.send_notification(user_id, lecture_name,
                                        f"Tiến độ học của bạn đang học ({actual_hours_per_day:.2f}h/ngày) chậm hơn đề xuất ({expected_hours_per_day:.2f}h/ngày). Hãy điều chỉnh để hoàn thành đúng hạn.",
                                        reason)

                # Cảnh báo 3: Học quá thời gian đề xuất
                if max_hours > 0 and time_spent > max_hours * 1.2:
                    reason = f"time_spent ({time_spent:.2f}h) > MaxHours*1.2 ({max_hours*1.2:.2f}h)"
                    self.send_notification(user_id, lecture_name,
                                         "Bạn đã học vượt thời gian khuyến nghị. Cần điều chỉnh lại thói quen học.",
                                         reason)
                
                # Cảnh báo 4: Học nhiều mà chưa hoàn thành
                if max_hours > 0 and time_spent > max_hours and progress < 100:
                    reason = f"time_spent ({time_spent:.2f}h) > MaxHours ({max_hours:.2f}h) và progress ({progress}%) < 100%"
                    self.send_notification(user_id, lecture_name,
                                         "Bạn học nhiều nhưng vẫn chưa hoàn thành bài học.",
                                         reason)
                
                # Cảnh báo 5: Học trễ tiến độ theo số trang
                if (current_date - start_date).days > max_days and progress < 80:
                    reason = f"Số trang ước tính: {page_count}, Số ngày tối đa: {max_days}, " \
                             f"Ngày đã học: {(current_date - start_date).days}, Progress: {progress}% < 80%"
                    self.send_notification(user_id, lecture_name,
                                         "Bạn đang học khá chậm, hãy đẩy nhanh tiến độ.",
                                         reason)
                
                # Cảnh báo 6: Học quá nhanh mà vẫn hoàn thành
                if status == 'hoanthanh' and max_hours > 0 and time_spent < max_hours * 0.5:
                    reason = f"status = {status}, time_spent ({time_spent:.2f}h) < MaxHours*0.5 ({max_hours*0.5:.2f}h)"
                    self.send_notification(user_id, lecture_name,
                                         "Bạn hoàn thành bài quá nhanh. Hãy chắc chắn bạn đã hiểu kỹ nội dung.",
                                         reason)
            
            return True
        except Exception as e:
            logging.error(f"Lỗi khi phân tích và gửi cảnh báo: {str(e)}")
            return False
        finally:
            self.close_db_connection()


# Hàm chính để chạy module
def run_alerts(db_config=None):
    """
    Chạy công cụ cảnh báo học tập
    
    Args:
        db_config (dict, optional): Cấu hình kết nối database
    """
    if not db_config:
        # Cấu hình mặc định nếu không được cung cấp
        db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'virtualadvisor'
        }
    
    alert_engine = RuleBasedAlerts(db_config)
    result = alert_engine.analyze_alert_rules()
    return result


if __name__ == "__main__":
    run_alerts() 