const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const { testAIConnection } = require("../services/aiService");
const axios = require("axios");

// Base URL for Ollama API
const OLLAMA_API_URL = "https://ollama.com/api";

// 🛠️ HÀM TRỢ LÝ: CHUYỂN ĐỔI TEENCODE TIỀN TỆ THÀNH SỐ NGUYÊN
function normalizeTeencodeMoney(message) {
  if (!message) return "";
  let text = message.toLowerCase();

  // 1. Xử lý viết tắt triệu: 'm', 'mđ', 'tr', 'triệu' (Ví dụ: 1.5tr -> 1500000, 2m -> 2000000)
  text = text.replace(/(\d+[\.,]?\d*)\s*(m|mđ|tr|triệu|trieu)\b/g, (match, p1) => {
    const num = parseFloat(p1.replace(',', '.'));
    return num * 1000000;
  });

  // 2. Xử lý viết tắt nghìn: 'k', 'kđ', 'nghìn', 'ngàn' (Ví dụ: 50k -> 50000, 100 nghìn -> 100000)
  text = text.replace(/(\d+[\.,]?\d*)\s*(k|kđ|nghìn|nghìnđ|ngan|nganđ)\b/g, (match, p1) => {
    const num = parseFloat(p1.replace(',', '.'));
    return num * 1000;
  });

  return text;
}

// 1. Route Test kết nối (Giữ nguyên)
router.get("/test-connection", async (req, res) => {
  const result = await testAIConnection();
  if (result.success) {
    return res.status(200).json({
      message: "Kết nối Ollama thành công!",
      ai_reply: result.reply,
    });
  } else {
    return res.status(500).json({
      message: "Lỗi kết nối API!",
      error: result.error,
    });
  }
});

