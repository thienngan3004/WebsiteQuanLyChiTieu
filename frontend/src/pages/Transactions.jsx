import React, { useState, useEffect } from "react";
import axios from "axios";

function Transactions() {
  // 1. Khởi tạo các State để quản lý dữ liệu thật từ Backend
  const [transactions, setTransactions] = useState([]); // Mảng chứa danh sách giao dịch thật
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State quản lý các ô nhập liệu trong Form thêm mới
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense",
    category_id: 1, // Tạm thời mặc định nhóm 1 (ví dụ: Ăn uống)
    date: new Date().toISOString().split("T")[0], // Mặc định lấy ngày hôm nay
    description: "",
    source_type: "cash",
  });

  const [categories, setCategories] = useState([]);
  // State quản lý ô nhập khi tạo danh mục mới
  const [newCategoryName, setNewCategoryName] = useState("");

  // 1. Các State quản lý ẩn/hiện Popup và dữ liệu Form ngân sách
  const [isOpenBudgetModal, setIsOpenBudgetModal] = useState(false);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [budgetFormData, setBudgetFormData] = useState({
    category_id: "",
    amount: "",
  });

  // State quản lý Chatbot AI
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Xin chào! Tôi là cố vấn tài chính thông minh của bạn.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // CÁC HÀM GỌI API (FETCH DATA)
  // ==========================================
  
  // Hàm lấy danh mục thật từ DB về
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token"); // Lấy token thật
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  // Hàm gọi API lấy danh sách giao dịch từ Backend
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data); // Đổ dữ liệu thật vào state để render ra bảng
    } catch (error) {
      console.error("Lỗi lấy danh sách giao dịch:", error);
      alert("Không thể tải danh sách giao dịch!");
    }
  };

  // Hàm lấy danh sách cảnh báo ngân sách từ Backend
  const fetchBudgetWarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/budgets/check-warnings",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setBudgetWarnings(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy cảnh báo ngân sách:", error);
    }
  };

  // GỘP TẤT CẢ VÀO MỘT USEEFFECT DUY NHẤT KHI VÀO TRANG TRÁNH TRÙNG LẶP
  useEffect(() => {
    fetchTransactions();
    fetchCategories(); 
    fetchBudgetWarnings();
  }, []);

  // ==========================================
  // LOGIC XỬ LÝ FORM GIAO DỊCH
  // ==========================================
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      const firstValidCategory = categories.find((cat) => cat.type === value);
      setFormData({
        ...formData,
        type: value,
        category_id: firstValidCategory ? firstValidCategory.id : "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Hàm xử lý gửi dữ liệu Form lên Backend để lưu vào DB (Đã sửa lỗi ngoặc + thêm bộ chặn)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.date) {
      alert("Vui lòng nhập đầy đủ số tiền và ngày giao dịch!");
      return;
    }

    if (!formData.category_id || Number(formData.category_id) === 0) {
      alert(" Vui lòng tạo nhanh một danh mục ở ô phía dưới trước!");
      return;
    }

    const selectedCatId = formData.category_id; 
    const newAmount = Number(formData.amount);
    const transactionType = formData.type; 

    // 🌟 VÒNG KIỂM TRA FRONT-END: CHẶN VƯỢT HẠN MỨC NGÂN SÁCH
    if (transactionType === "expense") {
      const matchingBudget = budgetWarnings?.find(b => String(b.category_id) === String(selectedCatId));

      if (matchingBudget) {
        const limit = Number(matchingBudget.budget_limit);
        const currentSpent = Number(matchingBudget.total_spent);
        
        if (currentSpent + newAmount > limit) {
          alert(
            `🚫 KHOẢN CHI VƯỢT QUÁ HẠN MỨC CHO PHÉP!\n\n` +
            `- Danh mục: ${matchingBudget.category_name}\n` +
            `- Hạn mức tháng này: ${limit.toLocaleString("vi-VN")}đ\n` +
            `- Đã chi tiêu: ${currentSpent.toLocaleString("vi-VN")}đ\n` +
            `- Dự kiến thêm: ${newAmount.toLocaleString("vi-VN")}đ\n\n` +
            `Hệ thống không cho phép thực hiện. Vui lòng chỉnh sửa lại số tiền phù hợp hoặc tăng hạn mức ngân sách của danh mục này!`
          );
          return; // 🛑 Ngắt hoàn toàn tiến trình
        }
      }
    }

    // Gửi API nếu hợp lệ
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/transactions",
        {
          amount: newAmount,
          type: transactionType,
          category_id: Number(selectedCatId),
          date: formData.date,
          description: formData.description,
          source_type: formData.source_type || 'cash'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Thêm giao dịch thành công!");
        setFormData({
          amount: "",
          type: formData.type,
          category_id: formData.category_id,
          date: new Date().toISOString().split("T")[0],
          description: "",
          source_type: "cash"
        });
        fetchTransactions();
        fetchBudgetWarnings(); // Cập nhật lại thanh tiến độ ngân sách ngay lập tức
      }
    } catch (error) {
      console.error("Lỗi thêm giao dịch:", error);
      if (error.response && error.response.data && error.response.data.isOverBudget) {
        alert(error.response.data.error);
      } else {
        alert("Lỗi hệ thống, không lưu được giao dịch!");
      }
    }
  };

  // Hàm xử lý tạo danh mục động mới từ giao diện
  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Không tìm thấy mã đăng nhập (Token), vui lòng đăng nhập lại!");
        return;
      }

      const currentType = formData.type;

      const response = await axios.post(
        "http://127.0.0.1:5000/api/categories",
        {
          name: newCategoryName.trim(),
          type: currentType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201 || response.data?.category) {
        alert(`Đã thêm danh mục "${newCategoryName}" thành công!`);
        setNewCategoryName(""); 
        await fetchCategories();
      }
    } catch (error) {
      console.error("Lỗi khi gọi API POST danh mục:", error);
      const errorMsg = error.response?.data?.message || "Không thể kết nối đến máy chủ.";
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  // Hàm xóa giao dịch thật (Delete trong CRUD)
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này không?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(
          `http://localhost:5000/api/transactions/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          alert("Đã xóa giao dịch thành công!");
          fetchTransactions(); 
          fetchBudgetWarnings(); // Reload lại ngân sách vì đã bớt tiền chi tiêu
        }
      } catch (error) {
        console.error("Lỗi xóa giao dịch:", error);
        alert("Không thể xóa giao dịch này!");
      }
    }
  };

  // ==========================================
  // CHATBOT AI LOGIC
  // ==========================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInputValue("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        'http://localhost:5000/api/ai', 
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.reply) {
        const cleanReply = response.data.reply.replace(/\*\*/g, "");
        setMessages((prev) => [...prev, { sender: "ai", text: cleanReply }]);
        
        // Nếu Backend báo là AI vừa thêm mới một giao dịch thành công vào DB
        if (response.data.inserted || response.data.refreshRequired) {
          fetchTransactions();     // Tải lại bảng lịch sử giao dịch
          fetchBudgetWarnings();   // Cập nhật ngay tiến độ và cảnh báo ngân sách!
        }
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn chatbot:", error);
      const serverErrorMessage = error.response?.data?.error || "Trợ lý AI đang bận, vui lòng thử lại sau nhé!";
      setMessages((prev) => [...prev, { sender: "ai", text: serverErrorMessage}]);
    } finally {
      setLoading(false);
    }
  };

  // Giữ nguyên phần Return giao diện (UI) của bạn bên dưới...
  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>Quản Lý Giao Dịch Tài Chính</h2>

      <div style={styles.mainLayout}>
        {/* BLOCK 1: FORM THÊM GIAO DỊCH MỚI */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Thêm Giao Dịch Mới</h4>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Số tiền */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Số tiền (VND)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Ví dụ: 50000"
                style={styles.input}
              />
            </div>

            {/* Loại giao dịch */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Loại giao dịch</label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value,
                    category_id: "",
                  }));
                }}
                style={styles.input}
              >
                <option value="expense">Chi tiêu (Expense)</option>
                <option value="income">Thu nhập (Income)</option>
              </select>
            </div>

            {/* Danh mục */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Danh mục</label>
              <select
                name="category_id"
                value={formData.category_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                style={styles.input}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories
                  .filter((cat) => cat.type === formData.type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tạo nhanh danh mục mới */}
            <div
              style={{
                ...styles.inputGroup,
                marginTop: "5px",
                padding: "10px",
                background: "#f8fafc",
                borderRadius: "4px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <label style={{ ...styles.label, fontSize: "12px", color: "#64748b" }}>
                💡 Tạo nhanh danh mục mới cho loại này:
              </label>
              <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
                <input
                  type="text"
                  placeholder="Ví dụ: Quỹ riêng, Học phí..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    ...styles.input,
                    flex: 1,
                    padding: "6px 10px",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  + Thêm
                </button>
              </div>
            </div>

            {/* Nguồn tiền */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nguồn thanh toán / Nhận tiền</label>
              <select 
                name="source_type"
                value={formData.source_type} 
                onChange={(e) => setFormData({...formData, source_type: e.target.value})}
                style={styles.input}
              >
                <option value="cash">Tiền mặt</option>
                <option value="card">Thẻ ngân hàng (ATM/Visa)</option>
                <option value="e-wallet">Ví điện tử (Momo, ZaloPay...)</option>
              </select>
            </div>

            {/* Ngày giao dịch */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ngày giao dịch</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            {/* Ghi chú */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ghi chú</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Nhập mô tả chi tiết..."
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.btnSubmit}>
              Lưu Giao Dịch Vào DB
            </button>
          </form>
        </div>

        {/* BLOCK 2: BẢNG LỊCH SỬ GIAO DỊCH THẬT */}
        <div style={{ ...styles.card, flex: 2 }}>
          <h4 style={styles.cardTitle}>
            Lịch Sử Giao Dịch ({transactions.length})
          </h4>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Ngày</th>
                <th style={styles.th}>Danh mục</th>
                <th style={styles.th}>Loại</th>
                <th style={styles.th}>Số tiền</th>
                <th style={styles.th}>Ghi chú</th>
                <th style={styles.th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#64748b",
                    }}
                  >
                    Chưa có giao dịch! Hãy thêm mới ở form bên cạnh nhé.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      {item.date ? item.date.split("T")[0] : ""}
                    </td>
                    <td style={styles.td}>
                      {item.category_name || "Chưa phân loại"}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor:
                            item.type === "income" ? "#e6f4ea" : "#fce8e6",
                          color: item.type === "income" ? "#137333" : "#c5221f",
                        }}
                      >
                        {item.type === "income" ? "Thu nhập" : "Chi tiêu"}
                      </span>
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: "bold",
                        color: item.type === "income" ? "#137333" : "#c5221f",
                      }}
                    >
                      {item.type === "income" ? "+" : "-"}
                      {Number(item.amount).toLocaleString()} đ
                    </td>
                    <td style={styles.td}>{item.description}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* BLOCK 3: CHATBOT AI */}
      {/* 1. Nút tròn bấm để mở Chat nằm ở góc phải màn hình */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)} 
        style={styles.chatToggleButton}
      >
        {isChatOpen ? "✖ Đóng Chat" : "💬 Trợ Lý AI"}
      </button>

      {/* 2. Khung chat hiển thị khi state isChatOpen === true */}
      {isChatOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <strong>🤖 Cố vấn Tài chính AI</strong>
          </div>
          
          {/* Vùng hiển thị danh sách tin nhắn */}
          <div style={styles.chatBody}>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.chatMessageRow,
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div style={{
                  ...styles.chatBubble,
                  backgroundColor: msg.sender === "user" ? "#007fff" : "#f1f5f9",
                  color: msg.sender === "user" ? "#fff" : "#1e293b",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "#64748b", fontSize: "13px", padding: "5px" }}>AI đang suy nghĩ...</div>}
          </div>

          {/* Form nhập liệu tin nhắn */}
          <form onSubmit={handleSendMessage} style={styles.chatFooter}>
            <input
              type="text"
              placeholder="Hỏi AI: Thêm chi tiêu 50k ăn sáng..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              style={styles.chatInput}
            />
            <button type="submit" disabled={loading} style={styles.chatSendBtn}>
              Gửi
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "calc(100vh - 64px)",
    fontFamily: "Arial, sans-serif",
  },
  pageTitle: { margin: "0 0 5px 0", fontSize: "26px", color: "#0f172a" },
  subtitle: { margin: "0 0 30px 0", fontSize: "14px", color: "#64748b" },
  mainLayout: { display: "flex", gap: "30px", flexWrap: "wrap" },
  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    flex: 1,
    minWidth: "320px",
  },
  cardTitle: {
    margin: "0 0 20px 0",
    fontSize: "18px",
    color: "#1e293b",
    fontWeight: "bold",
  },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", fontWeight: "500", color: "#475569" },
  input: {
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  btnSubmit: {
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thRow: { backgroundColor: "#f1f5f9" },
  th: {
    padding: "12px",
    fontSize: "14px",
    color: "#475569",
    fontWeight: "bold",
  },
  tr: { borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px", fontSize: "14px", color: "#334155" },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  chatBotWrapper: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  chatButton: {
    padding: "15px 20px",
    backgroundColor: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "50px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
  },
  chatWindow: {
    width: "320px",
    height: "400px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  chatHeader: {
    padding: "15px",
    backgroundColor: "#7c3aed",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
  },
  chatBody: {
    padding: "15px",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#f8fafc",
  },
  msgAi: {
    padding: "10px",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    borderRadius: "12px 12px 12px 0px",
    fontSize: "13px",
    maxWidth: "85%",
    alignSelf: "flex-start",
    lineHeight: "1.4",
  },
  chatFooter: {
    padding: "10px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    gap: "8px",
  },
  chatInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
  },
  btnSend: {
    padding: "8px 15px",
    backgroundColor: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  chatToggleButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    backgroundColor: "#007fff",
    color: "#fff",
    border: "none",
    borderRadius: "30px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
  },
  chatWindow: {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    width: "350px",
    height: "450px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 1000,
    border: "1px solid #e2e8f0",
  },
  chatHeader: {
    padding: "15px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    color: "#1e293b",
  },
  chatBody: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  chatMessageRow: {
    display: "flex",
    width: "100%",
  },
  chatBubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.4",
    whiteSpace: "pre-wrap",
  },
  chatFooter: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#fff",
  },
  chatInput: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    outline: "none",
    fontSize: "14px",
  },
  chatSendBtn: {
    marginLeft: "8px",
    padding: "8px 16px",
    backgroundColor: "#007fff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Transactions;
