# 💰 ỨNG DỤNG QUẢN LÝ CHI TIÊU CÁ NHÂN TÍCH HỢP TRỢ LÝ AI

Một hệ thống quản lý tài chính cá nhân toàn diện, hỗ trợ người dùng theo dõi thu nhập, chi tiêu, trực quan hóa dữ liệu bằng biểu đồ sinh động và tương tác trực tiếp với Trợ lý tài chính thông minh dựa trên mô hình Gemini AI.

---

## 🚀 Tính Năng Chính Của Hệ Thống

### 1. Quản Lý Tài Chính Cơ Bản
* **Xác thực người dùng:** Đăng ký, đăng nhập bảo mật với JSON Web Token (JWT).
* **Giao dịch:** Thêm, sửa, xóa các khoản thu nhập và chi tiêu.
* **Danh mục & Ngân sách:** Phân loại chi tiêu (Ăn uống, Mua sắm, Di chuyển...) và thiết lập hạn mức ngân sách cảnh báo.

### 2. Dashboard Trực Quan Hóa Dữ Liệu
* Thống kê tổng số tiền đã chi, tổng số tiền đã thu và số dư hiện tại trong tháng/năm.
* Bộ lọc thời gian linh hoạt (theo Năm và các Tháng trong năm).
* Biểu đồ đường thể hiện xu hướng thu chi theo dòng thời gian.
* Biểu đồ tròn phân tích tỷ trọng các khoản thu nhập và danh mục chi tiêu thực tế.

### 3. Trợ Lý Trí Tuệ Nhân Tạo (AI Assistant)
* **Tích hợp Gemini AI:** Kết nối trực tiếp với Google Generative AI SDK (`gemini-1.5-flash`).
* **Trí nhớ giao dịch:** AI có khả năng đọc hiểu toàn bộ lịch sử chi tiêu thực tế của người dùng để đưa ra phản hồi chính xác.
* **Hội thoại thông minh:** Chatbot đóng vai trò Cố vấn tài chính chuyên nghiệp, phân tích thói quen và gợi ý hành động tiết kiệm bằng tiếng Việt thuần túy, ngắn gọn.
* **Cơ chế Retry Logic:** Tự động gọi lại (Tối đa 3 lần) khi hệ thống API của Google gặp tình trạng quá tải hoặc bận (Mã lỗi 503/429).

---

## 🛠️ Công Nghệ Sử Dụng

* **Frontend:** React.js, Vite, Axios, Chart.js / Recharts, TailwindCSS.
* **Backend:** Node.js, Express.js, JWT Authentication.
* **Database:** MySQL (Kết nối qua Connection Pool tăng hiệu năng).
* **AI Integration:** `@google/generative-ai` SDK.

---

## 📦 Hướng Dẫn Cài Đặt Và Khởi Chạy

### 1. Cấu hình Môi trường (.env)

Tại thư mục `/backend`, tạo file `.env` và cấu hình các biến sau:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Khởi chạy Backend
```bash
cd backend
npm install
node server.js
```
*Server Backend sẽ chạy tại địa chỉ: `http://localhost:5000`*

### 3. Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```
*Giao diện người dùng sẽ chạy tại địa chỉ: `http://localhost:5173`*

---

## 📁 Cấu Trúc Thư Mục Dự Án

qltc_web/
├── backend/
│   ├── config/
│   │   └── db.js                # Cấu hình Connection Pool kết nối MySQL
│   ├── controllers/
│   │   └── authController.js    # Xử lý logic Đăng ký / Đăng nhập
│   ├── middlewares/
│   │   └── authMiddleware.js    # Đánh chặn, kiểm tra và giải mã JWT hợp lệ
│   ├── routes/
│   │   ├── aiRoutes.js          # Hệ thống API kết nối với Trợ lý ảo Gemini AI
│   │   ├── authRoutes.js        # API xác thực người dùng
│   │   ├── budgetRoutes.js      # API quản lý hạn mức ngân sách chi tiêu
│   │   ├── categoryRoutes.js    # API bóc tách danh mục (Categories)
│   │   ├── dashboardRoutes.js   # API tổng hợp số liệu tính toán cho biểu đồ
│   │   └── transaction.js       # API CRUD dữ liệu các giao dịch tài chính
│   ├── services/
│   │   └── aiService.js         # Hàm dịch vụ test kết nối API của Google
│   ├── node_modules/            # Thư mục chứa các gói thư viện Backend
│   ├── .env                     # File lưu trữ toàn bộ khóa bảo mật cấu hình
│   ├── package.json             # Khai báo script chạy và thư viện cài đặt
│   └── server.js                # File cổng khởi chạy Core chính của Backend Express
├── frontend/
│   ├── public/                  # Chứa logo, hình ảnh, tài nguyên tĩnh
│   ├── src/
│   │   ├── components/
|   |   |   ├── Footer.jsx
│   │   │   ├── Header.jsx       # Thanh điều hướng Navbar (Dashboard, Transactions, Reports)
│   │   │   └── Layout.jsx       
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Trang tổng quan, hiển thị các biểu đồ phân tích trực quan
│   │   │   ├── Login.jsx        # Trang đăng nhập
│   │   │   ├── Register.jsx     # Trang đăng ký
│   │   │   ├── Transactions.jsx # Trang quản lý, thêm/sửa/xóa danh sách thu chi
│   │   │   ├── Reports.jsx      # Trang trích xuất báo cáo dữ liệu, thống kê tài chính
│   │   │   └── ChatBot.jsx      # Giao diện khung chat trò chuyện với Cố vấn AI
│   │   ├── App.jsx              # Quản lý định tuyến Router (Gắn component với path url)
│   │   ├── main.jsx             # File khởi tạo và render dự án React lên DOM
│   │   └── index.css            # File định hình phong cách, giao diện chung
│   ├── package.json             # Khai báo các thư viện Vite, Axios, Chart.js...
│   └── vite.config.js           # Cấu hình đóng gói dự án Frontend bằng Vite
└── README.md                    # Tài liệu hướng dẫn cài đặt và tổng quan dự án
```
