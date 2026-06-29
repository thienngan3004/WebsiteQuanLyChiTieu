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

  const [isOpenBudgetModal, setIsOpenBudgetModal] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({
    category_id: "",
    amount: "",
  });

  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setCategories(data);
      }
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  useEffect(() => {
    fetchBudgetWarnings();
    fetchCategories();
  }, []);
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

  const [budgetWarnings, setBudgetWarnings] = useState([]);

  const fetchBudgetWarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/budgets/check-warnings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setBudgetWarnings(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy cảnh báo ngân sách:", error);
    }
  };

  useEffect(() => {
    fetchBudgetWarnings();
  }, [transactions]);

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
  // Nếu DB có danh mục này thì nó tự động tính thật
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
          "#ef4444",
          "#f97316",
          "#facc15",
          "#a855f7",
          "#ec4899",
          "#6366f1",
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
      <div style={styles.loading}>Đang thiết lập không gian tài chính...</div>
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
            <p>Tổng số tiền đã chi</p>
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

        {/* KHỐI GRID CHỨA BẢNG ĐIỀU KHIỂN & CÁ C BIỂU ĐỒ */}
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

        {/* KHU VỰC GIÁM SÁT NGÂN SÁCH DANH MỤC */}
        <div
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "8px",
            marginTop: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Căn chỉnh Tiêu đề và Nút Đặt hạn mức nằm cùng 1 hàng ngang */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h4 style={{ margin: 0, color: "#374151" }}>
                ⚠️ Giám sát Ngân sách Danh mục
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  margin: "5px 0 0 0",
                }}
              >
                Chỉ hiển thị các danh mục mà bạn đã thiết lập hạn mức chi tiêu.
              </p>
            </div>
            <button
              onClick={() => setIsOpenBudgetModal(true)}
              style={{
                padding: "8px 12px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              ⚙️ Đặt hạn mức
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            {budgetWarnings.length === 0 ? (
              <p style={{ color: "#9ca3af", fontStyle: "italic", margin: 0 }}>
                Bạn chưa thiết lập hạn mức chi tiêu cho danh mục nào trong tháng
                này.
              </p>
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
                  <div
                    key={budget.budget_id}
                    style={{
                      padding: "15px",
                      borderRadius: "6px",
                      border: `2px solid ${borderColor}`,
                      background: bgColor,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontWeight: "bold",
                      }}
                    >
                      <span
                        style={{
                          color: statusColor,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {budget.category_name} {statusText}
                        <button
                          onClick={() => {
                            setBudgetFormData({
                              category_id: budget.category_id,
                              amount: budget.budget_limit,
                            });
                            setIsOpenBudgetModal(true);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor:
                              percentage > 100
                                ? "#fca5a5"
                                : percentage >= 85
                                ? "#fde68a"
                                : "#cbd5e1",
                            color: "#1f2937",
                            transition: "all 0.2s",
                          }}
                          title="Sửa hạn mức"
                        >
                        Chỉnh sửa hạn mức
                        </button>
                      </span>

                      <span style={{ color: "#4b5563" }}>
                        {Number(budget.total_spent).toLocaleString("vi-VN")}đ /{" "}
                        {Number(budget.budget_limit).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    {/* Thanh tiến độ UI */}
                    <div
                      style={{
                        width: "100%",
                        background: "#e5e7eb",
                        height: "10px",
                        borderRadius: "5px",
                        marginTop: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          background:
                            percentage > 100
                              ? "#b91c1c"
                              : percentage >= 85
                              ? "#f59e0b"
                              : "#10b981",
                          height: "100%",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        marginTop: "5px",
                        marginBottom: 0,
                        color: statusColor,
                      }}
                    >
                      Đã chi tiêu: <strong>{Math.round(percentage)}%</strong>{" "}
                      ngân sách.
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* POPUP MODAL TỰ ĐỘNG BUNG RA KHI ẤN ĐẶT HẠN MỨC */}
        {isOpenBudgetModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: "25px",
                borderRadius: "8px",
                width: "350px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "15px" }}>
                📅 Đặt Hạn Mức Tháng {new Date().getMonth() + 1}
              </h3>

              <form onSubmit={handleCreateBudget}>
                {/* Dropdown Chọn danh mục */}
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      fontSize: "14px",
                      textAlign: "left",
                    }}
                  >
                    Danh mục:
                  </label>
                  <select
                    value={budgetFormData.category_id}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        category_id: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="">-- Chọn danh mục chi tiêu --</option>
                    {/* Render động danh sách danh mục từ biến categories truyền sang */}
                    {typeof categories !== "undefined" &&
                      categories
                        .filter((c) => c.type === "expense")
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Ô Nhập số tiền */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                      fontSize: "14px",
                      textAlign: "left",
                    }}
                  >
                    Hạn mức (VND):
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 1000000"
                    value={budgetFormData.amount}
                    onChange={(e) =>
                      setBudgetFormData({
                        ...budgetFormData,
                        amount: e.target.value,
                      })
                    }
                    style={{
                      width: "93%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                {/* Cụm nút hành động */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsOpenBudgetModal(false)}
                    style={{
                      padding: "8px 12px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 12px",
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Lưu lại
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
