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
            return res.status(400).json({ error: "Email này đã được sử dụng rồi ní ơi!" });
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
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác!" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác!" });
        }

        const token = jwt.sign(
            { id: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        return res.status(200).json({
            message: "Đăng nhập hệ thống thành công!",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error("Lỗi API Đăng nhập:", error);
        return res.status(500).json({ error: "Lỗi hệ thống, không thể đăng nhập lúc này." });
    }
};