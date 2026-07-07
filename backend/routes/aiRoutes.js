// const express = require("express");
// const router = express.Router();
// const db = require("../config/db");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const authMiddleware = require("../middlewares/authMiddleware");
// const { testAIConnection } = require("../services/aiService");

// const aiGen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // 1. Route Test kết nối (Thứ 2)
// router.get("/test-connection", async (req, res) => {
//   const result = await testAIConnection();
//   if (result.success) {
//     return res.status(200).json({
//       message: "Kết nối Gemini thành công!",
//       ai_reply: result.reply
//     });
//   } else {
//     return res.status(500).json({
//       message: "Lỗi kết nối API!",
//       error: result.error
//     });
//   }
// });

// // 2. Route phân tích chi tiêu tự động (Thứ 3)
// router.get("/analysis/spending", authMiddleware, async (req, res) => {
//     const user_id = req.user.id; 

//     try {
//         const queryText = `
//             SELECT c.name AS category_name, SUM(t.amount) AS total_amount 
//             FROM transactions t
//             JOIN categories c ON t.category_id = c.id
//             WHERE t.user_id = ? AND t.type = 'expense'
//             GROUP BY c.name`;

//         const [rows] = await db.query(queryText, [user_id]);

        
//         if (rows.length === 0) {
//             return res.json({ suggestions: "Bạn chưa có dữ liệu chi tiêu nào trong tháng này để trợ lý ảo phân tích." });
//         }

//         let spendingContext = "Dữ liệu chi tiêu thực tế của người dùng:\n";
//         rows.forEach(item => {
//             spendingContext += `- Danh mục [${item.category_name}]: đã tiêu ${parseFloat(item.total_amount).toLocaleString()} VND\n`;
//         });
        
//         const model = aiGen.getGenerativeModel({ 
//             model: "gemini-1.5-flash",
//             systemInstruction: `Bạn là một Cố vấn Quản lý Tài chính Cá nhân Chuyên nghiệp. 
//             Dựa vào số liệu chi tiêu được cung cấp, hãy đưa ra phản hồi bằng tiếng Việt ngắn gọn (dưới 150 từ) gồm 2 phần:
//             1. Nhận xét nhóm ngành nào đang chiếm tỷ trọng quá cao bất hợp lý.
//             2. Đưa ra 2 hành động cụ thể thực tế giúp họ tiết kiệm tiền tốt hơn.`
//         });

//         const result = await model.generateContent(spendingContext);
//         return res.json({ suggestions: result.response.text() });

//     } catch (error) {
//         console.error("Lỗi xử lý Gemini:", error);
//         return res.status(500).json({ error: "Hệ thống phân tích AI đang gặp sự cố." });
//     }
// });
 
// // 3. CẬP NHẬT
// router.post("/assistant/chat", authMiddleware, async (req, res) => {
//     const { message } = req.body;
//     const user_id = req.user.id;
  
//     if (!message || !message.trim()) {
//         return res.status(400).json({ error: "Tin nhắn không được để trống." });
//     }
  
//     try {
//         // 🌟 BƯỚC 1: Lấy CHI TIẾT từng giao dịch trong tháng này
//         const queryText = `
//             SELECT 
//                 DATE_FORMAT(t.date, '%Y-%m-%d') AS transaction_date, 
//                 c.name AS category_name, 
//                 t.type, 
//                 t.amount, 
//                 t.description 
//             FROM transactions t
//             JOIN categories c ON t.category_id = c.id
//             WHERE t.user_id = ? AND MONTH(t.date) = MONTH(CURRENT_DATE()) AND YEAR(t.date) = YEAR(CURRENT_DATE())
//             ORDER BY t.date DESC`;
  
//         const [rows] = await db.query(queryText, [user_id]);
  
//         // 🌟 BƯỚC 2: Gom danh sách giao dịch làm ngữ cảnh cho AI
//         let userSpendingContext = "";
//         if (rows.length === 0) {
//             userSpendingContext = "Người dùng này chưa có lịch sử giao dịch nào trong tháng này.\n";
//         } else {
//             userSpendingContext = "Danh sách lịch sử giao dịch chi tiết của người dùng trong tháng này:\n";
//             rows.forEach(item => {
//                 const typeText = item.type === 'expense' ? 'Chi tiêu' : 'Thu nhập';
//                 userSpendingContext += `- Ngày: ${item.transaction_date} | Loại: ${typeText} | Danh mục: ${item.category_name} | Số tiền: ${parseFloat(item.amount).toLocaleString()} VND | Ghi chú: ${item.description || 'Không có'}\n`;
//             });
//         }
  
