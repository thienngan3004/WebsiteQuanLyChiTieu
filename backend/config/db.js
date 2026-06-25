const mysql = require('mysql2/promise'); 
require('dotenv').config();

// Khởi tạo Pool kết nối dựa trên thông số trong file .env
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'quanlychitieu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối khi khởi động server
pool.getConnection()
    .then(connection => {
        console.log('Kết nối MySQL database qua Connection Pool thành công!');
        connection.release(); // Trả lại kết nối vào pool
    })
    .catch(err => {
        console.error('Lỗi kết nối Database!', err.message);
    });

module.exports = pool;