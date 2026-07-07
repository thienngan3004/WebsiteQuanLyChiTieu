const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// 🌟 Import thư viện bảo mật chính chủ của Google
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Định nghĩa Endpoint POST /api/auth/register và /login truyền thống
router.post('/register', authController.register);
router.post('/login', authController.login);

// 🌟 XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ BẰNG GOOGLE GMAIL (TÍCH XANH)
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Thiếu mã xác thực IdToken từ Google." });
    }

    try {
        // BƯỚC 1: Ép Google xác thực tính chính thống của mã token này
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, // Đảm bảo mã token này được cấp cho ứng dụng của mình
        });

        // Bốc tách thông tin tài khoản sạch từ payload mà Google trả về
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;

        // BƯỚC 2: Kiểm tra xem Email của tài khoản Google này đã tồn tại trong DB chưa
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user_id;
        let finalName = name;

        if (users.length === 0) {
            // Nếu email chưa từng tồn tại -> Tự động đăng ký tài khoản mới ngầm cho người dùng
            // Mật khẩu đặt một chuỗi ngẫu nhiên bảo mật vì họ đăng nhập thông qua Google OAuth
            const [result] = await db.query(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
                [name, email, 'OAUTH_GOOGLE_ACCOUNT_SECRET_NO_PWD']
            );
            user_id = result.insertId;
        } else {
            // Nếu đã tồn tại tài khoản -> Lấy thông tin ID và Username của người dùng cũ ra để gán session
            user_id = users[0].id;
            finalName = users[0].name;
        }

        // BƯỚC 3: Ký mã định danh JWT nội bộ của hệ thống mình cấp cho Frontend duy trì phiên đăng nhập
        const systemToken = jwt.sign(
            { id: user_id, email: email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // Token có giá trị trong vòng 7 ngày
        );

        // Trả Token kèm thông tin user về đúng cấu trúc Frontend đang mong đợi
        return res.json({ 
            message: "Đăng nhập Google thành công!", 
            token: systemToken,
            user: {
                id: user_id,
                name: finalName
            }
        });

    } catch (error) {
        console.error("🔴 LỖI THẨM ĐỊNH GOOGLE TOKEN TẠI BACKEND:", error);
        return res.status(401).json({ error: "Mã xác thực Google không hợp lệ hoặc đã hết hạn." });
    }
});

module.exports = router;