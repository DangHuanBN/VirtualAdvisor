-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 04, 2025 lúc 05:51 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `virtualadvisor`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_training`
--

CREATE TABLE `ai_training` (
  `training_id` int(11) NOT NULL,
  `lecture_id` int(11) DEFAULT NULL,
  `vector_store_path` varchar(255) NOT NULL,
  `training_time` datetime DEFAULT current_timestamp(),
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `ai_training`
--

INSERT INTO `ai_training` (`training_id`, `lecture_id`, `vector_store_path`, `training_time`, `status`) VALUES
(1, 1, 'vector_store\\096bff4d-d763-4c92-9a98-f582879f3553_Chuong1.pkl', '2025-05-04 10:16:20', 'completed'),
(2, 2, 'vector_store\\46a975b6-f461-4c5c-ae69-bc04ae3ba603_Chuong2.pkl', '2025-05-04 10:16:24', 'completed'),
(3, 3, 'vector_store\\d814fa09-5ce9-423e-97e9-cc4cee9c4418_Chuong3.pkl', '2025-05-04 10:16:40', 'completed'),
(4, 4, 'vector_store\\6f1e50ff-3c43-4d6b-a892-7b0596fed170_Chuong4.pkl', '2025-05-04 10:16:47', 'completed'),
(5, 5, 'vector_store\\6e955b6a-6966-4fe5-b31e-7102e625bcfd_Chuong5.pkl', '2025-05-04 10:21:36', 'completed'),
(6, 6, 'vector_store\\60899b06-873e-4594-a014-e3b576ee07b3_Chuong6.pkl', '2025-05-04 10:21:34', 'completed'),
(7, 7, 'vector_store\\1775c966-5858-4848-b517-493f4d040061_Chuong7.pkl', '2025-05-04 10:21:32', 'completed'),
(8, 8, 'vector_store\\98ffd486-fd29-431b-81ac-9a30ea851fdb_Bai1_Tongquan.pkl', '2025-05-04 10:38:34', 'completed'),
(9, 9, 'vector_store\\77e3901d-c30e-4802-ae79-8938e03ac0e3_Bai2_JavaCoBan.pkl', '2025-05-04 10:49:38', 'completed'),
(10, 10, 'vector_store\\93d7115a-dd2d-4ce5-a192-9cf52e1a3ba8_Bai3_Huongdoituong.pkl', '2025-05-04 10:49:34', 'completed'),
(11, 11, 'vector_store\\11bd318c-7338-4143-8a65-2ab3ee1f9965_Bai4_Laptrinhgiaodien.pkl', '2025-05-04 10:49:36', 'completed');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chathistory`
--

