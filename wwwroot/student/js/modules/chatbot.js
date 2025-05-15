// Xử lý auto-resize cho textarea
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendMessage');
let currentHistoryPage = 1;
const historyPageSize = 20;

// Biến toàn cục cho modal history
const historyModal = document.getElementById('historyModal');
const historyContainer = document.getElementById('historyContainer');
const closeModal = document.querySelector('.close');
const loadMoreBtn = document.getElementById('loadMoreHistory');
const deleteHistoryBtn = document.getElementById('deleteHistory');
const historyBtn = document.getElementById('historyBtn');

function updateTextAreaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
    // Cập nhật trạng thái nút gửi
    sendButton.disabled = !messageInput.value.trim();
}

messageInput.addEventListener('input', updateTextAreaHeight);

// Xử lý gửi tin nhắn
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Thêm tin nhắn của người dùng
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;

    // Hiển thị typing indicator
    showTypingIndicator();

    // Lấy token xác thực từ localStorage
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Gửi câu hỏi đến API
    fetch('/chatbot/ask', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            question: message,
            courseId: null // Có thể cập nhật để chọn khóa học cụ thể nếu cần
        })
    })
    .then(response => response.json())
    .then(data => {
        // Ẩn typing indicator
        hideTypingIndicator();
        
        if (data.answer) {
            // Hiển thị câu trả lời
            addMessage(data.answer, 'bot');
        } else if (data.error) {
            // Hiển thị thông báo lỗi
            addMessage(`Xin lỗi, có lỗi xảy ra: ${data.error}`, 'bot');
            console.error('Error:', data.error);
        } else {
            // Thông báo lỗi không xác định
            addMessage('Xin lỗi, tôi không thể trả lời câu hỏi của bạn lúc này. Vui lòng thử lại sau.', 'bot');
        }
    })
    .catch(error => {
        hideTypingIndicator();
        addMessage('Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.', 'bot');
        console.error('Error:', error);
    });
}

// Thêm tin nhắn vào khung chat
function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formatMessage(content)}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Format tin nhắn với Markdown đơn giản
function formatMessage(content) {
    // Thay thế URL bằng links
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Thay thế *text* bằng in đậm
    content = content.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');

    // Thay thế _text_ bằng in nghiêng
    content = content.replace(/\_([^\_]+)\_/g, '<em>$1</em>');

    // Thay thế `code` bằng code inline
    content = content.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

    return content;
}

// Scroll to bottom mượt mà
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
}

// Hiển thị typing indicator
function showTypingIndicator() {
    document.querySelector('.typing-indicator').style.display = 'flex';
}

// Ẩn typing indicator
function hideTypingIndicator() {
    document.querySelector('.typing-indicator').style.display = 'none';
}

// Xử lý câu hỏi gợi ý
document.querySelectorAll('.question-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        const questionText = this.textContent.trim();
        messageInput.value = questionText;
        messageInput.focus();
        updateTextAreaHeight();
    });
});

// Xử lý nút xóa cuộc trò chuyện
document.getElementById('clearChat').addEventListener('click', function() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện hiện tại?')) {
        const chatMessages = document.getElementById('chatMessages');
        // Giữ lại tin nhắn chào mừng đầu tiên
        const welcomeMessage = chatMessages.firstElementChild;
        chatMessages.innerHTML = '';
        chatMessages.appendChild(welcomeMessage);
    }
});

// Xử lý nút đính kèm file
document.getElementById('attachFile').addEventListener('click', function() {
    alert('Tính năng đính kèm file sẽ sớm được cập nhật!');
});

// Xử lý modal lịch sử chat
historyBtn.addEventListener('click', function() {
    // Reset trang và tải lịch sử chat mới
    currentHistoryPage = 1;
    loadChatHistory();
    historyModal.style.display = 'block';
});

closeModal.addEventListener('click', function() {
    historyModal.style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

// Tải thêm lịch sử
loadMoreBtn.addEventListener('click', function() {
    currentHistoryPage++;
    loadChatHistory(true);
});

// Xóa toàn bộ lịch sử
deleteHistoryBtn.addEventListener('click', function() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử chat?')) {
        deleteChatHistory();
    }
});

