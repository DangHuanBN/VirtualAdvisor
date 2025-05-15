from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import json
import os
import pathlib
import sys

# Thiết lập múi giờ Việt Nam (UTC+7)
VIETNAM_TIMEZONE = timezone(timedelta(hours=7))

# Xử lý đường dẫn để đảm bảo log lưu đúng vị trí
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))
# Thêm thư mục gốc vào sys.path để import các module khác nếu cần
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường sản phẩm, hãy giới hạn nguồn gốc
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ thư mục client
client_dir = os.path.join(root_dir, "client")
app.mount("/static", StaticFiles(directory=client_dir), name="static")

# Model dữ liệu
class PingRequest(BaseModel):
    user_id: int
    lecture_id: int
    timestamp: str = None  # Nếu không có timestamp, sẽ sử dụng thời gian hiện tại

# Đảm bảo thư mục logs tồn tại
log_dir = os.path.join(root_dir, "logs")
pathlib.Path(log_dir).mkdir(exist_ok=True, parents=True)

# Hàm lưu và cập nhật log
def update_log_file(user_id, lecture_id, timestamp):
    filename = os.path.join(log_dir, f"lecture_{lecture_id}_user_{user_id}.json")
    
    # Xử lý timestamp với múi giờ Việt Nam
    if timestamp:
        # Nếu client gửi timestamp, chuyển đổi sang múi giờ Việt Nam
        current_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).astimezone(VIETNAM_TIMEZONE)
    else:
        # Nếu không có timestamp, sử dụng thời gian hiện tại theo múi giờ Việt Nam
        current_time = datetime.now(VIETNAM_TIMEZONE)
    
    formatted_time = current_time.isoformat()
    
    # Tạo cấu trúc dữ liệu mặc định nếu file không tồn tại
    if not os.path.exists(filename):
        data = {
            "user_id": user_id,
            "lecture_id": lecture_id,
            "sessions": []
        }
        is_new_file = True
    else:
        with open(filename, "r") as f:
            data = json.load(f)
        is_new_file = False
    
    # Xác định xem đây là phiên học mới hay là ping trong phiên hiện tại
    is_new_session = False
    if not data["sessions"] or (datetime.fromisoformat(formatted_time) - 
                              datetime.fromisoformat(data["sessions"][-1]["end"])).total_seconds() > 300:  # 5 phút ngắt
        # Tạo phiên mới
        is_new_session = True
        data["sessions"].append({
            "start": formatted_time,
            "end": formatted_time
        })
        
        # Hiển thị thông báo khi tạo phiên mới
        time_str = current_time.strftime("%H:%M:%S")
        if is_new_file:
            print(f"[{time_str}] 📂 Tạo FILE MỚI: lecture_{lecture_id}_user_{user_id}.json")
        else:
            print(f"[{time_str}] 🔄 Tạo PHIÊN MỚI: user={user_id}, lecture={lecture_id} (nghỉ > 5 phút)")
    else:
        # Cập nhật thời gian kết thúc của phiên hiện tại
        data["sessions"][-1]["end"] = formatted_time
    
    # Lưu dữ liệu vào file
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    
    return data

# Endpoint cho ping.js
@app.get("/ping.js")
async def get_ping_js():
    """Phục vụ tệp ping.js"""
    ping_js_path = os.path.join(root_dir, "client", "ping.js")
    if os.path.exists(ping_js_path):
        return FileResponse(
            ping_js_path, 
            media_type="text/javascript",
            headers={"Access-Control-Allow-Origin": "*"}
        )
    else:
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp ping.js")

@app.post("/api/learning/ping")
async def learning_ping(request: PingRequest):
    try:
        # Lấy thời gian hiện tại theo múi giờ Việt Nam
        current_time_vn = datetime.now(VIETNAM_TIMEZONE).strftime("%H:%M:%S")
        
        # In thông báo khi nhận ping
        print(f"[{current_time_vn}] 📌 Nhận ping: user_id={request.user_id}, lecture_id={request.lecture_id}")
        
        result = update_log_file(
            request.user_id, 
            request.lecture_id, 
            request.timestamp
        )
        
        # Tính tổng thời gian học
        total_minutes = 0
        for session in result["sessions"]:
            start_time = datetime.fromisoformat(session["start"])
            end_time = datetime.fromisoformat(session["end"])
            duration_minutes = (end_time - start_time).total_seconds() / 60
            total_minutes += duration_minutes
        
        # In thông tin chi tiết về phiên học
        session_count = len(result["sessions"])
        latest_session = result["sessions"][-1]
        latest_start = datetime.fromisoformat(latest_session["start"]).strftime("%H:%M:%S")
        latest_end = datetime.fromisoformat(latest_session["end"]).strftime("%H:%M:%S")
        print(f"   ├── Tổng số phiên: {session_count}, Phiên hiện tại: {latest_start} - {latest_end}")
        print(f"   └── Tổng thời gian: {round(total_minutes, 2)} phút")
        
        return {
            "success": True,
            "message": "Ping recorded successfully",
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_minutes / 60, 2)
        }
    except Exception as e:
        print(f"❌ LỖI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording ping: {str(e)}")

# Thêm endpoint kiểm tra kết nối
@app.get("/api/learning/test")
async def test_connection():
    return {
        "status": "ok",
        "message": "Server đang hoạt động",
        "timestamp": datetime.now(VIETNAM_TIMEZONE).isoformat()
    }

# Thêm route cho trang test
@app.get("/test.html")
async def get_test_page():
    """Phục vụ trang test"""
    test_html_path = os.path.join(current_dir, "test.html")
    if os.path.exists(test_html_path):
        return FileResponse(
            test_html_path, 
            media_type="text/html",
            headers={"Access-Control-Allow-Origin": "*"}
        )
    else:
        raise HTTPException(status_code=404, detail="Không tìm thấy trang test.html")

if __name__ == "__main__":
    import uvicorn
    
    # Lấy cổng từ biến môi trường hoặc sử dụng cổng mặc định 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Debug mode có thể thay đổi thành False trong môi trường sản xuất
    debug = True
    
    print(f"Khởi động server tại http://localhost:{port}")
    print(f"API documentation: http://localhost:{port}/docs")
    print(f"Thư mục lưu log: {log_dir}")
    print(f"Phục vụ ping.js tại: http://localhost:{port}/ping.js")
    print(f"Múi giờ: Việt Nam (UTC+7)")
    
    # Khởi động server
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 