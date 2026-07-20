import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
// 1. Import plugin hiển thị text lên biểu đồ
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Đăng ký các thành phần cần thiết cùng với Plugin DataLabels
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels // Đăng ký tại đây để kích hoạt tính năng hiển thị text
);

export default function Dashboard() {
  // ==========================================
  // CÁC STATE (HOOKS) NẰM TRÊN CÙNG
  // ==========================================
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedWeek, setSelectedWeek] = useState("Tất cả");
  const [isOpenBudgetModal, setIsOpenBudgetModal] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({ category_id: "", amount: "" });
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState([]);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [chartData503020, setChartData503020] = useState(null);

  const monthsList = ["Tất cả", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const weeksList = ["Tất cả", "Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5"];

  // Styles giả lập
  const styles = window.styles || {
    loading: { textAlign: "center", padding: "50px", fontSize: "18px" },
    dashboardContainer: { padding: "20px", fontFamily: "Arial, sans-serif" },
    mainContent: { display: "flex", flexDirection: "column", gap: "20px" },
    topStatsRow: { display: "flex", gap: "15px", justifyContent: "space-between" },
    statCard: { flex: 1, padding: "15px", borderRadius: "8px", textAlign: "center" },
    dashboardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" },
    card: { padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
    cardTitle: { margin: "0 0 15px 0", fontSize: "16px", fontWeight: "bold" },
    section: { marginBottom: "15px" },
    label: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" },
    gridContainer: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" },
    btn: { padding: "6px", fontSize: "12px", cursor: "pointer", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" },
    btnActiveMonth: { background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },
    weekFlexContainer: { display: "flex", gap: "5px", flexWrap: "wrap" },
    btnWeek: { padding: "6px 10px", fontSize: "12px", cursor: "pointer", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" },
    btnActiveWeek: { background: "#10b981", color: "#fff", borderColor: "#10b981" },
    btnDisabled: { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" },
    chartHolder: { minHeight: "260px", position: "relative" } // Tăng nhẹ chiều cao để hiển thị nhãn thoải mái
  };

  const localStyles = {
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
    modalContent: { background: "#fff", padding: "25px", borderRadius: "8px", width: "450px", maxHeight: "80vh", overflowY: "auto" },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
    modalTitle: { margin: 0, fontSize: "18px" },
    closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer" },
    modalBody: { display: "flex", flexDirection: "column", gap: "10px" },
    itemCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #eee" },
    itemDate: { margin: 0, fontSize: "11px", color: "#6b7280" },
    itemDesc: { margin: "2px 0", fontSize: "13px", fontWeight: "500" },
    badge: { fontSize: "10px", padding: "2px 6px", borderRadius: "4px", display: "inline-block" },
    itemAmount: { fontWeight: "bold", color: "#ef4444", fontSize: "14px" }
  };

  // ==========================================
  // LOGIC BỘ LỌC NĂM & THÁNG
  // ==========================================
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date || t.transaction_date);
    const m = tDate.getMonth() + 1;
    const day = tDate.getDate();

    let matchesMonth = true;
    if (selectedMonth !== "Tất cả") matchesMonth = m === Number(selectedMonth);

    let matchesWeek = true;
    if (selectedWeek !== "Tất cả" && selectedMonth !== "Tất cả") {
      if (selectedWeek === "Tuần 1") matchesWeek = day >= 1 && day <= 7;
      else if (selectedWeek === "Tuần 2") matchesWeek = day >= 8 && day <= 14;
      else if (selectedWeek === "Tuần 3") matchesWeek = day >= 15 && day <= 21;
      else if (selectedWeek === "Tuần 4") matchesWeek = day >= 22 && day <= 28;
      else if (selectedWeek === "Tuần 5") matchesWeek = day >= 29;
    }
    return matchesMonth && matchesWeek;
  });

  // ==========================================
  // TÍNH TOÁN SỐ LIỆU TỔNG HỢP (PHẢI ĐẶT TRÊN CÙNG)
  // ==========================================
  const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const currentBalance = totalIncome - totalExpense;

  // Gom dữ liệu cho biểu đồ tròn (Chỉ lấy chi phí 'expense')
  const expenseCategoryMap = {};
  filteredTransactions.filter(t => t.type === "expense").forEach(t => {
    const name = t.category_name || "Khác";
    expenseCategoryMap[name] = (expenseCategoryMap[name] || 0) + Number(t.amount);
  });
  const categoryNames = Object.keys(expenseCategoryMap);
  const categoryAmounts = Object.values(expenseCategoryMap);


  // ==========================================
  // CẤU HÌNH CONFIG CHO BIỂU ĐỒ (ĐẶT PHÍA DƯỚI)
  // ==========================================
  
  // 1. Cấu hình cho Biểu đồ Cột (Thu chi theo danh mục)
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#1f2937',
        font: { size: 11 },
        formatter: (value) => {
          if (!value) return "";
          return `${value.toLocaleString()}đ`;
        }
      }
    },
    scales: {
      y: { grace: '10%' }
    }
  };

  const getCategoryColor = (name) => {
    const normName = name.toLowerCase();

    // 1. Đỏ 🔴: Cố định, Thuê nhà, Vay nợ, Vượt mức
    if (normName.includes('nhà') || normName.includes('thuê') || normName.includes('cố định') || normName.includes('nợ')) return '#ef4444';
    
    // 2. Xanh dương 🔵: Sinh hoạt thiết yếu (Ăn uống, Đi lại, Di chuyển, Điện nước)
    if (normName.includes('ăn') || normName.includes('uống') || normName.includes('đi lại')) return '#3b82f6';
    
    // 3. Vàng 🟡: Mua sắm, Giải trí, Quần áo, Xem phim, Du lịch, Bạn bè
    if (normName.includes('sắm') || normName.includes('giải trí') || normName.includes('chơi') || normName.includes('phim') || normName.includes('lịch') || normName.includes('bạn')) return '#eab308';
    
    // 3. Vàng 🟡: Mua sắm, Giải trí, Quần áo, Xem phim, Du lịch, Bạn bè
    if ( normName.includes('di chuyển') || normName.includes('xe') || normName.includes('điện') || normName.includes('nước')) return '#ec4899';
    
    // 4. Cam 🟠: Giáo dục, Phát triển bản thân, Học phí, Sách vở, Khóa học
    if (normName.includes('học') || normName.includes('sách') || normName.includes('khóa học') || normName.includes('bản thân')) return '#f97316';
    
    // 5. Tím 🟣: Sức khỏe, Y tế, Khám bệnh, Thuốc men, Thể thao, Gia đình
    if (normName.includes('khỏe') || normName.includes('y tế') || normName.includes('bệnh') || normName.includes('thuốc') || normName.includes('thao') || normName.includes('đình')) return '#a855f7';
    
    // 6. Xanh lá 🟢: Tiết kiệm, Đầu tư, Quyên góp (Khoản tiền mang tính tích lũy/gieo hạt)
    if (normName.includes('kiệm') || normName.includes('đầu tư') || normName.includes('tích lũy') || normName.includes('góp')) return '#10b981';

    // 7. Xám ⚪: Các mục còn lại (Khác, Chưa phân loại)
    return '#94a3b8';
  };

  // 2. Dữ liệu cho Biểu đồ Tròn
  const expensePieChartData = {
    labels: categoryNames,
    datasets: [{
      data: categoryAmounts,
      backgroundColor: categoryNames.map(name => getCategoryColor(name))
    }]
  };

  // 3. Cấu hình cho Biểu đồ Tròn
  const expensePieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff', 
        font: { size: 11 },
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowBlur: 4,
        formatter: (value) => {
          if (!value) return "";
          return `${value.toLocaleString()}đ`;
        }
      }
    },
    onClick: (evt, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const catName = categoryNames[index];
        setSelectedCategory(catName);
        const details = filteredTransactions.filter(t => (t.category_name || "Khác") === catName && t.type === "expense");
        setCategoryDetails(details);
        setShowPopup(true);
      }
    }
  };

  // 4. Cấu hình CỘT ĐÔI SONG SONG cho Biểu đồ Cân đối 50/30/20
  const otherChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#1f2937',
        font: { weight: 'bold', size: 10 },
        formatter: (value) => value > 0 ? `${value.toLocaleString()}đ` : ""
      }
    },
    scales: {
      y: { grace: '15%' }
    }
  };

  // ==========================================
  // CÁC HÀM XỬ LÝ LOGIC & CALL API
  // ==========================================
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      if (Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error("Lỗi lấy danh mục tại Dashboard:", error);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!budgetFormData.category_id || !budgetFormData.amount) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      await axios.post(
        "http://localhost:5000/api/budgets",
        {
          category_id: parseInt(budgetFormData.category_id),
          amount: parseFloat(budgetFormData.amount),
          month: currentMonth,
          year: currentYear,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Đặt hạn mức thành công!");
      setIsOpenBudgetModal(false);
      setBudgetFormData({ category_id: "", amount: "" });
      fetchBudgetWarnings();
    } catch (error) {
      console.error("Lỗi tạo ngân sách:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt hạn mức.");
    }
  };

  const fetchBudgetWarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/budgets/check-warnings?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setBudgetWarnings(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy cảnh báo ngân sách:", error);
    }
  };

  const fetchBalance503020 = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/dashboard/balance-503020",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data) {
        const dbData = response.data.data;

        setChartData503020({
          // Trục hoành chia rõ ràng theo 3 nhóm quy tắc tài chính
          labels: ['Thiết yếu (50%)', 'Sở thích (30%)', 'Tích lũy (20%)'],
          datasets: [
            {
              label: 'Hạn mức Chuẩn',
              data: [dbData.targetNeeds, dbData.targetWants, dbData.targetSavings],
              backgroundColor: '#cbd5e1', // Màu xám đại diện cho mốc tiêu chuẩn so sánh
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
            {
              label: 'Thực tế',
              data: [dbData.realNeeds, dbData.realWants, dbData.realSavings],
              backgroundColor: '#3b82f6', // Màu xanh nổi bật hiển thị thực tế
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu cân đối 50/30/20:", error);
    }
  };

  // ==========================================
  // CÁC EFFECT HOOKS
  // ==========================================
  useEffect(() => {
    fetchBudgetWarnings();
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactions(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu vẽ biểu đồ:", error);
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  useEffect(() => {
    fetchBudgetWarnings();
    fetchBalance503020();
  }, [transactions]);

  if (loading) {
    return <div style={styles.loading}>Đang thiết lập không gian tài chính...</div>;
  }

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.mainContent}>
        
        {/* ==========================================
            HÀM CARD TỔNG QUAN (TOP STATS ROW)
           ========================================== */}
        <div style={styles.topStatsRow}>
          <div style={{ ...styles.statCard, background: "#fecaca", color: "#991b1b" }}>
            <h3>{totalExpense.toLocaleString()}đ</h3>
            <p>Tổng số tiền đã chi</p>
          </div>
          <div style={{ ...styles.statCard, background: "#c7d2fe", color: "#3730a3" }}>
            <h3>{totalIncome.toLocaleString()}đ</h3>
            <p>Tổng số tiền đã thu</p>
          </div>
          <div style={{ ...styles.statCard, background: "#bbf7d0", color: "#166534" }}>
            <h3>{currentBalance.toLocaleString()}đ</h3>
            <p>Số dư hiện tại</p>
          </div>
        </div>

        {/* ==========================================
            HÀNG 1: CHIA THÀNH 3 CỘT ĐỀU NHAU
           ========================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "20px" }}>
          {/* Cột 1: Bảng điều khiển bộ lọc */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Bảng điều khiển</h3>
            <div style={styles.section}>
              <label style={styles.label}>Tháng trong năm</label>
              <div style={styles.gridContainer}>
                {monthsList.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(month);
                      setSelectedWeek("Tất cả");
                    }}
                    style={{ ...styles.btn, ...(selectedMonth === month ? styles.btnActiveMonth : {}) }}
                  >
                    {month === "Tất cả" ? "Tất cả" : `Tháng ${month}`}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Tuần trong tháng</label>
              <div style={styles.weekFlexContainer}>
                {weeksList.map((week) => (
                  <button
                    key={week}
                    type="button"
                    disabled={selectedMonth === "Tất cả"}
                    onClick={() => setSelectedWeek(week)}
                    style={{
                      ...styles.btnWeek,
                      ...(selectedWeek === week ? styles.btnActiveWeek : {}),
                      ...(selectedMonth === "Tất cả" ? styles.btnDisabled : {}),
                    }}
                  >
                    {week}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cột 2: Biểu đồ cột thu chi theo danh mục */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <h4 style={{ ...styles.cardTitle, margin: 0 }}>Biểu đồ thể hiện thu chi theo danh mục</h4>
              <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('expense')}
                  style={{
                    padding: '6px 14px', fontSize: '12px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    backgroundColor: activeTab === 'expense' ? '#ffffff' : 'transparent',
                    color: activeTab === 'expense' ? '#ef4444' : '#4b5563',
                    boxShadow: activeTab === 'expense' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  📊 Chi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('income')}
                  style={{
                    padding: '6px 14px', fontSize: '12px', fontWeight: '500', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    backgroundColor: activeTab === 'income' ? '#ffffff' : 'transparent',
                    color: activeTab === 'income' ? '#10b981' : '#4b5563',
                    boxShadow: activeTab === 'income' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  💰 Thu
                </button>
              </div>
            </div>

            <div style={styles.chartHolder}>
              {(() => {
                const chartMap = {};
                filteredTransactions
                  .filter((t) => t.type === activeTab)
                  .forEach((t) => {
                    const name = t.category_name || "Khác";
                    chartMap[name] = (chartMap[name] || 0) + Number(t.amount);
                  });

                const filteredLabels = Object.keys(chartMap);
                const filteredValues = Object.values(chartMap);

                if (filteredLabels.length === 0) {
                  return <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: '40px' }}>Chưa có dữ liệu {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'} cho mục này.</p>;
                }

                const activeChartData = {
                  labels: filteredLabels,
                  datasets: [
                    {
                      label: activeTab === 'expense' ? 'Số tiền chi' : 'Số tiền thu',
                      data: filteredValues,
                      backgroundColor: activeTab === 'expense' ? '#ef4444' : '#10b981',
                    }
                  ]
                };

                return <Bar data={activeChartData} options={lineChartOptions} />;
              })()}
            </div>
          </div>

          {/* Cột 3: Biểu đồ tròn khoản chi theo danh mục */}
          <div style={{ ...styles.card, position: 'relative' }}>
            <h4 style={styles.cardTitle}>Khoản chi theo Danh mục</h4>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "-6px 0 8px 0" }}>* Chú thích: Click vào từng vùng màu để xem chi tiết.</p>
            <div style={styles.chartHolder}>
              <Pie data={expensePieChartData} options={expensePieChartOptions} />
            </div>
          </div>
        </div>

        {/* ==========================================
            HÀNG 2: CHIA THÀNH 2 CỘT (CÂN ĐỐI & INSIGHT)
           ========================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "20px", marginTop: "5px" }}>
          {/* Cột 1: Cân đối thu nhập & chi tiêu (Quy tắc 50/30/20) */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Cân đối Thu nhập & Chi tiêu</h4>
            <div style={styles.chartHolder}>
              {chartData503020 ? <Bar data={chartData503020} options={otherChartOptions} /> : <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center", paddingTop: "40px" }}>Đang tải dữ liệu.....</p>}
            </div>
          </div>

          {/* Cột 2: Phân tích & Gợi ý (Insight) */}
          <div style={{ ...styles.card, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <h4 style={{ ...styles.cardTitle, color: "#1e293b" }}>💡 Phân tích & Gợi ý (Insight)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {totalExpense > 0 && categoryAmounts.length > 0 ? (
                <>
                  <div style={{ padding: "10px", backgroundColor: "#eff6ff", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e40af", margin: "0 0 4px 0" }}>Khoản chi tiêu lớn nhất:</p>
                    <p style={{ fontSize: "11px", color: "#1e3a8a", margin: 0 }}>
                      Nhóm <span style={{ fontWeight: "bold", color: "#ef4444" }}>"{categoryNames[categoryAmounts.indexOf(Math.max(...categoryAmounts))]}"</span> đang chiếm tỷ trọng lớn nhất với tổng chi <strong>{Math.max(...categoryAmounts).toLocaleString("vi-VN")} VND</strong>.
                    </p>
                  </div>
                  <div style={{ padding: "10px", backgroundColor: "#fffbeb", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#92400e", margin: "0 0 4px 0" }}>Gợi ý quản lý ví:</p>
                    <p style={{ fontSize: "11px", color: "#78350f", margin: 0 }}>Bạn nên phân bổ lại ngân sách hoặc đặt hạn mức chi tiêu để duy trì số dư ổn định.</p>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#64748b" }}>Chưa phát hiện giao dịch chi tiêu nào trong tháng để phân tích.</p>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            HÀNG 3: CHIA THÀNH 1 CỘT (GIÁM SÁT NGÂN SÁCH)
           ========================================== */}
        <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", marginTop: "5px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, color: "#374151" }}>⚠️ Giám sát Ngân sách Danh mục</h4>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: "5px 0 0 0" }}>Chỉ hiển thị các danh mục mà bạn đã thiết lập hạn mức chi tiêu.</p>
            </div>
            <button onClick={() => setIsOpenBudgetModal(true)} style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>⚙️ Đặt hạn mức</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
            
            {console.log("Độ dài mảng budgetWarnings:", budgetWarnings.length)}
            {console.log("Nội dung mảng budgetWarnings:", budgetWarnings)}
            
            {budgetWarnings.length === 0 ? (
              <p style={{ color: "#9ca3af", fontStyle: "italic", margin: 0 }}>Bạn chưa thiết lập hạn mức chi tiêu cho danh mục nào trong tháng này.</p>
            ) : (
              budgetWarnings.map((budget) => {
                const percentage = budget.spent_percentage;
                let statusText = "";
                let statusColor = "#10b981";
                let borderColor = "#e5e7eb";
                let bgColor = "#f9fafb";

                if (percentage > 100) {
                  statusText = "🚨 (ĐÃ VƯỢT HẠN MỨC!)";
                  statusColor = "#b91c1c";
                  borderColor = "#b91c1c";
                  bgColor = "#fef2f2";
                } else if (percentage >= 85 && percentage <= 100) {
                  statusText = "⚠️ (SẮP CHẠM HẠN MỨC!)";
                  statusColor = "#d97706";
                  borderColor = "#f59e0b";
                  bgColor = "#fffbeb";
                }

                return (
                  <div key={budget.budget_id} style={{ padding: "15px", borderRadius: "6px", border: `2px solid ${borderColor}`, background: bgColor, transition: "all 0.3s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold" }}>
                      <span style={{ color: statusColor, display: "flex", alignItems: "center", gap: "8px" }}>
                        {budget.category_name} {statusText}
                        <button
                          onClick={() => {
                            setBudgetFormData({ category_id: budget.category_id, amount: budget.budget_limit });
                            setIsOpenBudgetModal(true);
                          }}
                          style={{
                            background: "none", border: "none", cursor: "pointer", fontSize: "13px", padding: "2px 6px", borderRadius: "4px",
                            backgroundColor: percentage > 100 ? "#fca5a5" : percentage >= 85 ? "#fde68a" : "#cbd5e1", color: "#1f2937"
                          }}
                          title="Sửa hạn mức"
                        >
                          Chỉnh sửa
                        </button>
                      </span>
                      <span style={{ color: "#4b5563" }}>{Number(budget.total_spent).toLocaleString("vi-VN")}đ / {Number(budget.budget_limit).toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div style={{ width: "100%", background: "#e5e7eb", height: "10px", borderRadius: "5px", marginTop: "8px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(percentage, 100)}%`, background: percentage > 100 ? "#b91c1c" : percentage >= 85 ? "#f59e0b" : "#10b981", height: "100%" }} />
                    </div>
                    <p style={{ fontSize: "12px", marginTop: "5px", marginBottom: 0, color: statusColor }}>Đã chi tiêu: <strong>{Math.round(percentage)}%</strong> ngân sách.</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* POPUP MODAL ĐẶT HẠN MỨC */}
        {isOpenBudgetModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ background: "#fff", padding: "25px", borderRadius: "8px", width: "350px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, marginBottom: "15px" }}>📅 Đặt Hạn Mức Tháng {new Date().getMonth() + 1}</h3>
              <form onSubmit={handleCreateBudget}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px", textAlign: "left" }}>Danh mục:</label>
                  <select
                    value={budgetFormData.category_id}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, category_id: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    <option value="">-- Chọn danh mục chi tiêu --</option>
                    {categories.filter((c) => c.type === "expense").map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px", textAlign: "left" }}>Hạn mức (VND):</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 1000000"
                    value={budgetFormData.amount}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                    style={{ width: "93%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setIsOpenBudgetModal(false)} style={{ padding: "8px 12px", background: "#e5e7eb", border: "none", borderRadius: "4px", cursor: "pointer" }}>Hủy</button>
                  <button type="submit" style={{ padding: "8px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Lưu lại</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* POPUP CHI TIẾT GIAO DỊCH KHI CLICK BIỂU ĐỒ TRÒN */}
      {showPopup && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modalContent}>
            <div style={localStyles.modalHeader}>
              <h3 style={localStyles.modalTitle}>Chi tiết: <span style={{ color: "#ef4444" }}>{selectedCategory}</span></h3>
              <button style={localStyles.closeBtn} onClick={() => setShowPopup(false)}>&times;</button>
            </div>
            <div style={localStyles.modalBody}>
              {categoryDetails.length > 0 ? (
                categoryDetails.map((t, idx) => (
                  <div key={idx} style={localStyles.itemCard}>
                    <div style={{ flex: 1 }}>
                      <p style={localStyles.itemDate}>{t.date || t.transaction_date ? new Date(t.date || t.transaction_date).toLocaleDateString("vi-VN") : "Không rõ ngày"}</p>
                      <p style={localStyles.itemDesc}>{t.description || "Không có ghi chú"}</p>
                      <span style={{
                        ...localStyles.badge,
                        backgroundColor: t.source_type === "wallet" || t.source_type === "e-wallet" ? "#f3e8ff" : t.source_type === "card" ? "#dbeafe" : "#f3f4f6",
                        color: t.source_type === "wallet" || t.source_type === "e-wallet" ? "#7e22ce" : t.source_type === "card" ? "#1d4ed8" : "#374151"
                      }}>
                        Nguồn: {t.source_type === "wallet" || t.source_type === "e-wallet" ? "Ví điện tử" : t.source_type === "card" ? "Thẻ ngân hàng" : "Tiền mặt"}
                      </span>
                    </div>
                    <span style={localStyles.itemAmount}>-{Number(t.amount).toLocaleString("vi-VN")} đ</span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#9ca3af" }}>Không tìm thấy lịch sử chi tiết.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}