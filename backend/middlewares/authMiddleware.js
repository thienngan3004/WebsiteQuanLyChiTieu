const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token bảo mật." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "YOUR_SECRET_KEY", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token đã hết hạn hoặc không hợp lệ." });
    }
    req.user = user;
    next();
  });
};
module.exports = authMiddleware;


const verifyToken = (req, res, next) => {
  // Lấy token từ Header "Authorization" gửi lên (Định dạng chuẩn: Bearer <token>)
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Nếu không có token -> Chặn lại luôn, báo lỗi chưa xác thực
  if (!token) {
    return res.status(401).json({ error: "Ní ơi! Bạn không có quyền truy cập, vui lòng đăng nhập trước." });
  }

  try {
    // Giải mã và kiểm tra token xem có hợp lệ / hết hạn không
    // Mẹo: Đảm bảo biến process.env.JWT_SECRET trong file .env của ní trùng khớp với lúc tạo token khi Login nhé!
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CA_DAU_SECRET_KEY");
    
    // Gán thông tin user đã giải mã (bao gồm cả id) vào req.user để các router phía sau sử dụng
    req.user = decoded; 
    
    next(); // Token hợp lệ, cho phép đi tiếp vào Controller/Router xử lý dữ liệu thật
  } catch (err) {
    return res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn rồi ní ơi!" });
  }
};

module.exports = verifyToken;