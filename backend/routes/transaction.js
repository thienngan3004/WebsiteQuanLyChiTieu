const express = require("express");
const router = express.Router();
const db = require("../config/db"); 

// =========================
// Lấy danh sách giao dịch
// =========================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, c.name AS category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// =========================
// Thêm giao dịch
// =========================
router.post("/", async (req, res) => {
  const { amount, type, category_id, date, description, user_id } = req.body;
  try {
    const [result] = await db.query(
      `
      INSERT INTO transactions (amount, type, category_id, date, description, user_id)
      VALUES (?,?,?,?,?,?)
      `,
      [amount, type, category_id, date, description, user_id || 1]
    );
    res.json({
      success: true,
      id: result.insertId,
      message: "Thêm giao dịch thành công"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// =========================
// Sửa giao dịch
// =========================
router.put("/:id", async (req, res) => {
  const { amount, type, category_id, date, description } = req.body;
  try {
    await db.query(
      `
      UPDATE transactions
      SET amount=?, type=?, category_id=?, date=?, description=?
      WHERE id=?
      `,
      [amount, type, category_id, date, description, req.params.id]
    );
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// =========================
// Xóa giao dịch
// =========================
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM transactions WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Đã xóa" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;