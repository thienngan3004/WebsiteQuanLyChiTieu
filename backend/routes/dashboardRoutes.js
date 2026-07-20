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

router.get("/balance-503020", authMiddleware , async (req, res) => {
    // Giả sử lấy userId từ middleware xác thực hoặc hardcode để test
    const userId = req.user?.id || 3; 
  
    try {
      // 1. Tính tổng thu nhập (type = 'income') trong tháng hiện tại của User
      const [incomeRes] = await db.query(
        `SELECT SUM(amount) as total 
         FROM transactions 
         WHERE user_id = ? AND type = 'income' AND MONTH(date) = MONTH(NOW()) AND YEAR(date) = YEAR(NOW())`,
        [userId]
      );
      const totalIncome = parseFloat(incomeRes[0].total) || 0;
  
      // 2. Lấy tất cả khoản chi (type = 'expense') trong tháng kèm theo tên danh mục để phân loại linh động
      const [expenseRes] = await db.query(
        `SELECT t.amount, c.name as category_name 
         FROM transactions t 
         JOIN categories c ON t.category_id = c.id 
         WHERE t.user_id = ? AND t.type = 'expense' AND MONTH(t.date) = MONTH(NOW()) AND YEAR(t.date) = YEAR(NOW())`,
        [userId]
      );
  
      let thietYeu = 0; // Nhóm Needs (50%)
      let soThich = 0;  // Nhóm Wants (30%)
  
      // 3. Quét qua từng dòng dữ liệu thật dưới DB để phân loại bằng từ khóa (lowercase để tránh lệch chữ hoa/thường)
      expenseRes.forEach(row => {
        const categoryName = row.category_name ? row.category_name.toLowerCase() : "";
        const amount = parseFloat(row.amount) || 0;
        
        // Nhóm Thiết yếu (Needs): Ăn uống, ăn sáng, gia đình, hóa đơn, nhà cửa, điện nước...
        if (
          categoryName.includes("ăn uống") || 
          categoryName.includes("ăn sáng") || 
          categoryName.includes("gia đình") || 
          categoryName.includes("sinh hoạt")
        ) {
          thietYeu += amount;
        } 
        // Nhóm Sở thích / Hưởng thụ (Wants): Mua sắm, bạn bè, giải trí, du lịch, mỹ phẩm, quần áo...
        else if (
          categoryName.includes("mua sắm") || 
          categoryName.includes("bạn bè") || 
          categoryName.includes("giải trí") || 
          categoryName.includes("mỹ phẩm")
        ) {
          soThich += amount;
        } 
        // Các danh mục phát sinh khác (ví dụ: quyên góp, học tập...)
        else {
          soThich += amount; 
        }
      });
  
      // 4. Tính toán Tích lũy / Số dư thực tế còn lại (Savings - 20%)
      // Lấy Tổng thu nhập trừ đi tổng tất cả các khoản chi thực tế trong tháng
      const tongChiThucTe = thietYeu + soThich;
      const soDuThucTe = totalIncome - tongChiThucTe;
  
      // 5. Trả kết quả JSON chuẩn chỉnh về cho Frontend dựng cột biểu đồ
      res.json({
        success: true,
        data: {
          totalIncome: totalIncome,
          // Hạn mức lý thuyết (Chuẩn 50/30/20 tính dựa trên tổng thu nhập thực tế)
          targetNeeds: totalIncome * 0.5,
          targetWants: totalIncome * 0.3,
          targetSavings: totalIncome * 0.2,
          // Số liệu chi tiêu thực tế bốc từ Database lên
          realNeeds: thietYeu,
          realWants: soThich,
          realSavings: soDuThucTe > 0 ? soDuThucTe : 0 // Nếu chi tiêu vượt quá thu nhập (âm tiền) thì hiển thị số dư bằng 0 để tránh biểu đồ bị méo tụt xuống dưới
        }
      });
  
    } catch (error) {
      console.error("Lỗi API 50/30/20:", error);
      res.status(500).json({ 
        success: false, 
        message: "Có lỗi xảy ra khi tính toán dữ liệu cân đối tài chính.",
        error: error.message 
      });
    }
  });

module.exports = router;