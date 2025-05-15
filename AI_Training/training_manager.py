# training_manager.py
from document_processor import chunk_text
from vector_store import initialize_vector_store
import os

# Trong hàm train_document của training_manager.py
def train_document(document_content, vector_path):
    """
    Xử lý và huấn luyện tài liệu để tạo vector store
    """
    print(f"Training document and saving to {vector_path}")
    
    # Bước 1: Chia nhỏ tài liệu thành các đoạn
    chunks = chunk_text(document_content)
    print(f"Created {len(chunks)} chunks from document")
    
    # Bước 2: Tạo metadata cho từng chunk
    metadatas = []
    for i, chunk in enumerate(chunks):
        # Trích xuất một số thông tin từ chunk để làm metadata
        first_line = chunk.split('\n')[0] if '\n' in chunk else chunk[:50]
        metadatas.append({
            'chunk_id': i,
            'title': first_line.strip(),
            'length': len(chunk)
        })
    
    # Bước 3: Tạo và lưu vector store
    initialize_vector_store(vector_path, chunks, metadatas)
    
    # Kiểm tra vector store đã được lưu
    if os.path.exists(vector_path):
        file_size = os.path.getsize(vector_path)
        print(f"Vector store saved successfully at {vector_path} (Size: {file_size} bytes)")
    else:
        print(f"WARNING: Vector store was not saved at {vector_path}")
    
    return True