CREATE TABLE `chathistory` (
  `chat_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `chathistory`
--

INSERT INTO `chathistory` (`chat_id`, `user_id`, `message`, `timestamp`) VALUES
(1, 3, 'câu hỏi: Thư mục res ____ câu trả lời: Thư mục res chứa tất cả các tài nguyên của ứng dụng (không phải code) chẳng hạn như ảnh bitmap, UI strings, XML layouts. Trong thư mục res có chứa nhiều thư mục khác như: drawable (chứa các ảnh khác nhau, trừ icon ứng dụng), mipmap (chứa icon ứng dụng với nhiều tỷ trọng khác nhau), values (chứa các file XML như strings, colors, styles) và layout (chứa các file XML giao diện của hệ thống).\n\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:17:44'),
(2, 3, 'câu hỏi: Giới thiệu về máy ảo GENYMOTION? ____ câu trả lời: Máy ảo Genymotion là trình giả lập Android phổ biến dựa trên VirtualBox. Genymotion cho phép bạn trải nghiệm các ứng dụng di động trên laptop hoặc máy tính để bàn lớn hơn mà không gặp vấn đề về hiệu suất. Đặc biệt dung lượng của nó thấp hơn đáng kể so với AVD. Cấu hình và cài đặt máy ảo Genymotion có thể tham khảo tại https://www.genymotion.com/\n\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:17:51'),
(3, 3, 'câu hỏi: menu và cách sử dụng ____ câu trả lời: Menu trong Android có 2 loại chính là OptionMenu và ContextMenu.\n\nOption Menu nằm trên ActionBar hoặc Toolbar ở phía bên phải. Nó hiển thị dưới dạng text, text+icon hoặc icon \"ba chấm\", và có thể tùy biến giao diện. Để tạo Option Menu, cần tạo thư mục \"menu\" trong \"res\", sau đó tạo file XML trong thư mục này (ví dụ: option_menu.xml).  Các item trong menu được tạo bằng thẻ `<item>` với các thuộc tính `id`, `title`, và `icon`.  Trong `MainActivity.java`, cần override hàm `onCreateOptionMenu` và sử dụng `getMenuInflater().inflate(R.menu.mymenu, menu)` để hiển thị menu.  Hàm `onOptionsItemSelected` được dùng để xử lý sự kiện khi item được chọn.\n\nContext Menu xuất hiện khi người dùng tác động lên một view (ví dụ: click vào ListView).\n\n\nThông tin được trích từ các bài giảng: Chương 4', '2025-05-04 10:18:15'),
(4, 3, 'câu hỏi: viewgroup là gì ____ câu trả lời: ViewGroup là các view đặc biệt, có thể chứa bên trong nó các view khác. ViewGroup là cửa sổ cha của các view con. ViewGroup = các view con + cách bố trí các view con đó bên trong.\n\n\nThông tin được trích từ các bài giảng: Chương 3', '2025-05-04 10:18:43'),
(5, 3, 'câu hỏi: cài đặt android studio ____ câu trả lời: Để cài đặt Android Studio, cần thực hiện các bước sau:\n\n1. Truy cập trang web https://developer.android.com/studio và chọn phiên bản phù hợp với hệ điều hành.\n2. Đồng ý điều khoản và tải bản cài đặt.\n3. Mở file cài đặt và nhấn Next.\n4. Nhấn Next để cài Android Studio và AVD.\n\nNgoài ra, cần cài đặt Java Development Kit. Việc cài đặt Android Studio cũng sẽ cài đặt kèm Android SDK, SDK manager, và nhiều công cụ khác.\n\n\nThông tin được trích từ các bài giảng: Chương 1, Chương 2', '2025-05-04 10:19:08'),
(6, 3, 'câu hỏi: lịch sử ra đời của java ____ câu trả lời: Cuối năm 1990, James Gosling và các cộng sự tại Sun Microsystems được giao nhiệm vụ xây dựng phần mềm lập trình cho các thiết bị điện tử dân dụng. Năm 1993, với sự bùng nổ của Internet và Web, Sun chuyển dự án này thành một môi trường lập trình Internet với tên dự án là Java. Năm 1995, Oak chính thức đổi tên thành Java, được đặt theo tên một hòn đảo trồng cà phê mà nhóm nghiên cứu đã ghé thăm. Mục đích ban đầu của Java là phát triển ứng dụng cho các thiết bị điện tử thông minh và tạo trang web động. Hiện nay, Java được sử dụng để phát triển nhiều loại ứng dụng khác nhau như cơ sở dữ liệu, mạng, Internet, games, viễn thông,...\n\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:39:07'),
(7, 3, 'câu hỏi: đặc tính của java ____ câu trả lời: Các đặc tính của Java bao gồm: đơn giản, khả chuyển, hướng đối tượng, phân tán, đa tiểu trình (multithread), an toàn, biên dịch và thông dịch, giải phóng bộ nhớ (Garbage Collection).\n\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:41:01'),
(8, 3, 'câu hỏi: đặc tính đơn giản ____ câu trả lời: Tôi không tìm thấy thông tin về \"đặc tính đơn giản\" trong các slide được cung cấp.\n\n\nThông tin được trích từ các bài giảng: Chương 1, Chương 5', '2025-05-04 10:41:54'),
(9, 3, 'câu hỏi: tính hướng đối tượng ____ câu trả lời: Thông tin được cung cấp không đề cập đến tính hướng đối tượng.\n\n\nThông tin được trích từ các bài giảng: Chương 1, Chương 5', '2025-05-04 10:42:22'),
(10, 3, 'câu hỏi: tính hướng đối tượng ____ câu trả lời: Không có thông tin về tính hướng đối tượng.\n\n\nThông tin được trích từ các bài giảng: Chương 1, Chương 5', '2025-05-04 10:42:30'),
(11, 3, 'câu hỏi: java là gì ____ câu trả lời: Dựa trên thông tin được cung cấp, không thể trả lời câu hỏi \"java là gì\". Mặc dù tài liệu đề cập đến Java, lịch sử ra đời, quy trình biên dịch và thực thi, nhưng không có định nghĩa cụ thể về Java.\n\n\nThông tin được trích từ các bài giảng: Chương 1, Chương 5', '2025-05-04 10:42:47'),
(12, 3, 'câu hỏi: CÁC DẠNG CÔNG NGHỆ JAVA ____ câu trả lời: Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn.\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:43:03'),
(13, 3, 'câu hỏi: CÁC DẠNG CÔNG NGHỆ JAVA ____ câu trả lời: CÁC DẠNG CÔNG NGHỆ JAVA bao gồm:\n\n* **Desktop applications - J2SE:** Phiên bản chuẩn - Java 2 Standard Edition. J2SE hỗ trợ viết các ứng dụng đơn, ứng dụng client-server.\n* **Java Applications:** ứng dụng Java thông thường trên desktop.\n* **Java Applets:** ứng dụng nhúng hoạt động trong trình duyệt web.\n\n\nThông tin được trích từ các bài giảng: Chương 1', '2025-05-04 10:43:33'),
(14, 3, 'câu hỏi: Khái niệm lớp ____ câu trả lời: Lớp được xem như một khuôn mẫu (template) của đối tượng (Object). Trong lớp bao gồm các thuộc tính của đối tượng (properties) và các phương thức (methods) tác động lên các thuộc tính. Đối tượng được xây dựng từ lớp nên được gọi là thể hiện của lớp (class instance).\n\n\nThông tin được trích từ các bài giảng: Chương 3: Hướng đối tượng trong Java', '2025-05-04 10:50:24'),
(15, 3, 'câu hỏi: thuộc tính của lớp ____ câu trả lời: Các thuộc tính (hay vùng dữ liệu/fields) của lớp được khai báo bên trong lớp, sử dụng tiền tố để xác định quyền truy xuất và kiểu dữ liệu. Ba tiền tố được sử dụng là public, private, và protected.\nCấu trúc khai báo như sau:\n```java\nclass <ClassName>\n{\n// khai báo những thuộc tính của lớp\n<tiền tố> <kiểu dữ liệu> field1;\n// …\n}\n```\n\n\nThông tin được trích từ các bài giảng: Chương 3: Hướng đối tượng trong Java', '2025-05-04 10:50:43');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `course`
--

CREATE TABLE `course` (
  `course_id` int(11) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `type` enum('tuantu','tudo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `course`
--

INSERT INTO `course` (`course_id`, `course_name`, `subject_id`, `type`) VALUES
(1, 'Lập trình Android', 1, 'tuantu'),
(2, 'Công nghệ Java', 2, 'tuantu');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `feedbackhistory`
--

CREATE TABLE `feedbackhistory` (
  `feedback_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `content` varchar(500) NOT NULL,
  `timestamp` date DEFAULT curdate(),
  `diem` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `feedbackhistory`
--

INSERT INTO `feedbackhistory` (`feedback_id`, `user_id`, `content`, `timestamp`, `diem`) VALUES
(1, 3, 'Đánh giá bài giảng 1: Bài giảng tốt', '2025-05-04', 10),
(2, 2, 'Đánh giá sinh viên [3]: Học giỏi', '2025-05-04', 10);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `learningpath`
--

CREATE TABLE `learningpath` (
  `path_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `path_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `learningpath`
--

INSERT INTO `learningpath` (`path_id`, `course_id`, `path_name`) VALUES
(1, 1, 'Lập trình Android'),
(2, 2, 'Công nghệ Java');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `learningpathdetail`
--

CREATE TABLE `learningpathdetail` (
  `detail_id` int(11) NOT NULL,
  `path_id` int(11) NOT NULL,
  `lecture_id` int(11) DEFAULT NULL,
  `order_number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `learningpathdetail`
--

INSERT INTO `learningpathdetail` (`detail_id`, `path_id`, `lecture_id`, `order_number`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 1, 3, 3),
(4, 1, 4, 4),
(5, 1, 5, 5),
(6, 1, 6, 6),
(7, 1, 7, 7),
(8, 2, 8, 1),
(9, 2, 9, 2),
(10, 2, 10, 3),
(11, 2, 11, 4);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lecture`
--

CREATE TABLE `lecture` (
  `lecture_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `upload_date` date DEFAULT curdate(),
  `type` enum('baigiang','baikiemtra','baithi') NOT NULL,
  `status` enum('chuahuanluyen','dahuanluyen') DEFAULT 'chuahuanluyen',
  `vector_path` varchar(255) DEFAULT NULL,
  `training_date` date DEFAULT NULL,
  `maxhours` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `lecture`
--

INSERT INTO `lecture` (`lecture_id`, `course_id`, `teacher_id`, `title`, `content`, `attachment`, `upload_date`, `type`, `status`, `vector_path`, `training_date`, `maxhours`) VALUES
(1, 1, 2, 'Chương 1', 'TỔNG QUAN VỀ LẬP TRÌNH ANDROID', '096bff4d-d763-4c92-9a98-f582879f3553_Chuong1.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\096bff4d-d763-4c92-9a98-f582879f3553_Chuong1.pkl', '2025-05-04', 4),
(2, 1, 2, 'Chương 2', 'LẬP TRÌNH ANDROID', '46a975b6-f461-4c5c-ae69-bc04ae3ba603_Chuong2.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\46a975b6-f461-4c5c-ae69-bc04ae3ba603_Chuong2.pkl', '2025-05-04', 4),
(3, 1, 2, 'Chương 3', 'LẬP TRÌNH USER INTERFACE TRONG ANDROID STUDIO', 'd814fa09-5ce9-423e-97e9-cc4cee9c4418_Chuong3.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\d814fa09-5ce9-423e-97e9-cc4cee9c4418_Chuong3.pkl', '2025-05-04', 4),
(4, 1, 2, 'Chương 4', 'LẬP TRÌNH USER INTERFACE NÂNG CAO', '6f1e50ff-3c43-4d6b-a892-7b0596fed170_Chuong4.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\6f1e50ff-3c43-4d6b-a892-7b0596fed170_Chuong4.pkl', '2025-05-04', 4),
(5, 1, 2, 'Chương 5', 'INTENT VÀ SERVICE', '6e955b6a-6966-4fe5-b31e-7102e625bcfd_Chuong5.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\6e955b6a-6966-4fe5-b31e-7102e625bcfd_Chuong5.pkl', '2025-05-04', 3),
(6, 1, 2, 'Chương 6', 'MULTIMEDIA TRONG ANDROID', '60899b06-873e-4594-a014-e3b576ee07b3_Chuong6.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\60899b06-873e-4594-a014-e3b576ee07b3_Chuong6.pkl', '2025-05-04', 3),
(7, 1, 2, 'Chương 7', 'JSON, JSON parser, Webservice', '1775c966-5858-4848-b517-493f4d040061_Chuong7.pptx', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\1775c966-5858-4848-b517-493f4d040061_Chuong7.pkl', '2025-05-04', 2),
(8, 2, 2, 'Chương 1:  TỔNG QUAN NGÔN NGỮ JAVA', ' TỔNG QUAN NGÔN NGỮ JAVA', '98ffd486-fd29-431b-81ac-9a30ea851fdb_Bai1_Tongquan.pdf', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\98ffd486-fd29-431b-81ac-9a30ea851fdb_Bai1_Tongquan.pkl', '2025-05-04', 3),
(9, 2, 2, 'Chương 2: JAVA CƠ BẢN ', 'JAVA CƠ BẢN ', '77e3901d-c30e-4802-ae79-8938e03ac0e3_Bai2_JavaCoBan.pdf', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\77e3901d-c30e-4802-ae79-8938e03ac0e3_Bai2_JavaCoBan.pkl', '2025-05-04', 4),
(10, 2, 2, 'Chương 3: Hướng đối tượng trong Java', 'Hướng đối tượng trong Java', '93d7115a-dd2d-4ce5-a192-9cf52e1a3ba8_Bai3_Huongdoituong.pdf', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\93d7115a-dd2d-4ce5-a192-9cf52e1a3ba8_Bai3_Huongdoituong.pkl', '2025-05-04', 4),
(11, 2, 2, 'Chương 4: Lập trình giao diện (GUI)', 'Lập trình giao diện (GUI)', '11bd318c-7338-4143-8a65-2ab3ee1f9965_Bai4_Laptrinhgiaodien.pdf', '2025-05-04', 'baigiang', 'dahuanluyen', 'vector_store\\11bd318c-7338-4143-8a65-2ab3ee1f9965_Bai4_Laptrinhgiaodien.pkl', '2025-05-04', 4);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notification`
--

CREATE TABLE `notification` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `notification`
--

INSERT INTO `notification` (`notification_id`, `user_id`, `content`, `timestamp`) VALUES
(1, 3, '[EVALUATION] Bạn được giảng viên Nguyễn Văn A đánh giá: Học giỏi', '2025-05-04 10:20:31');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `studentenrollment`
--

CREATE TABLE `studentenrollment` (
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `studentenrollment`
--

INSERT INTO `studentenrollment` (`user_id`, `course_id`) VALUES
(3, 1),
(3, 2);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `studytracking`
--

CREATE TABLE `studytracking` (
  `tracking_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `lecture_id` int(11) DEFAULT NULL,
  `progress` decimal(5,2) UNSIGNED NOT NULL,
  `status` enum('hoanthanh','chuahoanthanh') DEFAULT 'chuahoanthanh',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `studytracking`
--

INSERT INTO `studytracking` (`tracking_id`, `user_id`, `lecture_id`, `progress`, `status`, `start_date`, `end_date`) VALUES
(1, 3, 1, 100.00, 'hoanthanh', '2025-05-04', '2025-05-04');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `credits` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `subjects`
--

INSERT INTO `subjects` (`subject_id`, `subject_name`, `credits`) VALUES
(1, 'Lập trình di động', 3),
(2, 'Lập trình Java', 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` bit(1) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` enum('admin','teacher','student','other') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active' COMMENT 'Tr?ng th'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `dob`, `gender`, `address`, `email`, `phone`, `role`, `status`) VALUES
(1, 'admin', '1', 'Quản trị viên', NULL, NULL, NULL, 'qtv@gmail.com', NULL, 'admin', 'active'),
(2, 'teacher', '1', 'Nguyễn Văn A', NULL, NULL, NULL, 'nva@gmail.com', NULL, 'teacher', 'active'),
(3, 'huan1', '111111', 'Đăng Huấn', '2003-12-08', b'1', 'Nghiêm Xá - Việt Hùng - Quế Võ - Bắc Ninh', 'huan2003bn@gmail.com', '0347714730', 'student', 'active');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `__efmigrationshistory`
--

CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) NOT NULL,
  `ProductVersion` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `ai_training`
--
ALTER TABLE `ai_training`
  ADD PRIMARY KEY (`training_id`),
  ADD KEY `lecture_id` (`lecture_id`);

--
-- Chỉ mục cho bảng `chathistory`
--
ALTER TABLE `chathistory`
  ADD PRIMARY KEY (`chat_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `course`
--
ALTER TABLE `course`
  ADD PRIMARY KEY (`course_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Chỉ mục cho bảng `feedbackhistory`
--
ALTER TABLE `feedbackhistory`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `learningpath`
--
ALTER TABLE `learningpath`
  ADD PRIMARY KEY (`path_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Chỉ mục cho bảng `learningpathdetail`
--
ALTER TABLE `learningpathdetail`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `path_id` (`path_id`),
  ADD KEY `lecture_id` (`lecture_id`);

--
-- Chỉ mục cho bảng `lecture`
--
ALTER TABLE `lecture`
  ADD PRIMARY KEY (`lecture_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Chỉ mục cho bảng `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `studentenrollment`
--
ALTER TABLE `studentenrollment`
  ADD PRIMARY KEY (`user_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Chỉ mục cho bảng `studytracking`
--
ALTER TABLE `studytracking`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `lecture_id` (`lecture_id`);

--
-- Chỉ mục cho bảng `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Chỉ mục cho bảng `__efmigrationshistory`
--
ALTER TABLE `__efmigrationshistory`
  ADD PRIMARY KEY (`MigrationId`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `ai_training`
--
ALTER TABLE `ai_training`
  MODIFY `training_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `chathistory`
--
ALTER TABLE `chathistory`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `course`
--
ALTER TABLE `course`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `feedbackhistory`
--
ALTER TABLE `feedbackhistory`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `learningpath`
--
ALTER TABLE `learningpath`
  MODIFY `path_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `learningpathdetail`
--
ALTER TABLE `learningpathdetail`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `lecture`
--
ALTER TABLE `lecture`
  MODIFY `lecture_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `notification`
--
ALTER TABLE `notification`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `studytracking`
--
ALTER TABLE `studytracking`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `ai_training`
--
ALTER TABLE `ai_training`
  ADD CONSTRAINT `ai_training_ibfk_1` FOREIGN KEY (`lecture_id`) REFERENCES `lecture` (`lecture_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `chathistory`
--
ALTER TABLE `chathistory`
  ADD CONSTRAINT `chathistory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `course`
--
ALTER TABLE `course`
  ADD CONSTRAINT `fk_course_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `feedbackhistory`
--
ALTER TABLE `feedbackhistory`
  ADD CONSTRAINT `feedbackhistory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `learningpath`
--
ALTER TABLE `learningpath`
  ADD CONSTRAINT `fk_learningpath_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learningpath_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `learningpathdetail`
--
ALTER TABLE `learningpathdetail`
  ADD CONSTRAINT `fk_learningpathdetail_learningpath` FOREIGN KEY (`path_id`) REFERENCES `learningpath` (`path_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learningpathdetail_ibfk_1` FOREIGN KEY (`path_id`) REFERENCES `learningpath` (`path_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learningpathdetail_ibfk_2` FOREIGN KEY (`lecture_id`) REFERENCES `lecture` (`lecture_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `lecture`
--
ALTER TABLE `lecture`
  ADD CONSTRAINT `lecture_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lecture_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `studentenrollment`
--
ALTER TABLE `studentenrollment`
  ADD CONSTRAINT `studentenrollment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `studentenrollment_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `course` (`course_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `studytracking`
--
ALTER TABLE `studytracking`
  ADD CONSTRAINT `studytracking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `studytracking_ibfk_2` FOREIGN KEY (`lecture_id`) REFERENCES `lecture` (`lecture_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
