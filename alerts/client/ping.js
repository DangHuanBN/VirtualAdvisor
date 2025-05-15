/**
 * Module theo dõi thời gian học tập
 * Tự động gửi ping đến server mỗi 2 phút khi sinh viên học bài giảng
 */
class LearningTracker {
  constructor(options = {}) {
    this.options = {
      pingInterval: 120000, // 2 phút mặc định
      apiEndpoint: '/api/learning/ping',
      ...options
    };
    
    this.timer = null;
    this.userId = null;
    this.lectureId = null;
    this.isActive = false;
  }

  /**
   * Bắt đầu theo dõi thời gian học tập
   * @param {number} userId - ID của người dùng
   * @param {number} lectureId - ID của bài giảng
   */
  startTracking(userId, lectureId) {
    if (!userId || !lectureId) {
      console.error('LearningTracker: userId và lectureId là bắt buộc');
      return;
    }

    this.userId = userId;
    this.lectureId = lectureId;
    this.isActive = true;

    // Gửi ping ngay lập tức khi bắt đầu
    this.sendPing();

    // Thiết lập ping định kỳ
    this.timer = setInterval(() => {
      this.sendPing();
    }, this.options.pingInterval);

    // Theo dõi khi trang web không hoạt động hoặc đóng
    window.addEventListener('beforeunload', this.handleUnload.bind(this));
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    console.log(`LearningTracker: Bắt đầu theo dõi cho bài giảng ${lectureId}`);
  }

  /**
   * Dừng theo dõi thời gian học tập
   */
  stopTracking() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Gửi ping cuối cùng khi dừng
    if (this.isActive) {
      this.sendPing();
    }

    this.isActive = false;
    window.removeEventListener('beforeunload', this.handleUnload.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    console.log('LearningTracker: Dừng theo dõi');
  }

  /**
   * Gửi ping đến server
   */
  async sendPing() {
    if (!this.isActive || !this.userId || !this.lectureId) return;

    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          lecture_id: this.lectureId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Lỗi ping: ${response.status}`);
      }

      const data = await response.json();
      console.log('LearningTracker: Ping thành công', data);
    } catch (error) {
      console.error('LearningTracker: Lỗi khi gửi ping', error);
    }
  }

  /**
   * Xử lý khi trang bị đóng
   * @param {Event} event 
   */
  handleUnload(event) {
    // Sử dụng beacon API để đảm bảo dữ liệu được gửi ngay cả khi trang đóng
    if (this.isActive && navigator.sendBeacon) {
      const data = JSON.stringify({
        user_id: this.userId,
        lecture_id: this.lectureId,
        timestamp: new Date().toISOString()
      });
      
      navigator.sendBeacon(
        this.options.apiEndpoint, 
        new Blob([data], { type: 'application/json' })
      );
    }
  }

  /**
   * Xử lý khi trang bị ẩn (chuyển tab)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab không còn hiển thị - tạm dừng tracking
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    } else {
      // Tab hiển thị lại - tiếp tục tracking
      if (this.isActive && !this.timer) {
        this.sendPing(); // Gửi ping ngay khi quay lại
        this.timer = setInterval(() => {
          this.sendPing();
        }, this.options.pingInterval);
      }
    }
  }
}

// Ví dụ sử dụng:
/*
// Tạo instance của tracker
const learningTracker = new LearningTracker({
  apiEndpoint: '/api/learning/ping', // Có thể thay đổi endpoint
  pingInterval: 120000 // 2 phút
});

// Bắt đầu theo dõi khi người dùng bắt đầu xem bài giảng
function startLesson(userId, lectureId) {
  learningTracker.startTracking(userId, lectureId);
}

// Dừng theo dõi khi người dùng rời khỏi trang bài giảng
function endLesson() {
  learningTracker.stopTracking();
}
*/

// Thay vì export, gán vào window
window.LearningTracker = LearningTracker; 