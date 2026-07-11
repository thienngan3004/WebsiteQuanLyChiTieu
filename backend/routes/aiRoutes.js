const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authMiddleware = require("../middlewares/authMiddleware");
const { testAIConnection } = require("../services/aiService");

// Khởi tạo instance chuẩn
const aiGen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Route Test kết nối
router.get("/test-connection", async (req, res) => {
  const result = await testAIConnection();
  if (result.success) {
    return res.status(200).json({
      message: "Kết nối Gemini thành công!",
      ai_reply: result.reply
    });
  } else {
    return res.status(500).json({
      message: "Lỗi kết nối API!",
      error: result.error
    });
  }
});

// 2. Route phân tích chi tiêu tự động
router.get("/analysis/spending", authMiddleware, async (req, res) => {
    const user_id = req.user.id; 

    try {
        const queryText = `
            SELECT c.name AS category_name, SUM(t.amount) AS total_amount 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND t.type = 'expense'
            GROUP BY c.name`;

        const [rows] = await db.query(queryText, [user_id]);

        if (rows.length === 0) {
            return res.json({ suggestions: "Bạn chưa có dữ liệu chi tiêu nào trong tháng này để trợ lý ảo phân tích." });
        }

        let spendingContext = "Dữ liệu chi tiêu thực tế của người dùng:\n";
        rows.forEach(item => {
            spendingContext += `- Danh mục [${item.category_name}]: đã tiêu ${parseFloat(item.total_amount).toLocaleString()} VND\n`;
        });
        
        const model = aiGen.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `Bạn là một Cố vấn Quản lý Tài chính Cá nhân Chuyên nghiệp. 
            Dựa vào số liệu chi tiêu được cung cấp, hãy đưa ra phản hồi bằng tiếng Việt ngắn gọn (dưới 150 từ) gồm 2 phần:
            1. Nhận xét nhóm ngành nào đang chiếm tỷ trọng quá cao bất hợp lý.
            2. Đưa ra 2 hành động cụ thể thực tế giúp họ tiết kiệm tiền tốt hơn.`
        });

        const result = await model.generateContent(spendingContext);
        const responseText = await result.response.text(); // Đảm bảo lấy text đồng bộ
        return res.json({ suggestions: responseText });

    } catch (error) {
        console.error("Lỗi xử lý Gemini tại /analysis/spending:", error);
        return res.status(500).json({ error: "Hệ thống phân tích AI đang gặp sự cố." });
    }
});
 