// 2. Route phân tích chi tiêu tự động (Giữ nguyên)
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
    rows.forEach((item) => {
      spendingContext += `- Danh mục [${item.category_name}]: đã tiêu ${parseFloat(item.total_amount).toLocaleString()} VND\n`;
    });

    const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
      prompt: `Bạn là một Cố vấn Quản lý Tài chính Cá nhân Chuyên nghiệp. Dựa vào số liệu chi tiêu được cung cấp, hãy đưa ra phản hồi bằng tiếng Việt ngắn gọn (dưới 150 từ) gồm 2 phần: 1. Nhận xét nhóm ngành nào đang chiếm tỷ trọng quá cao bất hợp lý. 2. Đưa ra 2 hành động cụ thể thực tế giúp họ tiết kiệm tiền tốt hơn.\n\n${spendingContext}`
    }, {
      headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`, "Content-Type": "application/json" }
    });

    return res.json({ suggestions: response.data.text });
  } catch (error) {
    console.error("Lỗi xử lý Ollama tại /analysis/spending:", error);
    return res.status(500).json({ error: "Hệ thống phân tích AI đang gặp sự cố." });
  }
});

/**
 * 🎯 3. ROUTE CHAT CHÍNH: NÂNG CẤP BỘ LỌC TEENCODE TIỀN TỆ
 */
router.post("/", authMiddleware, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Vui lòng nhập nội dung tin nhắn hợp lệ." });
  }
  
  const originalMessage = message.trim().slice(0, 1000);
  
  // 🌟 TIỀN XỬ LÝ: Chuyển đổi teencode thành số thật (Ví dụ: "ăn trưa 50k" -> "ăn trưa 50000")
  const sanitizedMessage = normalizeTeencodeMoney(originalMessage);

  const today = new Date();
  const currentContextDate = `Hôm nay là thứ: ${today.getDay() === 0 ? "Chủ Nhật" : "Thứ " + (today.getDay() + 1)}, ngày ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  try {
    const [userCategories] = await db.query(
      "SELECT id, name, type FROM categories WHERE user_id = ? OR user_id IS NULL",
      [userId]
    );

    const realCategoriesText = userCategories.map(c => `- ${c.name} (${c.type === 'expense' ? 'Chi' : 'Thu'})`).join("\n");
    
    // --- BƯỚC 1: PROMPT PHÂN TÍCH Ý ĐỊNH NÂNG CẤP DẠY AI HỌC THÊM QUY TẮC TEENCODE ---
    const classifyPrompt = `
    Bạn là một hệ thống phân tích ý định người dùng cho ứng dụng quản lý tài chính cá nhân.
    Dựa vào câu nói của người dùng và ngữ cảnh thời gian thực tế bên dưới, hãy trả về một chuỗi JSON duy nhất, tuyệt đối không giải thích gì thêm ngoài JSON.
    
    DANH SÁCH DANH MỤC THỰC TẾ TRONG HỆ THỐNG:
    ${realCategoriesText}

    Ngữ cảnh thời gian thực tế của hệ thống: ${currentContextDate}
    Câu nói của người dùng (Đã được tiền xử lý số): "${sanitizedMessage}"

    Cấu trúc JSON bắt buộc phải trả về:
    {
      "action": "view" hoặc "add" hoặc "update" hoặc "delete" hoặc "chat",
      "data": {
        "amount": số_tiền (BẮT BUỘC ĐỂ DẠNG SỐ NGUYÊN NGUYÊN BẢN, ví dụ: 50000, 1000000. Không để text chữ hay ký tự k, m, tr),
        "type": "expense" hoặc "income" (nếu có),
        "source_type": "cash" hoặc "card" hoặc "e-wallet" (nếu có),
        "category_name": "tên danh mục" (ví dụ: Ăn uống, Di chuyển, Mua sắm..., nếu có),
        "description": "mô tả chi tiết hoặc mục đích" (nếu có),
        "transaction_id": id_giao_dịch (dạng số, nếu có),
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD"
      }
    }

    QUY TẮC ĐỌC TEENCODE TIỀN TỆ (Dành cho trường hợp chuỗi xử lý chưa hết):
    - Các ký hiệu k, kđ, nghìn, ngàn, cành tương đương hàng nghìn (x1.000). Ví dụ: 10k, 10 nghìn, 10 cành = 10000
    - Các ký hiệu m, mđ, tr, triệu, củ tương đương hàng triệu (x1.000.000). Ví dụ: 1m, 1.5tr, 1,5tr, 1 triệu, 1 củ = 1000000 hoặc 1500000

    Quy tắc phân loại "action":
    - "view": Người dùng muốn liệt kê, xem, kiểm tra, tra cứu lịch sử.
    - "add": Người dùng muốn ghi chép, thêm giao dịch mới.
    - "update": Người dùng muốn sửa, cập nhật giao dịch.
    - "delete": Người dùng muốn xóa giao dịch.
    - "chat": Các câu hỏi tư vấn tài chính chung chung.
    
    Nếu hành động là "add" hoặc "update", trích xuất thêm "source_type":
    - Thẻ, ngân hàng, card, chuyển khoản, atm, banking -> "card"
    - Tiền mặt, cash -> "cash"
    - Ví, momo, zalopay, e-wallet -> "e-wallet"
    - Mặc định nếu không nhắc tới: "cash".

    HƯỚNG DẪN MAP "category_name":
    - Xăng, đi lại, sửa xe, grab, taxi, bus -> "Di chuyển"
    - Ăn, uống, trà sữa, cafe, cơm, phở, bún -> "Ăn uống"
    - Áo, quần, giày, dép, mua hộ, đồ dùng -> "Mua sắm"
    `;

    const classifyResponse = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: "minimax-m2.5",
      prompt: classifyPrompt,
      stream: false
    }, {
      headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`, "Content-Type": "application/json" }
    });

    let intent = { action: "chat", data: {} };
    try {
      const cleanJsonText = classifyResponse.data.response.replace(/```json|```/g, "").trim();
      intent = JSON.parse(cleanJsonText);
    } catch (e) {
      console.log("Không thể parse JSON ý định, chuyển về chế độ chat thường.");
    }

    // --- BƯỚC 2: XỬ LÝ DATABASE DỰA TRÊN Ý ĐỊNH ---
    let dbStatusContext = ""; 

    if (intent.action === "view") {
      let queryDetail = `
        SELECT t.id, t.amount, t.type, t.description, t.source_type,
               DATE_FORMAT(t.date, '%d/%m/%Y') as formatted_date, 
               c.name as category_name
        FROM transactions t 
        JOIN categories c ON t.category_id = c.id 
        WHERE t.user_id = ?
      `;
      let queryParams = [userId];

      if (intent.data.start_date && intent.data.end_date) {
        queryDetail += ` AND t.date BETWEEN STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') AND STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s')`;
        queryParams.push(`${intent.data.start_date} 00:00:00`, `${intent.data.end_date} 23:59:59`);
        dbStatusContext = `Danh sách chi tiết các giao dịch từ ngày ${intent.data.start_date} đến ngày ${intent.data.end_date}:\n`;
      } else {
        dbStatusContext = "Danh sách 15 giao dịch gần đây nhất của người dùng:\n";
      }

      queryDetail += ` ORDER BY t.date DESC LIMIT 30`;

      const [details] = await db.query(queryDetail, queryParams);
      
      if (details.length === 0) {
        dbStatusContext += "- Không tìm thấy giao dịch nào trong khoảng thời gian này.\n";
      } else {
        details.forEach(t => {
          let nguonTien = t.source_type || "Không rõ";
          if (nguonTien === 'cash') nguonTien = 'Tiền mặt';
          else if (nguonTien === 'card') nguonTien = 'Thẻ ngân hàng';
          else if (nguonTien === 'e-wallet') nguonTien = 'Ví điện tử';

          dbStatusContext += `- ID ${t.id} | Ngày: ${t.formatted_date} | Loại: ${t.type === 'expense' ? 'Chi' : 'Thu'} | Số tiền: ${parseFloat(t.amount).toLocaleString()} VND | Danh mục: ${t.category_name} | Nguồn tiền: ${nguonTien} | Mục đích/Mô tả: ${t.description || 'Không có mô tả'}\n`;
        });
      }
    }

    else if (intent.action === "add") {
      const { amount, description, category_name, type } = intent.data;
      const sourceType = intent.data.source_type || 'cash'; 

      let categoryId = 1; 
      if (category_name) {
        const [categories] = await db.query("SELECT id FROM categories WHERE name LIKE ? LIMIT 1", [`%${category_name}%`]);
        if (categories.length > 0) {
          categoryId = categories[0].id;
        }
      }

      const [addRes] = await db.query(
        "INSERT INTO transactions (user_id, category_id, type, amount, date, description, source_type) VALUES (?, ?, ?, ?, NOW(), ?, ?)",
        [userId, categoryId, type || 'expense', amount, description || null, sourceType]
      );

      if (addRes.affectedRows > 0) {
        dbStatusContext = `Hệ thống thông báo: Đã thêm THÀNH CÔNG giao dịch mới với số tiền ${Number(amount).toLocaleString()} VND từ nguồn: ${sourceType === 'card' ? 'Thẻ ngân hàng' : sourceType === 'e-wallet' ? 'Ví điện tử' : 'Tiền mặt'}.`;
      } else {
        dbStatusContext = "Hệ thống thông báo: THẤT BẠI! Không thể thêm giao dịch vào database.";
      }
    }
    
    else if (intent.action === "delete") {
      let cleanTxId = intent.data.transaction_id ? parseInt(intent.data.transaction_id, 10) : null;

      if (!cleanTxId && (intent.data.description || intent.data.amount)) {
        let findQuery = "SELECT id FROM transactions WHERE user_id = ?";
        let findParams = [userId];
        
        if (intent.data.amount) { findQuery += " AND amount = ?"; findParams.push(intent.data.amount); }
        if (intent.data.description) { findQuery += " AND description LIKE ?"; findParams.push(`%${intent.data.description}%`); }
        
        const [found] = await db.query(findQuery, findParams);
        if (found.length > 0) {
          cleanTxId = found[0].id;
        }
      }

      if (cleanTxId) {
        const [deleteRes] = await db.query("DELETE FROM transactions WHERE id = ? AND user_id = ?", [cleanTxId, userId]);
        if (deleteRes.affectedRows > 0) {
          dbStatusContext = `Hệ thống thông báo: Đã xóa THÀNH CÔNG hoàn toàn giao dịch ID ${cleanTxId} khỏi cơ sở dữ liệu.`;
        } else {
          dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Không tìm thấy giao dịch ID ${cleanTxId} để xóa.`;
        }
      } else {
        dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Không thể xác định được giao dịch nào cần xóa dựa trên thông tin người dùng cung cấp.`;
      }
    }

    else if (intent.action === "update") {
      let cleanTxId = intent.data.transaction_id ? parseInt(intent.data.transaction_id, 10) : null;
      let fields = [];
      let params = [];

      if (!cleanTxId && intent.data.description) {
        const [found] = await db.query("SELECT id FROM transactions WHERE user_id = ? AND description LIKE ? LIMIT 1", [userId, `%${intent.data.description}%`]);
        if (found.length > 0) cleanTxId = found[0].id;
      }

      if (intent.data.amount) { fields.push("amount = ?"); params.push(intent.data.amount); }
      
      if (intent.data.category_name) {
        const foundCat = userCategories.find(c => c.name.toLowerCase().includes(intent.data.category_name.toLowerCase()));
        if (foundCat) { 
          fields.push("category_id = ?"); 
          params.push(foundCat.id); 
        }
      }

      if (cleanTxId && fields.length > 0) {
        params.push(cleanTxId, userId);
        const [updateRes] = await db.query(`UPDATE transactions SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, params);
        
        if (updateRes.affectedRows > 0) {
          dbStatusContext = `Hệ thống thông báo: Cập nhật THÀNH CÔNG giao dịch ID ${cleanTxId} sang danh mục/thông tin mới.`;
        } else {
          dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Lệnh sửa chạy nhưng không tìm thấy giao dịch khớp trong DB.`;
        }
      } else {
        dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Không tìm thấy giao dịch hợp lệ hoặc thiếu dữ liệu để cập nhật.`;
      }
    }

    // --- BƯỚC 3: PROMPT CUỐI CÙNG TRẢ LỜI NGƯỜI DÙNG ---
    const finalResponse = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: "minimax-m2.5",
      prompt: `Bạn là một Cố vấn Quản lý Tài chính Cá nhân Chuyên nghiệp. Hãy trả lời người dùng bằng tiếng Việt thật tự nhiên, thân thiện và rõ ràng.

      Dưới đây là thông tin dữ liệu thực tế được bốc trích trực tiếp từ cơ sở dữ liệu dựa theo yêu cầu của họ:
      ===================================
      ${dbStatusContext}
      ===================================

      Tin nhắn nguyên bản vừa rồi của người dùng: "${originalMessage}"

      Nhiệm vụ của bạn:
      - Phản hồi lại yêu cầu của họ dựa trên kết quả database bằng ngôn ngữ tự nhiên, gần gũi. Nếu họ dùng viết tắt (k, tr, m) thì khi bạn nhắc lại số tiền, hãy ghi đầy đủ số ra (Ví dụ: 50.000đ thay vì viết lại 50k) để tăng tính chuyên nghiệp.`,
      stream: false
    }, {
      headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`, "Content-Type": "application/json" }
    });

    return res.status(200).json({ reply: finalResponse.data.response });

  } catch (error) {
    console.error("Lỗi xử lý hệ thống AI kết hợp Database:", error);
    return res.status(500).json({ error: "Trợ lý AI đang bận, vui lòng thử lại sau." });
  }
});

module.exports = router;