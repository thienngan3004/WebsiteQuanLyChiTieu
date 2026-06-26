const express = require("express");
const router = express.Router();
const db = require("./db"); // Import file cấu hình Connection Pool MySQL của ngày Thứ 2
const authMiddleware = require("./authMiddleware"); // Import Auth Middleware JWT của ngày Thứ 3

// ==========================================================
// 1. GET /api/categories - Lấy danh sách danh mục của user
// ==========================================================
router.get("/", authMiddleware, async (req, res) => {
  // req.user.id được bóc tách và truyền xuống từ authMiddleware sau khi verify mã JWT thành công
  const userId = req.user.id; 

  const query = "SELECT id, name, created_at FROM categories WHERE user_id = ? ORDER BY id DESC";

  try {
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Lỗi SELECT categories:", err);
        return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh mục." });
      }
      // Trả về danh sách danh mục dưới dạng chuỗi JSON
      return res.status(200).json(results);
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ." });
  }
});

// ==========================================================
// 2. POST /api/categories - Thêm mới danh mục chi tiêu (Cập nhật chuẩn Database)
// ==========================================================
router.post("/", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { name, type } = req.body; // Bóc tách thêm trường type từ body do frontend gửi lên
  
    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên danh mục không được để trống." });
    }
  
    // Kiểm tra giá trị type hợp lệ theo ENUM trong Database
    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Loại danh mục (type) phải là 'income' hoặc 'expense'." });
    }
  
    const insertQuery = "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)";
  
    try {
      db.query(insertQuery, [userId, name.trim(), type], (err, result) => {
        if (err) {
          console.error("Lỗi INSERT category:", err);
          return res.status(500).json({ message: "Lỗi hệ thống khi thêm danh mục." });
        }
        
        // Trả về phản hồi thành công (Mã trạng thái 201 Created đúng chuẩn kiểm thử)
        return res.status(201).json({
          message: "Thêm danh mục thành công!",
          category: {
            id: result.insertId,
            name: name.trim(),
            type: type
          }
        });
      });
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({ message: "Lỗi máy chủ." });
    }
  });

module.exports = router;