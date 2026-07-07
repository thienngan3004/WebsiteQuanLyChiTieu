const express = require("express");
const router = express.Router();
const db = require("../config/db"); 
const authMiddleware = require("../middlewares/authMiddleware");

// =========================
// Lấy danh sách giao dịch (Chỉ lấy của người đang đăng nhập)
// =========================
router.get("/", authMiddleware, async (req, res) => {
  try {
    // 🌟 SỬA: Lấy chính xác ID người dùng từ Token thông qua Middleware
    const user_id = req.user.id;

    // 🌟 SỬA: Nhét thêm điều kiện WHERE t.user_id = ? để không bị nhìn thấy dữ liệu của acc khác
    const [rows] = await db.query(`
      SELECT t.*, c.name AS category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC
    `, [user_id]);

    res.json(rows);
  } catch (err) {
    console.error("🔴 LỖI GET TRANSACTIONS:", err);
    res.status(500).json({ error: "Lỗi hệ thống, không thể lấy danh sách giao dịch." });
  }
});

// =========================
// Thêm giao dịch (Có nguồn tiền: Tiền mặt, Thẻ, Ví điện tử)
// =========================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { amount, type, category_id, date, description, source_type } = req.body;

    // 🌟 SỬA: Thêm cột source_type vào câu lệnh INSERT và truyền mảng tham số tương ứng (đúng số lượng ?)
    const [result] = await db.query(
      `
      INSERT INTO transactions (amount, type, category_id, date, description, user_id, source_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [amount, type, category_id, date, description, user_id, source_type || 'cash']
    );

    res.json({
      success: true,
      id: result.insertId,
      message: "Thêm giao dịch thành công"
    });
  } catch (err) {
    console.error("🔴 LỖI POST TRANSACTION:", err);
    res.status(500).json({ error: "Không thể thêm giao dịch." });
  }
});

// =========================
// Sửa giao dịch (Bảo mật: Chỉ cho sửa nếu trúng chủ sở hữu)
// =========================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { amount, type, category_id, date, description, source_type } = req.body;

    // 🌟 SỬA: Cập nhật thêm cột source_type và ép điều kiện chặn sửa bậy của user khác bằng user_id=?
    const [result] = await db.query(
      `
      UPDATE transactions
      SET amount=?, type=?, category_id=?, date=?, description=?, source_type=?
      WHERE id=? AND user_id=?
      `,
      [amount, type, category_id, date, description, source_type || 'cash', req.params.id, user_id]
    );

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    console.error("🔴 LỖI PUT TRANSACTION:", err);
    res.status(500).json({ error: "Không thể cập nhật giao dịch." });
  }
});

// =========================
// Xóa giao dịch (Bảo mật: Chỉ cho xóa nếu trúng chủ sở hữu)
// =========================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;

    // 🌟 SỬA: Thêm điều kiện user_id để tránh việc xóa nhầm hoặc hack xóa id của người khác
    await db.query("DELETE FROM transactions WHERE id=? AND user_id=?", [req.params.id, user_id]);
    
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (err) {
    console.error("🔴 LỖI DELETE TRANSACTION:", err);
    res.status(500).json({ error: "Không thể xóa giao dịch." });
  }
});

module.exports = router;