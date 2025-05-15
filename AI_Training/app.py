from flask import Flask, request, jsonify, render_template
import os
from werkzeug.utils import secure_filename
from document_processor import process_document
from vector_store import initialize_vector_store, search_in_vector_store_with_scores
from training_manager import train_document
from llm_handler import generate_answer
import mysql.connector
from mysql.connector import Error
import config

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = config.UPLOAD_FOLDER
app.config['VECTOR_STORE'] = config.VECTOR_STORE_PATH
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'pptx'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['VECTOR_STORE'], exist_ok=True)

# Kiểm tra file có hợp lệ
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Kết nối database
def create_db_connection():
    try:
        connection = mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# Trang chủ
@app.route('/')
def home():
    return render_template('training.html')

@app.route('/training')
def training():
    return render_template('training.html')

@app.route('/api/courses', methods=['GET'])
def get_courses():
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = """
            SELECT c.course_id, c.course_name, s.subject_name, c.type 
            FROM Course c
            LEFT JOIN Subjects s ON c.subject_id = s.subject_id
            ORDER BY c.course_name
            """
            cursor.execute(query)
            courses = cursor.fetchall()
            return jsonify(courses), 200
        except Error as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Lấy danh sách giáo viên
@app.route('/api/teachers', methods=['GET'])
def get_teachers():
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            query = """
            SELECT user_id, username, full_name, email 
            FROM Users 
            WHERE role = 'teacher'
            ORDER BY full_name
            """
            cursor.execute(query)
            teachers = cursor.fetchall()
            return jsonify(teachers), 200
        except Error as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Lấy danh sách bài giảng
