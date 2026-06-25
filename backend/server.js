const express = require('express');
    const cors = require('cors');
    require('dotenv').config();

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware
    app.use(cors());
    app.use(express.json()); // Đọc dữ liệu JSON từ request body

    // Route kiểm tra môi trường
    app.get('/', (req, res) => {
        res.send('Trang web đang chạy ổn định...');
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });