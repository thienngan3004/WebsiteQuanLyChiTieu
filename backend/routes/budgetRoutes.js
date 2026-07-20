const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");

// 1. POST /api/budgets - Thiết lập hoặc Cập nhật ngân sách tháng (201 Created / 400 Bad Request)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, month, year } = req.body;

    // Validation dữ liệu đầu vào
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Số tiền ngân sách phải lớn hơn 0." });
    }
    if (!month || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Tháng phải từ 1 đến 12." });
    }
    if (!year || isNaN(year) || year < 2000) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const finalCategoryId = category_id || null;

    // Sử dụng ON DUPLICATE KEY UPDATE: Trùng tổ hợp (user, category, month, year) thì tự cập nhật số tiền mới
    const query = `
      INSERT INTO budgets (user_id, category_id, month, year, amount)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount = VALUES(amount);
    `;

    let result;
    if (typeof db.execute === "function") {
      [result] = await db.execute(query, [userId, finalCategoryId, month, year, amount]);
    } else {
      [result] = await db.query(query, [userId, finalCategoryId, month, year, amount]);
    }

    return res.status(201).json({
      success: true,
      message: "Thiết lập ngân sách chi tiêu thành công!",
      data: { category_id: finalCategoryId, month, year, amount }
    });
  } catch (error) {
    console.error("Lỗi POST /api/budgets:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
});

// 2. GET /api/budgets - Lấy danh sách ngân sách theo tháng và năm (200 OK)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query; // Nhận từ query params: ?month=6&year=2026

    if (!month || !year) {
      return res.status(400).json({ message: "Vui lòng cung cấp đủ tham số month và year." });
    }

    const query = `
      SELECT b.*, c.name AS category_name 
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
    `;

    let rows;
    if (typeof db.execute === "function") {
      [rows] = await db.execute(query, [userId, month, year]);
    } else {
      [rows] = await db.query(query, [userId, month, year]);
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Lỗi GET /api/budgets:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
});

// 3. DELETE /api/budgets/:id - Xóa cấu hình ngân sách (200 OK)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;

    const query = "DELETE FROM budgets WHERE id = ? AND user_id = ?";
    
    let result;
    if (typeof db.execute === "function") {
      [result] = await db.execute(query, [budgetId, userId]);
    } else {
      [result] = await db.query(query, [budgetId, userId]);
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Không tìm thấy ngân sách cần xóa hoặc bạn không có quyền." });
    }

    return res.status(200).json({ success: true, message: "Xóa cấu hình ngân sách thành công!" });
  } catch (error) {
    console.error("Lỗi DELETE /api/budgets:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
});

// GET /api/budgets/check-warnings - Lấy danh sách các danh mục CÓ đặt ngân sách và tính toán % đã tiêu
router.get("/check-warnings", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Lấy tháng và năm hiện tại để tính toán dữ liệu thời gian thực
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // SQL: Đã đổi sang định dạng '%d-%m-%Y' để đọc chuỗi gạch ngang (VD: 18-07-2026)
    const query = `
      SELECT 
        b.id AS budget_id,
        b.category_id,
        c.name AS category_name,
        b.amount AS budget_limit,
        COALESCE(SUM(t.amount), 0) AS total_spent,
        ROUND((COALESCE(SUM(t.amount), 0) / b.amount) * 100, 2) AS spent_percentage
      FROM budgets b
      INNER JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON b.category_id = t.category_id 
        AND t.user_id = b.user_id 
        AND t.type = 'expense'
        AND MONTH(t.date) = MONTH(CURRENT_DATE())
        AND YEAR(t.date) = YEAR(CURRENT_DATE())
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      GROUP BY b.id, b.category_id, c.name, b.amount
    `;

    let rows;
    if (typeof db.execute === "function") {
      [rows] = await db.execute(query, [userId, currentMonth, currentYear]);
    } else {
      [rows] = await db.query(query, [userId, currentMonth, currentYear]);
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Lỗi GET /api/budgets/check-warnings:", error);
    return res.status(500).json({ message: "Lỗi hệ thống.", error: error.message });
  }
});

module.exports = router;