@app.route('/api/lectures', methods=['GET'])
def get_lectures():
    course_id = request.args.get('course_id')
    
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            if course_id:
                query = """
                SELECT l.lecture_id, l.course_id, l.title, l.type, l.status, l.upload_date, 
                       l.training_date, u.full_name as teacher_name, c.course_name,
                       a.status as training_status
                FROM Lecture l
                JOIN Course c ON l.course_id = c.course_id
                JOIN Users u ON l.teacher_id = u.user_id
                LEFT JOIN AI_Training a ON l.lecture_id = a.lecture_id
                WHERE l.course_id = %s
                ORDER BY l.upload_date DESC
                """
                cursor.execute(query, (course_id,))
            else:
                query = """
                SELECT l.lecture_id, l.course_id, l.title, l.type, l.status, l.upload_date, 
                       l.training_date, u.full_name as teacher_name, c.course_name,
                       a.status as training_status
                FROM Lecture l
                JOIN Course c ON l.course_id = c.course_id
                JOIN Users u ON l.teacher_id = u.user_id
                LEFT JOIN AI_Training a ON l.lecture_id = a.lecture_id
                ORDER BY l.upload_date DESC
                """
                cursor.execute(query)
                
            lectures = cursor.fetchall()
            
            # Convert date objects to string for JSON serialization
            for lecture in lectures:
                if lecture['upload_date']:
                    lecture['upload_date'] = lecture['upload_date'].strftime('%Y-%m-%d')
                if lecture['training_date']:
                    lecture['training_date'] = lecture['training_date'].strftime('%Y-%m-%d')
            
            return jsonify(lectures), 200
        except Error as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Upload tài liệu
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Kiểm tra định dạng file
    if not allowed_file(file.filename):
        return jsonify({'error': f'File format not supported. Allowed formats: {", ".join(app.config["ALLOWED_EXTENSIONS"])}'}), 400
        
    # Lấy thông tin form
    course_id = request.form.get('course_id')
    teacher_id = request.form.get('teacher_id')
    title = request.form.get('title')
    type_content = request.form.get('type')
    maxhours = request.form.get('maxdays', None) 
    
    if not all([course_id, teacher_id, title, type_content]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Lưu file
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Kiểm tra xem file đã được lưu thành công chưa
    if not os.path.exists(file_path):
        return jsonify({'error': 'Failed to save file'}), 500
    
    # Khởi tạo tên cho vector path
    vector_path = os.path.join(app.config['VECTOR_STORE'], f"{filename.split('.')[0]}.pkl")
    
    # Thêm vào database
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            # Thêm bài giảng
            query = """
            INSERT INTO Lecture (course_id, teacher_id, title, content, attachment, maxhours, type, vector_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (course_id, teacher_id, title, "Content from file", filename, maxhours, type_content, vector_path))
            lecture_id = cursor.lastrowid
            
            # Thêm vào AI_Training
            query = """
            INSERT INTO AI_Training (lecture_id, vector_store_path, status)
            VALUES (%s, %s, %s)
            """
            cursor.execute(query, (lecture_id, vector_path, 'pending'))
            connection.commit()
            
            return jsonify({
                'message': 'File uploaded successfully',
                'lecture_id': lecture_id,
                'file_path': file_path
            }), 201
            
        except Error as e:
            print(f"Error: {e}")
            # Xóa file nếu có lỗi với database
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        # Xóa file nếu không thể kết nối database
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': 'Database connection failed'}), 500

# Huấn luyện tài liệu
@app.route('/train/<int:lecture_id>', methods=['POST'])
def train_lecture(lecture_id):
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            # Lấy thông tin bài giảng
            query = """
            SELECT L.lecture_id, L.attachment, L.vector_path, A.training_id, A.status as training_status
            FROM Lecture L
            JOIN AI_Training A ON L.lecture_id = A.lecture_id
            WHERE L.lecture_id = %s
            """
            cursor.execute(query, (lecture_id,))
            lecture = cursor.fetchone()
            
            if not lecture:
                return jsonify({'error': 'Lecture not found'}), 404
            
            # Kiểm tra nếu đang trong quá trình xử lý
            if lecture['training_status'] == 'processing':
                return jsonify({'error': 'This lecture is already being processed'}), 400
                
            # Kiểm tra tên file có hợp lệ không
            if not lecture['attachment']:
                return jsonify({'error': 'No attachment file found for this lecture'}), 400
                
            # Đường dẫn đầy đủ tới file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], lecture['attachment'])
            
            # Kiểm tra file có tồn tại không
            if not os.path.exists(file_path):
                return jsonify({'error': f'File not found: {file_path}'}), 404
                
            # Cập nhật trạng thái đang xử lý
            query = """
            UPDATE AI_Training SET status = 'processing' 
            WHERE training_id = %s
            """
            cursor.execute(query, (lecture['training_id'],))
            connection.commit()
            
            try:
                # Xử lý tài liệu
                document_content = process_document(file_path)
                
                if not document_content or len(document_content.strip()) == 0:
                    raise ValueError("No content extracted from the document")
                
                # Sử dụng đường dẫn vector_path từ database hoặc tạo mới nếu cần
                vector_path = lecture['vector_path']
                if not vector_path or not os.path.isabs(vector_path):
                    # Nếu không phải đường dẫn tuyệt đối, chuyển thành đường dẫn tuyệt đối
                    vector_path = os.path.join(app.config['VECTOR_STORE'], os.path.basename(vector_path))
                
                # Huấn luyện và tạo vector store
                train_document(document_content, vector_path)
                
                # Kiểm tra xem vector store đã được tạo chưa
                if not os.path.exists(vector_path):
                    raise ValueError("Vector store file was not created")
                
                # Cập nhật trạng thái hoàn thành
                query = """
                UPDATE AI_Training SET status = 'completed', training_time = NOW()
                WHERE training_id = %s
                """
                cursor.execute(query, (lecture['training_id'],))
                
                # Cập nhật bài giảng đã huấn luyện
                query = """
                UPDATE Lecture SET status = 'dahuanluyen', training_date = CURRENT_DATE
                WHERE lecture_id = %s
                """
                cursor.execute(query, (lecture_id,))
                connection.commit()
                
                return jsonify({
                    'message': 'Training completed successfully',
                    'vector_path': vector_path
                }), 200
                
            except Exception as e:
                print(f"Training error: {str(e)}")
                # Cập nhật trạng thái lỗi
                query = """
                UPDATE AI_Training SET status = 'failed' 
                WHERE training_id = %s
                """
                cursor.execute(query, (lecture['training_id'],))
                connection.commit()
                
                return jsonify({'error': f'Training failed: {str(e)}'}), 500
                
        except Error as e:
            print(f"Database error: {str(e)}")
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

# Trả lời câu hỏi
@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question')
    course_id = data.get('course_id')
    
    if not question:
        return jsonify({'error': 'Question is required'}), 400
        
    connection = create_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Tìm các bài giảng đã huấn luyện trong khóa học
            query = """
            SELECT L.lecture_id, L.title, L.vector_path 
            FROM Lecture L
            WHERE L.course_id = %s AND L.status = 'dahuanluyen' AND L.vector_path IS NOT NULL
            """
            
            if course_id:
                cursor.execute(query, (course_id,))
            else:
                # Nếu không chọn khóa học, lấy tất cả bài giảng đã huấn luyện
                query = """
                SELECT L.lecture_id, L.title, L.vector_path 
                FROM Lecture L
                WHERE L.status = 'dahuanluyen' AND L.vector_path IS NOT NULL
                """
                cursor.execute(query)
                
            lectures = cursor.fetchall()
            
            if not lectures:
                return jsonify({'answer': 'Không có bài giảng nào đã được huấn luyện để trả lời câu hỏi này.'}), 200
                
            # Tìm kiếm trong các vector stores
            all_results = []
            for lecture in lectures:
                vector_path = lecture['vector_path']
                # Kiểm tra xem vector path có hợp lệ và vector store có tồn tại không
                if vector_path:
                    # Xử lý đường dẫn
                    if not os.path.isabs(vector_path):
                        vector_path = os.path.join(app.config['VECTOR_STORE'], os.path.basename(vector_path))
                    
                    if os.path.exists(vector_path):
                        # Thêm thông tin bài giảng vào kết quả
                        lecture_title = lecture['title']
                        print(f"Searching in vector store: {vector_path} for lecture: {lecture_title}")
                        
                        results_with_scores = search_in_vector_store_with_scores(vector_path, question)
                        if results_with_scores:
                            for text, score in results_with_scores:
                                all_results.append({
                                    'text': text,
                                    'score': score,
                                    'lecture_title': lecture_title
                                })
            
            # Sắp xếp các kết quả theo điểm số tương đồng (score càng thấp càng tốt cho L2 distance)
            all_results.sort(key=lambda x: x['score'])
            
            # Lấy các context tốt nhất từ tất cả các bài giảng
            relevant_contexts = []
            used_lectures = set()
            
            # Lấy tối đa 5 context có điểm số tốt nhất
            for result in all_results[:5]:
                relevant_contexts.append(result['text'])
                used_lectures.add(result['lecture_title'])
            
            # Gửi đến LLM để trả lời
            if relevant_contexts:
                # Thông tin về nguồn bài giảng được sử dụng
                lecture_info = "Thông tin được trích từ các bài giảng: " + ", ".join(used_lectures)
                
                answer = generate_answer(question, relevant_contexts)
                
                # Thêm thông tin nguồn vào câu trả lời
                full_answer = f"{answer}\n\n{lecture_info}"
                
                return jsonify({'answer': full_answer}), 200
            else:
                return jsonify({'answer': 'Không tìm thấy thông tin liên quan để trả lời câu hỏi này.'}), 200
                
        except Error as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            connection.close()
    else:
        return jsonify({'error': 'Database connection failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)