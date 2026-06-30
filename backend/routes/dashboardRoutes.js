const express = require("express");
const router = express.Router();
const db = require("../config/db"); 
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/reports-data", authMiddleware, async (req, res) => {
    const user_id = req.user.id;
    const { startDate, endDate } = req.query;

    try {
        // 1. Tính tổng Thu và tổng Chi theo khoảng ngày
        const summaryQuery = `
            SELECT 
                IFNULL(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
                IFNULL(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
            FROM transactions
            WHERE user_id = ? AND date BETWEEN ? AND ?
        `;
        const [summaryRows] = await db.query(summaryQuery, [user_id, startDate, endDate]);
        
        const totalIncome = summaryRows[0] ? parseFloat(summaryRows[0].totalIncome) : 0;
        const totalExpense = summaryRows[0] ? parseFloat(summaryRows[0].totalExpense) : 0;
        const netSavings = totalIncome - totalExpense;

        // 2. JOIN sang bảng categories lấy danh mục chi nhiều nhất (Đã bọc [topExpenseRows])
        const topExpenseQuery = `
            SELECT c.name AS category, SUM(t.amount) as total_amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'expense' AND t.date BETWEEN ? AND ?
            GROUP BY t.category_id, c.name
            ORDER BY total_amount DESC
            LIMIT 1
        `;
        const [topExpenseRows] = await db.query(topExpenseQuery, [user_id, startDate, endDate]);
        
        let topCategory = "Không có chi tiêu";
        if (topExpenseRows && topExpenseRows.length > 0 && topExpenseRows[0]) {
            topCategory = `${topExpenseRows[0].category} (${parseFloat(topExpenseRows[0].total_amount).toLocaleString('vi-VN')}đ)`;
        }

        // 3. JOIN sang bảng categories lấy dữ liệu vẽ biểu đồ (Đã bọc [categoryRows])
        const categoryShareQuery = `
            SELECT c.name AS category, SUM(t.amount) as amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'expense' AND t.date BETWEEN ? AND ?
            GROUP BY t.category_id, c.name
        `;
        const [categoryRows] = await db.query(categoryShareQuery, [user_id, startDate, endDate]);
        
        const chartLabels = (categoryRows && categoryRows.length > 0) ? categoryRows.map(row => row.category) : [];
        const chartData = (categoryRows && categoryRows.length > 0) ? categoryRows.map(row => parseFloat(row.amount)) : [];

        // Trả kết quả JSON sạch sẽ về Frontend
        return res.json({
            summary: {
                totalIncome: totalIncome.toLocaleString('vi-VN') + "đ",
                totalExpense: totalExpense.toLocaleString('vi-VN') + "đ",
                netSavings: netSavings.toLocaleString('vi-VN') + "đ",
                topExpenseCategory: topCategory
            },
            chart: {
                labels: chartLabels,
                data: chartData
            }
        });

    } catch (error) {
        console.error("Lỗi SQL thực tế tại Backend:", error);
        return res.status(500).json({ error: "Lỗi hệ thống khi xử lý truy vấn dữ liệu." });
    }
});

module.exports = router;