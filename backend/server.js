const express = require('express');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/aiRoutes');
const transactionRoutes = require('./routes/transaction');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes'); 
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization', 'authoriztion'], 
    credentials: true
}));


app.use(express.json()); 

// Cấu hình các tuyến đường API
app.use('/api/auth', authRoutes); 
app.use("/api/transactions", require("./routes/transaction"));
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/dashboard', dashboardRoutes)

app.get('/', (req, res) => {
    res.send('Trang web đang chạy ổn định...');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});