const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

// Cấu hình các tuyến đường API
app.use('/api/auth', authRoutes); 

app.get('/', (req, res) => {
    res.send('Trang web đang chạy ổn định...');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});