import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/transactions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTransactions(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu vẽ biểu đồ:", error);
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  // ==========================================
  // LOGIC BỘ LỌC NĂM & THÁNG (BẢNG ĐIỀU KHIỂN)
  // ==========================================
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    const matchesYear = tDate.getFullYear().toString() === selectedYear;

    let matchesMonth = true;
    if (selectedMonth !== "Tất cả") {
      const m = tDate.getMonth() + 1;
      matchesMonth = `Tháng ${m}` === selectedMonth;
    }
    return matchesYear && matchesMonth;
  });

  // ==========================================
  // XỬ LÝ SỐ LIỆU ĐỂ ĐƯA VÀO CÁC CARD THỐNG KÊ
  // ==========================================
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Giả lập các nhóm danh mục bổ sung giống mẫu (Đầu tư, Đi vay, Cho vay, Tiết kiệm)
  // Nếu DB của ní có danh mục này thì nó tự động tính thật
  const totalInvestment = filteredTransactions
    .filter((t) => t.category_name?.toLowerCase().includes("đầu tư"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBorrow = filteredTransactions
    .filter((t) => t.category_name?.toLowerCase().includes("vay"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const currentBalance = totalIncome - totalExpense;

  // ==========================================
  // CẤU HÌNH DỮ LIỆU CÁC BIỂU ĐỒ (CHARTS)
  // ==========================================

  // 1. Biểu đồ Đường: Chi tiêu theo danh mục
  // ==========================================================
  // XỬ LÝ LOGIC GOM TỔNG TIỀN THEO DANH MỤC (GIỐNG 100% MẪU)
  // ==========================================================
  // Gom tất cả giao dịch (bao gồm cả Thu, Chi, Đầu tư...) theo tên danh mục
  const dashboardCategoryTotals = filteredTransactions.reduce((acc, curr) => {
    const catName = curr.category_name || "Khác";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const lineChartLabels = Object.keys(dashboardCategoryTotals);
  const lineChartValues = Object.values(dashboardCategoryTotals);

  // Cấu hình lại data cho Line Chart hiển thị theo Tên Danh Mục
  const lineChartData = {
    labels: lineChartLabels.length > 0 ? lineChartLabels : ["Chưa có dữ liệu"],
    datasets: [
      {
        label: "Số tiền (Triệu VNĐ hoặc VNĐ)",
        data: lineChartValues.length > 0 ? lineChartValues : [0],
        borderColor: "#3b82f6", // Đường màu xanh dương uốn lượn giống mẫu
        backgroundColor: "rgba(59, 130, 246, 0.05)", // Đổ nền mờ nhẹ phía dưới
        tension: 0.4, // Độ cong mượt mà của đường line giống ảnh mẫu
        pointBackgroundColor: "#ef4444", // Chấm nút màu đỏ nổi bật trên đỉnh
        pointBorderColor: "#fff",
        pointRadius: 5,
        fill: true,
      },
    ],
  };

  // 2. Biểu đồ Tròn (Hình nhẫn): Khoản thu theo danh mục
  const incomes = filteredTransactions.filter((t) => t.type === "income");
  const incomeCategoryTotals = incomes.reduce((acc, curr) => {
    const catName = curr.category_name || "Chưa phân loại";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const pieChartData = {
    labels:
      Object.keys(incomeCategoryTotals).length > 0
        ? Object.keys(incomeCategoryTotals)
        : ["Trống"],
    datasets: [
      {
        data:
          Object.values(incomeCategoryTotals).length > 0
            ? Object.values(incomeCategoryTotals)
            : [1],
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ec4899",
          "#8b5cf6",
        ],
      },
    ],
  };

  // Biểu đồ Pie cho khoản chi
  const expenses = filteredTransactions.filter((t) => t.type === "expense");
  const expenseCategoryTotals = expenses.reduce((acc, curr) => {
    const catName = curr.category_name || "Chưa phân loại";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const expensePieChartData = {
    labels:
      Object.keys(expenseCategoryTotals).length > 0
        ? Object.keys(expenseCategoryTotals)
        : ["Trống"],
    datasets: [
      {
        data:
          Object.values(expenseCategoryTotals).length > 0
            ? Object.values(expenseCategoryTotals)
            : [1],
        backgroundColor: [
          "#ef4444", // Đỏ đậm (Cực kỳ cảnh báo cho Chi tiêu)
          "#f97316", // Cam rực
          "#facc15", // Vàng chanh
          "#a855f7", // Tím mộng mơ
          "#ec4899", // Hồng cánh sen
          "#6366f1", // Xanh chàm (Indigo - không lo bị lẫn với xanh lục/xanh lá)
        ],
      },
    ],
  };


  // 3. Biểu đồ Cột dọc: So sánh nhanh Thu - Chi - Số dư
  const barChartData = {
    labels: ["Tổng Thu", "Tổng Chi", "Số Dư"],
    datasets: [
      {
        label: "Số tiền (VND)",
        data: [totalIncome, totalExpense, currentBalance],
        backgroundColor: ["#10b981", "#ef4444", "#3b82f6"],
      },
    ],
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Đang thiết lập không gian tài chính cho ní...
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>


      {/* 2. KHU VỰC NỘI DUNG CHÍNH (CONTENT AREA) */}
      <div style={styles.mainContent}>
        {/* HÀNG CARD BÁO CÁO SỐ LIỆU ĐA MÀU SẮC PHÍA TRÊN */}
        <div style={styles.topStatsRow}>
          <div
            style={{
              ...styles.statCard,
              background: "#fecaca",
              color: "#991b1b",
            }}
          >
            <h3>{totalExpense.toLocaleString()}</h3>
            <p>Tổng số tiền đã chi (âm)</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              background: "#c7d2fe",
              color: "#3730a3",
            }}
          >
            <h3>{totalIncome.toLocaleString()}</h3>
            <p>Tổng số tiền đã thu</p>
          </div>
          <div
            style={{
              ...styles.statCard,
              background: "#bbf7d0",
              color: "#166534",
            }}
          >
            <h3>{currentBalance.toLocaleString()}</h3>
            <p>Số dư hiện tại</p>
          </div>
        </div>

        {/* KHỐI GRID CHỨA BẢNG ĐIỀU KHIỂN & CÁC BIỂU ĐỒ */}
        <div style={styles.dashboardGrid}>
          {/* Ô BẢNG ĐIỀU KHIỂN BỘ LỌC (NĂM / THÁNG) */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Bảng điều khiển</h4>

            <div style={styles.filterSection}>
              <p style={styles.filterTitle}>Năm</p>
              <div style={styles.btnGroup}>
                {["2024", "2025", "2026"].map((y) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    style={{
                      ...styles.filterBtn,
                      ...(selectedYear === y ? styles.activeBtn : {}),
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <p style={styles.filterTitle}>Tháng</p>
              <div style={styles.gridMonths}>
                {[
                  "Tất cả",
                  "Tháng 1",
                  "Tháng 2",
                  "Tháng 3",
                  "Tháng 4",
                  "Tháng 5",
                  "Tháng 6",
                  "Tháng 7",
                  "Tháng 8",
                  "Tháng 9",
                  "Tháng 10",
                  "Tháng 11",
                  "Tháng 12",
                ].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    style={{
                      ...styles.monthBtn,
                      ...(selectedMonth === m ? styles.activeMonthBtn : {}),
                    }}
                  >
                    {m === "Tất cả" ? "Tất cả" : m.replace("Tháng ", "")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ ĐƯỜNG XU HƯỚNG CHI TIÊU */}
          <div style={{ ...styles.card, flex: 2 }}>
            <h4 style={styles.cardTitle}>
            Biểu đồ thể hiện thu chi theo danh mục
            </h4>
            <div style={styles.chartHolder}>
              <Line
                data={lineChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          {/* BIỂU ĐỒ TRÒN KHOẢN THU */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Khoản thu theo Danh mục</h4>
            <div style={styles.chartHolder}>
              <Pie data={pieChartData} />
            </div>
          </div>

          {/* BIỂU ĐỒ TRÒN KHOẢN chi */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Khoản chi theo Danh mục</h4>
            <div style={styles.chartHolder}>
              <Pie data={expensePieChartData} />
            </div>
          </div>

          {/* BIỂU ĐỒ CỘT SO SÁNH TỔNG QUAN */}
          <div style={{ ...styles.card, flex: 1.5 }}>
            <h4 style={styles.cardTitle}>Cân đối Thu nhập & Chi tiêu</h4>
            <div style={styles.chartHolder}>
              <Bar
                data={barChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HỆ THỐNG STYLE SHEET SẠCH SẼ THEO MẪU XỊN
// ==========================================
const styles = {
  dashboardContainer: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    fontFamily: "Segoe UI, sans-serif",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#0f172a",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
  },
  profileSection: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
  },
  avatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
  },
  profileName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#cbd5e1",
  },
  menuList: { listStyle: "none", padding: 0, margin: "20px 0", flex: 1 },
  menuItem: {
    padding: "12px 25px",
    fontSize: "14px",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s",
  },
  activeMenuItem: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderLeft: "4px solid #3b82f6",
    fontWeight: "600",
  },
  sidebarFooter: {
    textAlign: "center",
    fontSize: "12px",
    color: "#475569",
    paddingTop: "10px",
    borderTop: "1px solid #1e293b",
  },
  mainContent: {
    flex: 1,
    padding: "25px",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  topStatsRow: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },
  statCard: {
    flex: 1,
    minWidth: "180px",
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  dashboardGrid: { display: "flex", flexWrap: "wrap", gap: "20px" },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.03)",
    minWidth: "300px",
    boxSizing: "border-box",
  },
  cardTitle: {
    margin: "0 0 15px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px",
  },
  filterSection: { marginBottom: "15px" },
  filterTitle: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "bold",
  },
  btnGroup: { display: "flex", gap: "5px" },
  filterBtn: {
    flex: 1,
    padding: "6px 0",
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  activeBtn: { background: "#10b981", color: "#fff", borderColor: "#10b981" },
  gridMonths: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "5px",
  },
  monthBtn: {
    padding: "6px 0",
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "11px",
    color: "#64748b",
  },
  activeMonthBtn: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },
  chartHolder: {
    width: "100%",
    height: "240px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    padding: "50px",
    textAlign: "center",
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "600",
  },
};
