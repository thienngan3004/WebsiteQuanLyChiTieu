const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// ==================== 1. HÀM ĐĂNG KÝ ====================
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!" });
    }

    try {
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Email này đã được sử dụng!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            message: "Đăng ký tài khoản thành công!",
            user: { id: result.insertId, name, email }
        });

    } catch (error) {
        console.error("Lỗi API Đăng ký:", error);
        return res.status(500).json({ error: "Lỗi hệ thống, không thể tạo tài khoản." });
    }
};

// ==================== 2. HÀM ĐĂNG NHẬP ====================
exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ email và mật khẩu!" });
    }
  
    try {
      // 1. Kiểm tra xem email có tồn tại không
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (rows.length === 0) {
        return res.status(401).json({ error: "Tài khoản email này không tồn tại!" });
      }
  
      const user = rows[0]; // Biến user được định nghĩa ở đây!
  
      // 2. So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Mật khẩu không chính xác!" });
      }
  
      // 3. Ký Token JWT (Đặt đúng chỗ này mới có biến user để dùng)
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "CA_DAU_SECRET_KEY",
        { expiresIn: "1d" }
      );
  
      // 4. Trả về cho Frontend
      res.status(200).json({
        message: "Đăng nhập thành công!",
        token: token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập" });
    }
  };