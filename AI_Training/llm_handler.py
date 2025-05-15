# llm_handler.py
import google.generativeai as genai
import config
from typing import List

# Khởi tạo Gemini AI
genai.configure(api_key=config.GEMINI_API_KEY)

def generate_answer(question: str, contexts: List[str]):
    """
    Sử dụng Gemini để tạo câu trả lời dựa trên các contexts liên quan
    """
    # Giới hạn số lượng context để tránh quá dài
    if len(contexts) > 5:
        contexts = contexts[:5]
    
    # Kết hợp các contexts
    combined_context = "\n\n".join(contexts)
    
    # Chuẩn bị prompt
    prompt = f"""Dựa trên thông tin được cung cấp dưới đây, hãy trả lời câu hỏi. 
    Nếu thông tin không đủ để trả lời câu hỏi, hãy nói rằng bạn không có đủ thông tin.
    Chỉ sử dụng thông tin từ tài liệu đã cung cấp. Không thêm thông tin từ kiến thức riêng của bạn.
    
    Thông tin:
    {combined_context}
    
    Câu hỏi: {question}
    
    Trả lời:"""
    
    # Gọi Gemini API
    model = genai.GenerativeModel('gemini-1.5-pro')
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error with Gemini API: {e}")
        return "Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn."