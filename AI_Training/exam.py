import os
import re
import json
import docx
from pathlib import Path

def extract_questions_from_docx(docx_path):
    """
    Trích xuất câu hỏi và phần đáp án từ file .docx
    
    Args:
        docx_path (str): Đường dẫn đến file .docx
        
    Returns:
        tuple: (danh sách câu hỏi với đáp án, từ điển đáp án đúng)
    """
    # Đọc file docx
    doc = docx.Document(docx_path)
    
    # Lấy toàn bộ nội dung text
    full_text = " ".join([para.text for para in doc.paragraphs if para.text.strip()])
    
    # Tách phần nội dung và phần đáp án
    parts = full_text.split("ĐÁP ÁN")
    if len(parts) != 2:
        raise ValueError("Không tìm thấy phần ĐÁP ÁN trong file")
    
    content = parts[0].strip()
    answers_section = parts[1].strip()
    
    # Tách các câu hỏi
    questions_data = []
    pattern = r"Câu\s+(\d+)\s*:\s*(.*?)(?=Câu\s+\d+\s*:|$)"
    questions_matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in questions_matches:
        question_num = match.group(1)
        question_text = match.group(2).strip()
        
        # Tách câu hỏi và 4 đáp án
        options_pattern = r"^(.*?)(?:\s*)A\.\s*(.*?)\s*B\.\s*(.*?)\s*C\.\s*(.*?)\s*D\.\s*(.*)$"
        options_match = re.search(options_pattern, question_text, re.DOTALL | re.MULTILINE)
        
        if options_match:
            question = options_match.group(1).strip()
            option_a = options_match.group(2).strip()
            option_b = options_match.group(3).strip()
            option_c = options_match.group(4).strip() 
            option_d = options_match.group(5).strip()
            
            questions_data.append({
                "number": int(question_num),
                "question": question,
                "options": {
                    "A": option_a,
                    "B": option_b,
                    "C": option_c,
                    "D": option_d
                }
            })
    
    # Tách đáp án đúng
    correct_answers = {}
    answer_pattern = r"Câu\s+(\d+)\s*:\s*([A-D])"
    for match in re.finditer(answer_pattern, answers_section):
        question_num = int(match.group(1))
        answer = match.group(2)
        correct_answers[question_num] = answer
    
    return questions_data, correct_answers

def process_docx_to_json(path_to_docx, lecture_id):
    """
    Xử lý file .docx thành file .json chứa câu hỏi và đáp án
    
    Args:
        path_to_docx (str): Đường dẫn đến file .docx
        lecture_id (int): ID bài giảng
        
    Returns:
        int: Số lượng câu hỏi đã xử lý
    """
    # Tạo thư mục lưu trữ nếu chưa tồn tại
    output_dir = Path("json")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Xử lý file docx để lấy câu hỏi và đáp án
    questions_data, correct_answers = extract_questions_from_docx(path_to_docx)
    
    # Sắp xếp danh sách câu hỏi theo số thứ tự
    questions_data.sort(key=lambda x: x["number"])
    
    # Tạo cấu trúc JSON
    test_data = {
        "lecture_id": lecture_id,
        "questions": []
    }
    
    # Thêm đáp án đúng vào mỗi câu hỏi
    for question in questions_data:
        question_num = question["number"]
        if question_num in correct_answers:
            question_with_answer = {
                "question": question["question"],
                "options": question["options"],
                "correct": correct_answers[question_num]
            }
            test_data["questions"].append(question_with_answer)
    
    # Lưu file JSON
    output_file = output_dir / f"test_lecture_{lecture_id}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    return len(test_data["questions"])

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Chuyển đổi file Word có câu hỏi trắc nghiệm sang file JSON")
    parser.add_argument("docx_path", help="Đường dẫn đến file .docx")
    parser.add_argument("lecture_id", type=int, help="ID bài giảng")
    
    args = parser.parse_args()
    
    try:
        num_questions = process_docx_to_json(args.docx_path, args.lecture_id)
        print(f"Đã xử lý thành công {num_questions} câu hỏi và lưu vào file JSON.")
    except Exception as e:
        print(f"Lỗi: {e}") 