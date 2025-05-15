import os
import json
import sys
import mysql.connector
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple
import pickle
import re

# Cấu hình đầu ra utf-8 để hiển thị tiếng Việt
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Cấu hình kết nối database
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "virtualadvisor"
}

def connect_to_db():
    """Tạo kết nối đến cơ sở dữ liệu MySQL"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        return None

def load_test_json(lecture_id: int) -> Dict[str, Any]:
    """
    Tải file JSON đề bài từ thư mục AI_Training/json
    
    Args:
        lecture_id: ID của bài kiểm tra hoặc bài thi
        
    Returns:
        Dict chứa thông tin đề bài hoặc None nếu không tìm thấy
    """
    json_path = Path(f"../AI_Training/json/test_lecture_{lecture_id}.json")
    if not json_path.exists():
        # Thử lại với đường dẫn tuyệt đối
        base_dir = Path(__file__).resolve().parent.parent
        json_path = base_dir / f"AI_Training/json/test_lecture_{lecture_id}.json"
    
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        return None

def load_answers_json(user_id: int, lecture_id: int) -> Tuple[Dict[str, str], float]:
    """
    Tải file JSON câu trả lời của sinh viên từ thư mục AI_Training/json/answers
    
    Args:
        user_id: ID của sinh viên
        lecture_id: ID của bài kiểm tra hoặc bài thi
        
    Returns:
        Tuple chứa (câu trả lời của sinh viên, điểm số)
    """
    filename = f"user_{user_id}_lecture_{lecture_id}.json"
    json_path = Path(f"../AI_Training/json/answers/{filename}")
    
    if not json_path.exists():
        # Thử lại với đường dẫn tuyệt đối
        base_dir = Path(__file__).resolve().parent.parent
        json_path = base_dir / f"AI_Training/json/answers/{filename}"
    
    try:
        if json_path.exists():
            with open(json_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
                # Trả về phần answers từ file json và điểm số
                answers = data.get("answers", {})
                score = data.get("score", 0)
                return answers, score * 10  # Chuyển score sang thang điểm 100
        return {}, 0
    except Exception as e:
        return {}, 0

def get_wrong_keywords(test_data: Dict[str, Any], answers: Dict[str, str]) -> List[str]:
    """
    Tạo danh sách từ khóa từ các câu hỏi mà sinh viên trả lời sai
    
    Args:
        test_data: Dữ liệu đề bài từ file JSON
        answers: Dict chứa câu trả lời của sinh viên, dạng {"0": "A", "1": "B", ...}
        
    Returns:
        Danh sách các từ khóa từ câu hỏi sai
    """
    wrong_keywords = []
    questions = test_data.get("questions", [])
    
    for idx, question_data in enumerate(questions):
        student_answer = answers.get(str(idx))
        correct_answer = question_data.get("correct")
        
        # Nếu sinh viên trả lời sai hoặc không trả lời
        if student_answer != correct_answer:
            question_text = question_data.get("question", "")
            
            # Trích xuất từ khóa từ câu hỏi (lấy nhiều từ khóa hơn)
            # Phương pháp 1: Lấy một số từ đầu tiên
            keyword1 = question_text[:15].strip()
            
            # Phương pháp 2: Tách từ khóa chính
            words = question_text.split()
            keyword2 = " ".join(words[:3]) if len(words) >= 3 else question_text
            
            # Phương pháp 3: Lấy sau dấu hỏi chấm, dấu phẩy, v.v.
            match = re.search(r'(?:là|gì|nào|mấy)\s+(.*?)(?:\?|\.|,|$)', question_text)
            keyword3 = match.group(1).strip() if match else ""
            
            # Thêm các từ khóa có ý nghĩa
            if len(keyword1) >= 3:
                wrong_keywords.append(keyword1)
            
            if len(keyword2) >= 3 and keyword2 != keyword1:
                wrong_keywords.append(keyword2)
            
            if len(keyword3) >= 3 and keyword3 not in [keyword1, keyword2]:
                wrong_keywords.append(keyword3)
    
    return wrong_keywords

def find_lectures_in_vector_store(wrong_keywords: List[str]) -> List[int]:
    """
    Tìm kiếm các lecture_id trong vector_store dựa trên từ khóa
    
    Args:
        wrong_keywords: Danh sách từ khóa cần tìm
        
    Returns:
        Danh sách lecture_id liên quan
    """
    try:
        import sys
        from pathlib import Path
        
        # Thêm đường dẫn AI_Training vào sys.path
        base_dir = Path(__file__).resolve().parent.parent
        ai_training_path = base_dir / "AI_Training"
        if ai_training_path.exists() and ai_training_path not in sys.path:
            sys.path.append(str(ai_training_path))
        
        # Import vector_store
        try:
            import vector_store as vs
        except ImportError as e:
            return []
        
        # Tìm file .pkl trong vector_store
        vector_store_path = Path("../AI_Training/vector_store")
        if not vector_store_path.exists():
            base_dir = Path(__file__).resolve().parent.parent
            vector_store_path = base_dir / "AI_Training/vector_store"
        
        if not vector_store_path.exists():
            return []
        
        # Lấy danh sách file .pkl trong vector_store
        pkl_files = list(vector_store_path.glob("*.pkl"))
        
        if not pkl_files:
            return []
        
        # Sử dụng file .pkl đầu tiên
        vector_file = str(pkl_files[0])
        vector_file_name = Path(vector_file).name
        vector_file_base = Path(vector_file).stem  # Tên file không có đuôi
        
        # Kết hợp từ khóa thành một câu truy vấn
        query = " ".join(wrong_keywords)
        
        # Tìm kiếm trong vector store
        results = vs.search_in_vector_store_with_scores(vector_file, query, k=5)
        
        # Lấy lecture_id dựa trên tên file vector store
        lecture_ids = []
        
        # Lấy phần tên file (không có phần mở rộng)
        if vector_file_base:
            return [vector_file_base]  # Trả về tên file làm ID tạm thời để debug
        
        return lecture_ids
    
    except Exception as e:
        return []

def manual_extract_lecture_ids_from_pkl(wrong_keywords: List[str]) -> List[int]:
    """
    Trích xuất lecture_id từ file .pkl một cách thủ công khi không thể sử dụng module vector_store
    """
    from pathlib import Path
    import re
    
    vector_store_path = Path("../AI_Training/vector_store")
    if not vector_store_path.exists():
        base_dir = Path(__file__).resolve().parent.parent
        vector_store_path = base_dir / "AI_Training/vector_store"
    
    if not vector_store_path.exists():
        return []
    
    lecture_ids = []
    
    # Lấy danh sách file .pkl
    pkl_files = list(vector_store_path.glob("*.pkl"))
    
    for pkl_file in pkl_files:
        try:
            # Đọc nội dung file như binary và chuyển sang text để tìm kiếm
            with open(pkl_file, 'rb') as f:
                content = f.read().decode('latin1', errors='ignore')
            
            # Tìm các lecture_id bằng regex
            all_ids = set()
            matches = re.findall(r'lecture_(\d+)', content)
            for match in matches:
                try:
                    lecture_id = int(match)
                    all_ids.add(lecture_id)
                except ValueError:
                    continue
            
            # Thêm vào danh sách kết quả
            for lecture_id in all_ids:
                if lecture_id not in lecture_ids:
                    lecture_ids.append(lecture_id)
        
        except Exception as e:
            pass
    
    return lecture_ids

def get_related_lectures(wrong_keywords: List[str], connection) -> List[Dict[str, Any]]:
    """
    Tìm các bài giảng liên quan đến từ khóa sai
    
    Args:
        wrong_keywords: Danh sách các từ khóa từ câu hỏi sai
        connection: Kết nối đến database
        
    Returns:
        Danh sách các bài giảng liên quan
    """
    if not wrong_keywords or not connection:
        return []
    
    related_lectures = []
    
    # Tìm kiếm trong vector_store
    vector_store_results = find_lectures_in_vector_store(wrong_keywords)
    
    if vector_store_results:
        try:
            # Kiểm tra xem kết quả có phải là tên file không
            if isinstance(vector_store_results[0], str):
                file_base_name = vector_store_results[0]
                
                # Truy vấn bài giảng dựa trên tên file trong bảng attachment
                cursor = connection.cursor(dictionary=True)
                query = """
                SELECT l.lecture_id, l.title, c.course_id, c.course_name 
                FROM lecture l
                JOIN course c ON l.course_id = c.course_id
                WHERE l.attachment LIKE %s
                """
                pattern = f"{file_base_name}%"  # Thêm % để tìm các loại phần mở rộng (.docx, .pdf, v.v.)
                cursor.execute(query, (pattern,))
                results = cursor.fetchall()
                cursor.close()
                
                if results:
                    for result in results:
                        related_lectures.append(result)
        except Exception as e:
            pass
    
    # Nếu không tìm thấy bài giảng từ vector_store kết quả đầu tiên, tìm thử từ các file .pkl khác
    if not related_lectures:
        try:
            # Lấy tất cả các file .pkl
            vector_store_path = Path("../AI_Training/vector_store")
            if not vector_store_path.exists():
                base_dir = Path(__file__).resolve().parent.parent
                vector_store_path = base_dir / "AI_Training/vector_store"
            
            pkl_files = list(vector_store_path.glob("*.pkl"))
            if pkl_files:
                for pkl_file in pkl_files:
                    file_name = pkl_file.stem  # Tên file không có đuôi
                    
                    # Truy vấn bài giảng dựa trên attachment
                    cursor = connection.cursor(dictionary=True)
                    query = """
                    SELECT l.lecture_id, l.title, c.course_id, c.course_name 
                    FROM lecture l
                    JOIN course c ON l.course_id = c.course_id
                    WHERE l.attachment LIKE %s
                    """
                    pattern = f"{file_name}%"
                    cursor.execute(query, (pattern,))
                    results = cursor.fetchall()
                    cursor.close()
                    
                    if results:
                        for result in results:
                            if not any(r['lecture_id'] == result['lecture_id'] for r in related_lectures):
                                related_lectures.append(result)
                    
                    # Dừng nếu đã tìm thấy ít nhất một bài giảng
                    if related_lectures:
                        break
        except Exception as e:
            pass
    
    return related_lectures

def generate_alert_message(score: float, wrong_keywords: List[str], related_lectures: List[Dict[str, Any]]) -> str:
    """
    Tạo nội dung thông báo cảnh báo dựa trên điểm số và từ khóa sai
    
    Args:
        score: Điểm số của sinh viên (thang điểm 10)
        wrong_keywords: Danh sách các từ khóa từ câu hỏi sai
        related_lectures: Danh sách các bài giảng liên quan
        
    Returns:
        Nội dung thông báo
    """
    # Tạo thông báo cảnh báo dựa trên điểm số
    if score < 5:
        alert = f"⚠️ Cảnh báo: Điểm của bạn ({score}/10) ở mức yếu. Bạn cần ôn tập toàn diện để cải thiện."
    elif 5 <= score < 8:
        alert = f"⚠️ Lưu ý: Điểm của bạn ({score}/10) ở mức trung bình. Bạn cần ôn tập các phần chưa nắm vững."
    elif 8 <= score < 10:
        alert = f"⚠️ Thông báo: Điểm của bạn ({score}/10) ở mức khá tốt, nhưng vẫn còn một vài lỗi nhỏ cần khắc phục."
    else:  # score = 10
        alert = f"🎉 Chúc mừng! Bạn đã hoàn thành xuất sắc với điểm tuyệt đối ({score}/10)."
    
    # Thêm thông tin về các từ khóa sai và bài giảng liên quan
    if wrong_keywords and related_lectures and score < 10:
        alert += "\n\nBạn nên học các khóa học liên quan để cải thiện kiến thức:<br>"
        for i, lecture in enumerate(related_lectures[:8], 1): 
            alert += f"\n{i}. {lecture['title']} - khóa học {lecture['course_name']}<br>"
    
    return alert

def save_notification(user_id: int, content: str, connection) -> bool:
    """
    Lưu thông báo vào bảng notification
    
    Args:
        user_id: ID của sinh viên
        content: Nội dung thông báo
        connection: Kết nối đến database
        
    Returns:
        True nếu lưu thành công, False nếu có lỗi
    """
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO notification (user_id, content, timestamp)
        VALUES (%s, %s, %s)
        """
        timestamp = datetime.now()
        cursor.execute(query, (user_id, content, timestamp))
        connection.commit()
        cursor.close()
        return True
    except Exception as e:
        return False

