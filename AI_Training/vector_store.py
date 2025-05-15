# vector_store.py
import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple

# Khởi tạo model embedding
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')  # Mô hình đa ngôn ngữ

class VectorStore:
    def __init__(self, dim=384):  
        self.index = faiss.IndexFlatL2(dim)  
        self.texts = []
        self.metadata = []
    
    def add_texts(self, texts: List[str], metadatas: List[Dict[str, Any]] = None):
        if not texts:
            return
        
        # Tạo embeddings
        embeddings = model.encode(texts)
        
        # Thêm vào FAISS index
        self.index.add(np.array(embeddings).astype('float32'))
        
        # Lưu text và metadata
        self.texts.extend(texts)
        if metadatas:
            self.metadata.extend(metadatas)
        else:
            self.metadata.extend([{} for _ in texts])
    
    def similarity_search(self, query: str, k: int = 5) -> List[Tuple[str, Dict[str, Any], float]]:
        # Tạo embedding cho query
        query_embedding = model.encode([query])
        
        # Tìm kiếm k kết quả gần nhất
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.texts):  # -1 is returned when there are not enough results
                results.append((self.texts[idx], self.metadata[idx], float(distances[0][i])))
        
        return results

def initialize_vector_store(file_path: str, chunks: List[str], metadatas: List[Dict[str, Any]] = None) -> None:
    """Khởi tạo và lưu vector store"""
    vector_store = VectorStore()
    vector_store.add_texts(chunks, metadatas)
    
    # Đảm bảo thư mục tồn tại
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Lưu vector store
    with open(file_path, 'wb') as f:
        pickle.dump(vector_store, f)
        
def search_in_vector_store_with_scores(file_path: str, query: str, k: int = 5) -> List[Tuple[str, float]]:
    """Tìm kiếm trong vector store và trả về text cùng với điểm số"""
    if not os.path.exists(file_path):
        return []
    
    try:
        # Tải vector store
        with open(file_path, 'rb') as f:
            vector_store = pickle.load(f)
        
        # Tìm kiếm
        results = vector_store.similarity_search(query, k)
        
        # Trả về text và score
        return [(item[0], item[2]) for item in results]
    except Exception as e:
        print(f"Error searching in vector store: {e}")
        return []