import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  // 1. Mock data cho các khối hiển thị số dư
  const financialSummary = {
    balance: 8735000,
    totalIncome: 12000000,
    totalExpense: 3265000
  };

  // 2. Mock data cho biểu đồ tròn tỷ trọng chi tiêu (Thứ 5)
  const expenseData = [
    { name: 'Ăn uống', value: 65000, color: '#ef4444' },      // Đỏ
    { name: 'Mua sắm', value: 3200000, color: '#3b82f6' },    // Xanh dương
    { name: 'Di chuyển', value: 0, color: '#eab308' },        // Vàng (Tạm thời bằng 0)
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>Tổng Quan Tài Chính Cá Nhân</h2>
      <p style={styles.subtitle}>Số liệu thống kê tháng này của bạn</p>

      {/* CÁC KHỐI HIỂN THỊ THÔNG TIN TỔNG QUAN */}
      <div style={styles.gridCards}>
        <div style={{ ...styles.card, borderLeft: '6px solid #10b981' }}>
          <p style={styles.cardLabel}>Số dư hiện tại</p>
          <h3 style={{ ...styles.cardValue, color: '#10b981' }}>
            {financialSummary.balance.toLocaleString()} VND
          </h3>
        </div>

        <div style={{ ...styles.card, borderLeft: '6px solid #3b82f6' }}>
          <p style={styles.cardLabel}>Tổng thu nhập / tháng</p>
          <h3 style={{ ...styles.cardValue, color: '#3b82f6' }}>
            {financialSummary.totalIncome.toLocaleString()} VND
          </h3>
        </div>

        <div style={{ ...styles.card, borderLeft: '6px solid #ef4444' }}>
          <p style={styles.cardLabel}>Tổng chi tiêu / tháng</p>
          <h3 style={{ ...styles.cardValue, color: '#ef4444' }}>
            {financialSummary.totalExpense.toLocaleString()} VND
          </h3>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ BIỂU ĐỒ TRÒN */}
      <div style={styles.chartContainer}>
        <h4 style={styles.chartTitle}>Tỷ Trọng Chi Tiêu Theo Danh Mục</h4>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString()} VND`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Bộ CSS-in-JS layout trực quan cho trang Dashboard tổng quan
const styles = {
  container: { padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  pageTitle: { margin: '0 0 5px 0', fontSize: '26px', color: '#0f172a' },
  subtitle: { margin: '0 0 30px 0', fontSize: '14px', color: '#64748b' },
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' },
  card: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardLabel: { margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' },
  cardValue: { margin: 0, fontSize: '22px', fontWeight: 'bold' },
  chartContainer: { background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '500px' },
  chartTitle: { margin: '0 0 20px 0', fontSize: '16px', color: '#1e293b', fontWeight: 'bold' }
};

export default Dashboard;