def update_wrong_keywords(user_id: int, lecture_id: int, wrong_keywords: List[str]) -> bool:
    """
    Cập nhật danh sách từ khóa sai vào file câu trả lời hiện có
    
    Args:
        user_id: ID của sinh viên
        lecture_id: ID của bài kiểm tra
        wrong_keywords: Danh sách từ khóa đã trích xuất
        
    Returns:
        True nếu cập nhật thành công, False nếu có lỗi
    """
    filename = f"user_{user_id}_lecture_{lecture_id}.json"
    json_path = Path(f"../AI_Training/json/answers/{filename}")
    
    if not json_path.exists():
        # Thử lại với đường dẫn tuyệt đối
        base_dir = Path(__file__).resolve().parent.parent
        json_path = base_dir / f"AI_Training/json/answers/{filename}"
    
    try:
        if json_path.exists():
            with open(json_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
            
            # Cập nhật trường wrong_keywords
            data["wrong_keywords"] = wrong_keywords
            
            # Lưu lại file
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True
        else:
            return False
    except Exception as e:
        return False

def generate_test_alerts(user_id: int, lecture_id: int, progress: float = None, answers: Dict[str, str] = None) -> bool:
    """
    Tạo cảnh báo học tập sau khi sinh viên làm bài kiểm tra hoặc bài thi
    
    Args:
        user_id: ID của sinh viên
        lecture_id: ID của bài kiểm tra hoặc bài thi
        progress: Điểm phần trăm của sinh viên (0-100). Nếu không cung cấp, sẽ lấy từ file JSON
        answers: Dict chứa câu trả lời của sinh viên, dạng {"0": "A", "1": "B", ...}
                Nếu không cung cấp, sẽ tìm từ file lưu trữ
        
    Returns:
        True nếu xử lý thành công, False nếu có lỗi
    """
    # Kết nối đến database
    connection = connect_to_db()
    if not connection:
        return False
    
    try:
        # Nếu không cung cấp câu trả lời, thử tải từ file
        if answers is None:
            answers, file_progress = load_answers_json(user_id, lecture_id)
            
            if not answers:
                return False
            
            # Nếu không chỉ định progress, sử dụng từ file
            if progress is None:
                progress = file_progress
        
        # Tính điểm thang 10
        score = progress / 10.0
        # Làm tròn đến 2 chữ số thập phân
        score = round(score, 2)
        
        # Tải file JSON đề bài
        test_data = load_test_json(lecture_id)
        if not test_data:
            return False
        
        # Tìm các từ khóa sai
        wrong_keywords = get_wrong_keywords(test_data, answers)
        
        # Cập nhật wrong_keywords vào file câu trả lời
        update_wrong_keywords(user_id, lecture_id, wrong_keywords)
        
        # Tìm các bài giảng liên quan
        related_lectures = get_related_lectures(wrong_keywords, connection)
        
        # Tạo nội dung thông báo
        alert_message = generate_alert_message(score, wrong_keywords, related_lectures)
        
        # Lưu thông báo vào database
        result = save_notification(user_id, alert_message, connection)
        
        return result
    except Exception as e:
        return False
    finally:
        if connection:
            connection.close()

# Loại bỏ tất cả log không cần thiết trong main
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Su dung: python test_alerts.py <user_id> <lecture_id> [progress] [answers_file]")
        sys.exit(1)
    
    user_id = int(sys.argv[1])
    lecture_id = int(sys.argv[2])
    
    # Progress có thể được bỏ qua, khi đó sẽ lấy từ file JSON
    progress = None
    if len(sys.argv) > 3:
        progress = float(sys.argv[3])
    
    # Đọc answers từ file JSON nếu có tham số thứ 4
    answers = None
    if len(sys.argv) > 4:
        answers_file = sys.argv[4]
        try:
            with open(answers_file, "r") as f:
                answers = json.load(f)
        except Exception:
            pass
    
    result = generate_test_alerts(user_id, lecture_id, progress, answers)
    print(f"Ket qua tao canh bao: {'Thanh cong' if result else 'That bai'}") 