const express = require("express");
const router = express.Router();
const db = require("../config/db"); 
const authMiddleware = require("../middlewares/authMiddleware");

// 1. API THÊM DANH MỤC (POST)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; 
    const { name, type } = req.body;

    // 1. Kiểm tra Validation đầu vào
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên danh mục không được để trống." });
    }
    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Loại danh mục phải là 'income' hoặc 'expense'." });
    }

    const categoryName = name.trim();

    // 2. 🔑 BƯỚC KHỐNG CHẾ: Kiểm tra xem danh mục này đã tồn tại chưa
    const checkQuery = "SELECT * FROM categories WHERE user_id = ? AND name = ? AND type = ?";
    let existingRows = [];

    if (typeof db.execute === "function") {
      [existingRows] = await db.execute(checkQuery, [userId, categoryName, type]);
    } else {
      [existingRows] = await db.query(checkQuery, [userId, categoryName, type]);
    }

    // Nếu tìm thấy dữ liệu trùng, chặn lại và trả lỗi về Frontend liền
    if (existingRows.length > 0) {
      return res.status(400).json({ 
        message: `Danh mục "${categoryName}" đã tồn tại!` 
      });
    }

    // 3. Nếu chưa trùng thì mới cho INSERT vào DB
    const insertQuery = "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)";
    let result;
    if (typeof db.execute === "function") {
      [result] = await db.execute(insertQuery, [userId, categoryName, type]);
    } else {
      [result] = await db.query(insertQuery, [userId, categoryName, type]);
    }

    return res.status(201).json({
      message: "Thêm danh mục thành công!",
      category: {
        id: result.insertId || result.id,
        user_id: userId,
        name: categoryName,
        type: type
      }
    });
  } catch (error) {
    console.error("Lỗi hệ thống tại POST /api/categories:", error);
    return res.status(500).json({ message: "Lỗi cơ sở dữ liệu.", error: error.message });
  }
});

// 2. API LẤY DANH SÁCH DANH MỤC (GET) - Giúp sửa lỗi đỏ 404/Network Error lúc tải trang
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const selectQuery = "SELECT * FROM categories WHERE user_id = ?";
    
    let rows;
    if (typeof db.execute === "function") {
      [rows] = await db.execute(selectQuery, [userId]);
    } else {
      [rows] = await db.query(selectQuery, [userId]);
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Lỗi hệ thống tại GET /api/categories:", error);
    return res.status(500).json({ message: "Lỗi không thể lấy danh mục.", error: error.message });
  }
});

module.exports = router;