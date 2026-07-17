const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const { testAIConnection } = require("../services/aiService");
const axios = require("axios");

// Base URL for Ollama API
const OLLAMA_API_URL = "https://ollama.com/api";

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
 * 🎯 3. ROUTE CHAT CHÍNH: PHÂN TÍCH Ý ĐỊNH TRA CỨU THEO THỜI GIAN & THÊM/SỬA/XÓA
 */
router.post("/", authMiddleware, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Vui lòng nhập nội dung tin nhắn hợp lệ." });
  }
  const sanitizedMessage = message.trim().slice(0, 1000);

  // Lấy mốc thời gian thực tế hiện tại để AI làm căn cứ tính toán (ví dụ: "hôm nay", "tháng này")
  const today = new Date();
  const currentContextDate = `Hôm nay là thứ: ${today.getDay() === 0 ? "Chủ Nhật" : "Thứ " + (today.getDay() + 1)}, ngày ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  try {
    // --- BƯỚC 1: PROMPT PHÂN TÍCH Ý ĐỊNH NÂNG CẤP BÓC TÁCH THỜI GIAN ---
    const classifyPrompt = `
    Bạn là một hệ thống phân tích ý định người dùng cho ứng dụng quản lý tài chính cá nhân.
    Dựa vào câu nói của người dùng và ngữ cảnh thời gian thực tế bên dưới, hãy trả về một chuỗi JSON duy nhất, tuyệt đối không giải thích gì thêm ngoài JSON.
    
    Ngữ cảnh thời gian thực tế của hệ thống: ${currentContextDate}
    Câu nói của người dùng: "${sanitizedMessage}"

    Cấu trúc JSON bắt buộc phải trả về:
    {
      "action": "view" hoặc "add" hoặc "update" hoặc "delete" hoặc "chat",
      "data": {
        "amount": số_tiền (dạng số, nếu có),
        "type": "expense" hoặc "income" (nếu có),
        "source_type": "cash" hoặc "card" hoặc "e-wallet" (nếu có),
        "category_name": "tên danh mục" (ví dụ: Ăn uống, Di chuyển, Mua sắm..., nếu có),
        "description": "mô tả chi tiết hoặc mục đích" (nếu có),
        "transaction_id": id_giao_dịch (dạng số, nếu có),
        "start_date": "YYYY-MM-DD" (chỉ điền khi hành động là "view" và user yêu cầu mốc thời gian cụ thể như hôm nay, tuần này, tháng này, tháng trước...),
        "end_date": "YYYY-MM-DD" (chỉ điền tương tự start_date)
      }
    }

    Quy tắc phân loại "action":
    - "view": Người dùng muốn liệt kê, xem, kiểm tra, tra cứu danh sách lịch sử giao dịch (ví dụ: "cho xem chi tiêu hôm nay", "tháng này tiêu gì", "liệt kê khoản chi tuần qua").
    - "add": Người dùng muốn ghi chép, thêm giao dịch mới (ví dụ: "vừa ăn phở 50k", "mới nhận lương 10 triệu").
    - "update": Người dùng muốn sửa, cập nhật giao dịch (ví dụ: "sửa giao dịch id 5 thành 60k").
    - "delete": Người dùng muốn xóa giao dịch (ví dụ: "xóa giao dịch số 12 giúp tớ").
    - "chat": Các câu hỏi tư vấn tài chính chung chung, trò chuyện không tác động hay tra cứu database.
    
    Nếu hành động là "add" hoặc "update", hãy trích xuất thêm trường "source_type" vào trong object data. Quy định giá trị:
    - Nếu user nói: thẻ, ngân hàng, card, chuyển khoản, atm -> trả về "card"
    - Nếu user nói: tiền mặt, cash -> trả về "cash"
    - Nếu user nói: ví, momo, zalopay, e-wallet -> trả về "e-wallet"
    - Nếu không nhắc tới, mặc định trả về null hoặc "cash".

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

    // HÀNH ĐỘNG 1: TRA CỨU DANH SÁCH CHI TIẾT THEO THỜI GIAN (Yêu cầu chính của ông)
    if (intent.action === "view") {
      // Đổi thành t.source_type để lấy đúng dữ liệu dưới DB
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
        
        // Thêm +07:00 vào cuối chuỗi thời gian để MySQL ép đúng về múi giờ Việt Nam khi so sánh
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
          // Map giá trị tiếng Anh dưới DB sang tiếng Việt cho AI đọc dễ hiểu hơn nếu muốn
          let nguonTien = t.source_type || "Không rõ";
          if (nguonTien === 'cash') nguonTien = 'Tiền mặt';
          else if (nguonTien === 'card') nguonTien = 'Thẻ ngân hàng';
          else if (nguonTien === 'e-wallet') nguonTien = 'Ví điện tử';

          dbStatusContext += `- ID ${t.id} | Ngày: ${t.formatted_date} | Loại: ${t.type === 'expense' ? 'Chi' : 'Thu'} | Số tiền: ${parseFloat(t.amount).toLocaleString()} VND | Danh mục: ${t.category_name} | Nguồn tiền: ${nguonTien} | Mục đích/Mô tả: ${t.description || 'Không có mô tả'}\n`;
        });
      }
    }
    
    // HÀNH ĐỘNG 2: THÊM GIAO DỊCH TỰ ĐỘNG (Đã fix lỗi 'date')
    // else if (intent.action === "add" && intent.data.amount) {
    //   const { amount, description, category_name, type } = intent.data;
    //   const sourceType = intent.data.source_type || 'cash';

    //   const catName = intent.data.category_name || "Ăn uống";
    //   const [categories] = await db.query("SELECT id FROM categories WHERE name LIKE ? LIMIT 1", [`%${catName}%`]);
    //   const categoryId = categories.length > 0 ? categories[0].id : 1; 

    //   const [insertRes] = await db.query(
    //     "INSERT INTO transactions (user_id, amount, type, category_id, description, date) VALUES (?, ?, ?, ?, ?, ?)",
    //     [
    //       userId, 
    //       intent.data.amount, 
    //       intent.data.type || "expense", 
    //       categoryId, 
    //       intent.data.description || "Ghi chép nhanh qua Trợ lý AI",
    //       new Date() // Đã bổ sung dữ liệu ngày hiện tại ở đây để sửa lỗi ER_NO_DEFAULT_FOR_FIELD
    //     ]
    //   );
    //   dbStatusContext = `Hệ thống thông báo: Đã thêm thành công vào Database giao dịch mới ID: ${insertRes.insertId}, số tiền ${parseFloat(intent.data.amount).toLocaleString()} VND, danh mục: ${catName}, mô tả: ${intent.data.description || 'Trống'}. Hãy xác nhận lại với người dùng.`;
    // } 


    else if (intent.action === "add") {
      const { amount, description, category_name, type } = intent.data;
      
      // Lấy source_type từ AI truyền xuống, nếu AI trả về null thì mới lấy mặc định là 'cash'
      const sourceType = intent.data.source_type || 'cash'; 

      // Mặc định lấy category_id đầu tiên nếu không tìm thấy danh mục phù hợp
      let categoryId = 1; 
      if (category_name) {
        const [categories] = await db.query("SELECT id FROM categories WHERE name LIKE ? LIMIT 1", [`%${category_name}%`]);
        if (categories.length > 0) {
          categoryId = categories[0].id;
        }
      }

      // Đưa trường source_type vào câu lệnh INSERT câu SQL thực tế
      const [addRes] = await db.query(
        "INSERT INTO transactions (user_id, category_id, type, amount, date, description, source_type) VALUES (?, ?, ?, ?, NOW(), ?, ?)",
        [userId, categoryId, type || 'expense', amount, description || null, sourceType]
      );

      if (addRes.affectedRows > 0) {
        dbStatusContext = `Hệ thống thông báo: Đã thêm THÀNH CÔNG giao dịch mới vào cơ sở dữ liệu với nguồn tiền là: ${sourceType === 'card' ? 'Thẻ ngân hàng' : sourceType === 'e-wallet' ? 'Ví điện tử' : 'Tiền mặt'}.`;
      } else {
        dbStatusContext = "Hệ thống thông báo: THẤT BẠI! Không thể thêm giao dịch vào database.";
      }
    }
    
    // HÀNH ĐỘNG 3: SỬA GIAO DỊCH
    // =========================================================
    // 🔧 ĐOẠN CODE XÓA (DELETE) NÂNG CẤP: TỰ TÌM ID NẾU USER CHỈ GÕ VĂN BẢN
    // =========================================================
    else if (intent.action === "delete") {
      let cleanTxId = intent.data.transaction_id ? parseInt(intent.data.transaction_id, 10) : null;

      // Nếu AI không bóc được ID nhưng bóc được mô tả hoặc số tiền, ta đi tìm ID dưới DB trước
      if (!cleanTxId && (intent.data.description || intent.data.amount)) {
        let findQuery = "SELECT id FROM transactions WHERE user_id = ?";
        let findParams = [userId];
        
        if (intent.data.amount) { findQuery += " AND amount = ?"; findParams.push(intent.data.amount); }
        if (intent.data.description) { findQuery += " AND description LIKE ?"; findParams.push(`%${intent.data.description}%`); }
        
        const [found] = await db.query(findQuery, findParams);
        if (found.length > 0) {
          cleanTxId = found[0].id; // Tìm thấy ID rồi!
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
        dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Không thể xác định được giao dịch nào cần xóa dựa trên thông tin người dùng cung cấp. Vui lòng yêu cầu họ cung cấp ID hoặc mô tả rõ ràng hơn.`;
      }
    }

    // =========================================================
    // 🔧 ĐOẠN CODE SỬA (UPDATE) NÂNG CẤP: NGĂN AI CHAT ẢO TỰ BÁO THÀNH CÔNG
    // =========================================================
    else if (intent.action === "update") {
      let cleanTxId = intent.data.transaction_id ? parseInt(intent.data.transaction_id, 10) : null;
      let fields = [];
      let params = [];

      // Logic tìm ID tương tự nếu không có ID truyền vào
      if (!cleanTxId && intent.data.description) {
        const [found] = await db.query("SELECT id FROM transactions WHERE user_id = ? AND description LIKE ? LIMIT 1", [userId, `%${intent.data.description}%`]);
        if (found.length > 0) cleanTxId = found[0].id;
      }

      if (intent.data.amount) { fields.push("amount = ?"); params.push(intent.data.amount); }
      
      if (intent.data.category_name) {
        const [categories] = await db.query("SELECT id FROM categories WHERE name LIKE ? LIMIT 1", [`%${intent.data.category_name}%`]);
        if (categories.length > 0) { fields.push("category_id = ?"); params.push(categories[0].id); }
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
        dbStatusContext = `Hệ thống thông báo: THẤT BẠI! Không tìm thấy giao dịch hợp lệ hoặc thiếu dữ liệu để cập nhật. Không được báo thành công với user!`;
      }
    }

    // --- BƯỚC 3: PROMPT CUỐI CÙNG ÉP AI ĐỌC DỮ LIỆU THẬT ĐỂ TRẢ LỜI CHI TIẾT ---
    const finalResponse = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: "minimax-m2.5",
      prompt: `Bạn là một Cố vấn Quản lý Tài chính Cá nhân Chuyên nghiệp. Hãy trả lời người dùng bằng tiếng Việt thật tự nhiên, thân thiện và rõ ràng.

      Dưới đây là thông tin dữ liệu thực tế được bốc trích trực tiếp từ cơ sở dữ liệu dựa theo yêu cầu của họ:
      ===================================
      ${dbStatusContext}
      ===================================

      Tin nhắn vừa rồi của người dùng: "${sanitizedMessage}"

      Nhiệm vụ của bạn:
      - Nếu người dùng yêu cầu xem/tra cứu danh sách, hãy liệt kê toàn bộ các giao dịch xuất hiện trong "Hệ thống dữ liệu" ở trên ra (Bao gồm rõ ràng: Ngày, Số tiền, Danh mục, và Mô tả/Mục đích cụ thể từng dòng) để họ dễ theo dõi.
      - Nếu người dùng thực hiện Thêm/Sửa/Xóa, hãy dựa vào thông báo thành công từ hệ thống để phản hồi lại một cách vui vẻ, ngắn gọn.`,
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