// 3. Route Chatbot Assistant
router.post("/chat", authMiddleware, async (req, res) => {
    const { message } = req.body;
    const user_id = req.user.id;
  
    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Tin nhắn không được để trống." });
    }
  
    try {
        // 🌟 BƯỚC 1: Lấy CHI TIẾT từng giao dịch trong tháng này
        // Hãy đảm bảo user_id đã được định nghĩa ở phía trên (thường là từ req.user.id)
        const [transactions] = await db.query(
            `SELECT 
                DATE_FORMAT(t.date, '%Y-%m-%d') AS transaction_date, 
                c.name AS category_name, 
                t.type, 
                t.amount, 
                t.source_type, 
                t.description 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id        
            WHERE t.user_id = ? AND MONTH(t.date) = MONTH(CURRENT_DATE()) AND YEAR(t.date) = YEAR(CURRENT_DATE())
            ORDER BY t.date DESC`,
            [user_id]
        );
    
        // 🌟 BƯỚC 2: Gom danh sách giao dịch làm ngữ cảnh cho AI (Bỏ qua biến 'rows' dư thừa)
        let userSpendingContext = "";
    
        if (!transactions || transactions.length === 0) {
            userSpendingContext = "Người dùng này chưa có lịch sử giao dịch nào trong tháng này.\n";
        } else {
            userSpendingContext = "Danh sách lịch sử giao dịch chi tiết của người dùng trong tháng này:\n";
            
            // CHỈ CẦN MAP MỘT LẦN DUY NHẤT:
            const detailList = transactions.map(t => {
                return `- Ngày: ${t.transaction_date} | Số tiền: ${t.amount} VND | Loại: ${t.type === 'expense' ? 'Chi' : 'Thu'} | Danh mục: ${t.category_name} | Nguồn tiền: ${t.source_type} | Ghi chú: ${t.description || 'Không có'}`;
            }).join("\n");
    
            userSpendingContext += detailList;
        }
    
        // Sau đó ní đưa biến userSpendingContext này vào Prompt gửi cho Gemini là xong!
        console.log("=== NGỮ CẢNH GỬI AI ===\n", userSpendingContext);
  
        // 🌟 BƯỚC 3: Cấu hình hệ thống prompt
        const model = aiGen.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `
Bạn là một Trợ lý Cố vấn Tài chính thông minh của ứng dụng qltc_web. 
Nhiệm vụ của bạn là dựa vào dữ liệu giao dịch thực tế từ MySQL của người dùng được cung cấp dưới đây để trả lời câu hỏi và phân tích chi tiêu.

DỮ LIỆU CHI TIÊU THỰC TẾ TRONG THÁNG CỦA NGƯỜI DÙNG:
${userSpendingContext}

YÊU CẦU BẮT BUỘC KHI TRẢ LỜI VÀ PHÂN TÍCH:
1. ĐỊNH DẠNG CHI TIẾT: Khi liệt kê các khoản chi tiêu hoặc thu nhập, BẮT BUỘC phải hiển thị đầy đủ các thông tin theo cấu trúc sau:
   - Ngày tháng năm phát sinh giao dịch.
   - Nguồn tiền sử dụng (Ví dụ: Tiền mặt, Thẻ ngân hàng, Ví điện tử... dựa trên trường source_type). Nếu là cash thì hiển thị "Tiền mặt", nếu là card thì hiển thị "Thẻ ngân hàng", nếu là e-wallet thì hiển thị "Ví điện tử".
   - Nội dung/Ghi chú của giao dịch (trường description).
   Ví dụ định dạng hiển thị: "• [Ngày 12/07/2026] 300.000 VND - Quyên góp cho ttmc (Nguồn: Ví điện tử | Ghi chú: quyên góp cho ttmc)"

2. TÍNH TOÁN CHÍNH XÁC: Luôn tổng hợp tổng số tiền chi tiêu, tổng số tiền theo từng danh mục, và phân tích xem nguồn tiền nào (Tiền mặt/Thẻ/Ví) đang được quẹt nhiều nhất.

3. PHÂN TÍCH CHUYÊN SÂU (INSIGHT): Không chỉ liệt kê số liệu thô. Hãy đưa ra nhận xét:
   - Khoản chi nào chiếm tỷ trọng lớn nhất và có hợp lý không?
   - Đưa ra lời khuyên tài chính thực tế (Ví dụ: Nhắc nhở nếu chi tiêu qua Thẻ/Ví quá tay, hoặc cảnh báo nếu sắp vượt ngân sách).

4. NGÔN NGỮ: Trả lời bằng tiếng Việt, lịch sự, thân thiện, rõ ràng, sử dụng các ký tự xuống dòng và dấu đầu dòng để giao diện dễ đọc. KHÔNG sử dụng các ký tự định dạng phức tạp làm lỗi UI.
TUYỆT ĐỐI KHÔNG sử dụng ký tự ** để in đậm text, hãy xuất ra chuỗi thuần túy.`
        });
  
        // BƯỚC 4: Kết hợp ngữ cảnh và gửi câu hỏi
        const fullPrompt = `
        [DỮ LIỆU LỊCH SỬ THỰC TẾ]
        ${userSpendingContext}
  
        [CÂU HỎI NGƯỜI DÙNG]
        ${message}`;
  
        // BƯỚC 5: Gửi dữ liệu sang Gemini kèm Retry Logic
        let result;
        let retries = 3; 
        
        while (retries > 0) {
            try {
                result = await model.generateContent(fullPrompt);
                break; 
            } catch (geminiError) {
                if ((geminiError.status === 503 || geminiError.status === 429) && retries > 1) {
                    console.warn(`⚠️ Server Gemini đang bận/hết hạn ngạch, đang thử lại... (Còn ${retries - 1} lần thử)`);
                    retries--;
                    // Chờ thời gian tăng dần để tránh spam nghẽn mạng
                    await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000)); 
                } else {
                    throw geminiError; 
                }
            }
        }
        
        // Trả kết quả duy nhất về cho Frontend
        const responseText = await result.response.text();
        return res.json({ 
            reply: responseText 
        });
  
    } catch (error) {
        console.error("🔴 LỖI CHI TIẾT CHATBOT TẠI BACKEND:", error);
        return res.status(500).json({ error: "Trợ lý AI đang bận, vui lòng thử lại sau." });
    }
});

module.exports = router;