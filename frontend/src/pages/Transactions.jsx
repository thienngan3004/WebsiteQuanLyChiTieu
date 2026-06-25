import React, { useState } from 'react';

function Transactions() {
  // Mock dữ liệu lịch sử giao dịch từ ngày Thứ 3 để hiển thị lên bảng tĩnh
  const mockTransactions = [
    { id: 1, type: 'income', amount: 12000000, date: '2026-06-01', category: 'Thu nhập tiền lương cố định', description: 'Nhận lương tháng thực tập đầu tiên' },
    { id: 2, type: 'expense', amount: 65000, date: '2026-06-02', category: 'Ăn uống hằng ngày', description: 'Mua cơm trưa văn phòng' },
    { id: 3, type: 'expense', amount: 3200000, date: '2026-06-04', category: 'Mua sắm thiết bị học tập', description: 'Mua màn hình máy tính cũ' }
  ];

  // Trạng thái đóng/mở khung chat AI độc lập
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>Quản Lý Giao Dịch Tài Chính</h2>
      <p style={styles.subtitle}>Thêm mới các khoản thu/chi và theo dõi lịch sử dòng tiền</p>

      <div style={styles.mainLayout}>
        {/* BLOCK 1: FORM THÊM GIAO DỊCH MỚI */}
        <div style={styles.card}>
          <h4 style={styles.cardTitle}>Thêm Giao Dịch Mới</h4>
          <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Số tiền (VND)</label>
              <input type="number" placeholder="Ví dụ: 50000" style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Loại giao dịch</label>
              <select style={styles.input}>
                <option value="expense">Chi tiêu (Expense)</option>
                <option value="income">Thu nhập (Income)</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Danh mục</label>
              <select style={styles.input}>
                <option>Ăn uống hằng ngày</option>
                <option>Mua sắm thiết bị học tập</option>
                <option>Di chuyển</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ngày giao dịch</label>
              <input type="date" style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ghi chú</label>
              <input type="text" placeholder="Nhập mô tả chi tiết..." style={styles.input} />
            </div>
            <button type="button" style={styles.btnSubmit}>Lưu Giao Dịch</button>
          </form>
        </div>

        {/* BLOCK 2: BẢNG LỊCH SỬ GIAO DỊCH */}
        <div style={{ ...styles.card, flex: 2 }}>
          <h4 style={styles.cardTitle}>Lịch Sử Giao Dịch</h4>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Ngày</th>
                <th style={styles.th}>Danh mục</th>
                <th style={styles.th}>Loại</th>
                <th style={styles.th}>Số tiền</th>
                <th style={styles.th}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.date}</td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: item.type === 'income' ? '#e6f4ea' : '#fce8e6',
                      color: item.type === 'income' ? '#137333' : '#c5221f'
                    }}>
                      {item.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: item.type === 'income' ? '#137333' : '#c5221f' }}>
                    {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} đ
                  </td>
                  <td style={styles.td}>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOCK 3: KHUNG CHATBOT TRỢ LÝ ẢO AI CỐ ĐỊNH GÓC PHẢI */}
      <div style={styles.chatBotWrapper}>
        {/* Nút tròn để bấm mở/đóng chat */}
        <button onClick={() => setIsChatOpen(!isChatOpen)} style={styles.chatButton}>
          {isChatOpen ? '✖' : '💬 Trợ lý AI'}
        </button>

        {/* Cửa sổ chat hiển thị khi trạng thái isChatOpen = true */}
        {isChatOpen && (
          <div style={styles.chatWindow}>
            <div style={styles.chatHeader}>🤖 Trợ Lý Tài Chính AI</div>
            <div style={styles.chatBody}>
              <div style={styles.msgAi}>Xin chào! Tôi là cố vấn tài chính thông minh của bạn. Bạn cần tôi phân tích khoản chi tiêu nào hôm nay?</div>
              <div style={styles.msgUser}>Tháng này tôi đã tiêu bao nhiêu tiền vào mua sắm rồi?</div>
            </div>
            <div style={styles.chatFooter}>
              <input type="text" placeholder="Hỏi AI về chi tiêu..." style={styles.chatInput} />
              <button style={styles.btnSend}>Gửi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hệ thống CSS layout gọn gàng, chia tỉ lệ grid/flex và cố định chatbot góc phải
const styles = {
  container: { padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', position: 'relative' },
  pageTitle: { margin: '0 0 5px 0', fontSize: '26px', color: '#0f172a' },
  subtitle: { margin: '0 0 30px 0', fontSize: '14px', color: '#64748b' },
  mainLayout: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
  card: { background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flex: 1, minWidth: '320px' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#475569' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' },
  btnSubmit: { padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#f1f5f9' },
  th: { padding: '12px', fontSize: '14px', color: '#475569', fontWeight: 'bold' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px', fontSize: '14px', color: '#334155' },
  badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
  
  // Style cho Chatbot AI cố định góc phải màn hình
  chatBotWrapper: { position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' },
  chatButton: { padding: '15px 20px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' },
  chatWindow: { width: '320px', height: '400px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' },
  chatHeader: { padding: '15px', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', fontSize: '15px' },
  chatBody: { padding: '15px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' },
  msgAi: { padding: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '12px 12px 12px 0px', fontSize: '13px', maxWidth: '85%', alignSelf: 'flex-start', lineHeight: '1.4' },
  msgUser: { padding: '10px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: '12px 12px 0px 12px', fontSize: '13px', maxWidth: '85%', alignSelf: 'flex-end', lineHeight: '1.4' },
  chatFooter: { padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' },
  chatInput: { flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' },
  btnSend: { padding: '8px 15px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Transactions;