//         // 🌟 BƯỚC 3: Cấu hình hệ thống prompt
//         const model = aiGen.getGenerativeModel({
//             model: "gemini-1.5-flash",
//             systemInstruction: `Bạn là một Cố vấn tài chính cá nhân thông minh tuyệt đối.
//             Bạn có quyền xem CHI TIẾT từng giao dịch của người dùng ở mục [DỮ LIỆU LỊCH SỬ THỰC TẾ].
//             Khi người dùng hỏi xin danh sách, thống kê hoặc liệt kê giao dịch, hãy đọc kỹ ngày tháng, số tiền, ghi chú để phản hồi chính xác.
//             Trả lời bằng tiếng Việt ngắn gọn, dễ hiểu, xuống dòng rõ ràng cho từng giao dịch.
//             TUYỆT ĐỐI KHÔNG sử dụng ký tự ** để in đậm text, hãy xuất ra chuỗi thuần túy.`
//         });
  
//         // BƯỚC 4: Kết hợp ngữ cảnh và gửi câu hỏi
//         const fullPrompt = `
//         [DỮ LIỆU LỊCH SỬ THỰC TẾ]
//         ${userSpendingContext}
  
//         [CÂU HỎI NGƯỜI DÙNG]
//         ${message}`;
  
//         // BƯỚC 5: Gửi dữ liệu sang Gemini kèm Retry Logic
//         let result;
//         let retries = 3; 
        
//         while (retries > 0) {
//             try {
//                 result = await model.generateContent(fullPrompt);
//                 break; 
//             } catch (geminiError) {
//                 if ((geminiError.status === 503 || geminiError.status === 429) && retries > 1) {
//                     console.warn(`⚠️ Server Gemini đang bận/hết hạn ngạch, đang thử lại... (Còn ${retries - 1} lần thử)`);
//                     retries--;
//                     await new Promise(resolve => setTimeout(resolve, 1500)); 
//                 } else {
//                     throw geminiError; 
//                 }
//             }
//         }
        
//         // Trả kết quả duy nhất về cho Frontend (Đã xóa dòng dư thừa)
//         const responseText = await result.response.text();
//         return res.json({ 
//             reply: responseText 
//         });
  
//     } catch (error) {
//         console.error("🔴 LỖI CHI TIẾT CHATBOT TẠI BACKEND:", error);
//         return res.status(500).json({ error: "Trợ lý AI đang bận, vui lòng thử lại sau." });
//     }
//   });

// module.exports = router;

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
        
        // 🌟 ĐÃ SỬA: Thay "ai" bằng "aiGen" để đồng bộ dữ liệu
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
        const queryText = `
            SELECT 
                DATE_FORMAT(t.date, '%Y-%m-%d') AS transaction_date, 
                c.name AS category_name, 
                t.type, 
                t.amount, 
                t.description 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ? AND MONTH(t.date) = MONTH(CURRENT_DATE()) AND YEAR(t.date) = YEAR(CURRENT_DATE())
            ORDER BY t.date DESC`;
  
        const [rows] = await db.query(queryText, [user_id]);
  
        // 🌟 BƯỚC 2: Gom danh sách giao dịch làm ngữ cảnh cho AI
        let userSpendingContext = "";
        if (rows.length === 0) {
            userSpendingContext = "Người dùng này chưa có lịch sử giao dịch nào trong tháng này.\n";
        } else {
            userSpendingContext = "Danh sách lịch sử giao dịch chi tiết của người dùng trong tháng này:\n";
            rows.forEach(item => {
                const typeText = item.type === 'expense' ? 'Chi tiêu' : 'Thu nhập';
                userSpendingContext += `- Ngày: ${item.transaction_date} | Loại: ${typeText} | Danh mục: ${item.category_name} | Số tiền: ${parseFloat(item.amount).toLocaleString()} VND | Ghi chú: ${item.description || 'Không có'}\n`;
            });
        }
  
        // 🌟 BƯỚC 3: Cấu hình hệ thống prompt
        const model = aiGen.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Bạn là một Cố vấn tài chính cá nhân thông minh tuyệt đối.
            Bạn có quyền xem CHI TIẾT từng giao dịch của người dùng ở mục [DỮ LIỆU LỊCH SỬ THỰC TẾ].
            Khi người dùng hỏi xin danh sách, thống kê hoặc liệt kê giao dịch, hãy đọc kỹ ngày tháng, số tiền, ghi chú để phản hồi chính xác.
            Trả lời bằng tiếng Việt ngắn gọn, dễ hiểu, xuống dòng rõ ràng cho từng giao dịch.
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