// Hàm nhóm tin nhắn theo ngày
function groupMessagesByDate(messages) {
    const groups = {};
    
    messages.forEach(message => {
        const date = new Date(message.timestamp);
        const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        
        groups[dateKey].push(message);
    });
    
    // Sắp xếp các nhóm theo ngày (mới nhất trước)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
        return new Date(b[0]) - new Date(a[0]);
    });
    
    return sortedGroups;
}

// Hàm format ngày cho tiêu đề nhóm
function formatDateHeader(dateKey) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [year, month, day] = dateKey.split('-').map(n => parseInt(n));
    const date = new Date(year, month - 1, day);
    
    if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    ) {
        return 'Hôm nay';
    } else if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    ) {
        return 'Hôm qua';
    } else {
        return date.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }
}

// Hàm format thời gian cho từng tin nhắn
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Hàm tải lịch sử chat
function loadChatHistory(append = false) {
    // Hiển thị trạng thái đang tải
    loadMoreBtn.textContent = 'Đang tải...';
    loadMoreBtn.disabled = true;
    
    // Lấy token xác thực từ localStorage
    const token = localStorage.getItem('token');
    const headers = {};
    
    // Thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Gọi API để lấy lịch sử chat
    fetch(`/chatbot/history?limit=${historyPageSize}&page=${currentHistoryPage}`, {
        headers: headers
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    // Chưa đăng nhập
                    throw new Error('Vui lòng đăng nhập để xem lịch sử chat');
                }
                throw new Error('Không thể tải lịch sử chat');
            }
            return response.json();
        })
        .then(messages => {
            if (!append) {
                // Xóa nội dung cũ nếu không phải append
                historyContainer.innerHTML = '';
            }
            
            if (messages.length === 0) {
                if (!append) {
                    // Nếu không có tin nhắn và không phải append
                    historyContainer.innerHTML = '<div class="empty-history">Bạn chưa có cuộc trò chuyện nào.</div>';
                } else {
                    // Nếu không còn tin nhắn để tải thêm
                    loadMoreBtn.textContent = 'Không còn tin nhắn cũ hơn';
                    loadMoreBtn.disabled = true;
                }
                return;
            }
            
            // Nhóm tin nhắn theo ngày
            const groupedMessages = groupMessagesByDate(messages);
            
            // Hiển thị các tin nhắn
            groupedMessages.forEach(([dateKey, messagesInDay]) => {
                // Tạo divider cho ngày
                const dateHeader = document.createElement('div');
                dateHeader.className = 'chat-date-divider';
                dateHeader.textContent = formatDateHeader(dateKey);
                historyContainer.appendChild(dateHeader);
                
                // Sắp xếp tin nhắn trong ngày theo thời gian (cũ nhất trước)
                messagesInDay.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                // Hiển thị từng tin nhắn
                messagesInDay.forEach(message => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `history-message ${message.isBot ? 'bot' : 'user'}`;
                    
                    messageDiv.innerHTML = `
                        <div class="message-content">${formatMessage(message.message)}</div>
                        <div class="message-time">${formatMessageTime(message.timestamp)}</div>
                    `;
                    
                    historyContainer.appendChild(messageDiv);
                });
            });
            
            // Cập nhật trạng thái nút tải thêm
            loadMoreBtn.textContent = 'Tải thêm';
            loadMoreBtn.disabled = messages.length < historyPageSize;
        })
        .catch(error => {
            console.error('Error loading chat history:', error);
            historyContainer.innerHTML = `<div class="error-message">${error.message || 'Đã xảy ra lỗi khi tải lịch sử chat'}</div>`;
            loadMoreBtn.textContent = 'Thử lại';
            loadMoreBtn.disabled = false;
        });
}

// Hàm xóa lịch sử chat
function deleteChatHistory() {
    // Lấy token xác thực từ localStorage
    const token = localStorage.getItem('token');
    const headers = {};
    
    // Thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch('/chatbot/history', {
        method: 'DELETE',
        headers: headers
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Không thể xóa lịch sử chat');
        }
        return response.json();
    })
    .then(data => {
        // Xóa nội dung hiển thị
        historyContainer.innerHTML = '<div class="empty-history">Bạn chưa có cuộc trò chuyện nào.</div>';
        loadMoreBtn.disabled = true;
        alert('Đã xóa toàn bộ lịch sử chat');
    })
    .catch(error => {
        console.error('Error deleting chat history:', error);
        alert('Đã xảy ra lỗi khi xóa lịch sử chat');
    });
} 