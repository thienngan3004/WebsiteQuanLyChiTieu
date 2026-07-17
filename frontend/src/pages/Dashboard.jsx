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
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartDataLabels
);

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("Tất cả");
  const [selectedWeek, setSelectedWeek] = useState("Tất cả");

  const monthsList = ["Tất cả", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const weeksList = ["Tất cả", "Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5"];

  const [isOpenBudgetModal, setIsOpenBudgetModal] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({
    category_id: "",
    amount: "",
  });

  const [categories, setCategories] = useState([]);

  //Thêm các State quản lý Popup & Insight
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [categoryDetails, setCategoryDetails] = useState([]);

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
    const m = tDate.getMonth() + 1; // Lấy tháng thực tế (1 - 12)
    const day = tDate.getDate();     // Lấy ngày trong tháng (1 - 31)

    // 1. Kiểm tra khớp Tháng
    let matchesMonth = true;
    if (selectedMonth !== "Tất cả") {
      matchesMonth = m === Number(selectedMonth);
    }

    // 2. Kiểm tra khớp Tuần (Chia ngày theo phân khúc 7 ngày một tuần)
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

  const categoryNames = Object.keys(expenseCategoryTotals);
  const categoryAmounts = Object.values(expenseCategoryTotals);

  const expensePieChartData = {
    labels: categoryNames.length > 0 ? categoryNames : ["Trống"],
    datasets: [
      {
        data: categoryAmounts.length > 0 ? categoryAmounts : [1],
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

  // Cấu hình Options cho Pie Chart (Giữ nguyên phần click + hiển thị % như cũ)
  const expensePieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    events: ['mousemove', 'mouseout', 'click', 'touchstart'],
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 8,
          font: { size: 11 },
        },
      },
      datalabels: {
        display: true,
        color: "#ffffff",
        anchor: "center",
        align: "center",  
        offset: 0,
        font: {
          weight: "bold",
          size: 12,
        },
        formatter: (value) => {
          if (totalExpense === 0) return "";
          const percentage = ((value / totalExpense) * 100).toFixed(1);
          return percentage > 5 ? `${percentage}%` : ""; 
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const percentage = totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : 0;
            return ` Số tiền: ${value.toLocaleString("vi-VN")} VND (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event, elements, chart) => {

      console.log("Đang click vào biểu đồ tròn..."); //debug

      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const clickedCategory = categoryNames[index];

        console.log("Danh mục click trúng:", clickedCategory); //debug
        
        const details = expenses.filter(
          (t) => (t.category_name || "Chưa phân loại") === clickedCategory
        );
        
        setSelectedCategory(clickedCategory);
        setCategoryDetails(details);
        setShowPopup(true);
      } else {
        console.log("Không click trúng phân vùng nào trên biểu đồ tròn."); //debug
      }
    },
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

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: true,
        color: "black",         
        anchor: "end", 
        align: "top",  
        offset: -3,
        font: {
          size: 10,
        },
        formatter: (value) => {
          if (!value) return "0 VND";
          return value.toLocaleString("vi-VN") + " VND"; 
        },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grace: "15%",
        ticks: {
          callback: (value) => value.toLocaleString("vi-VN") + " đ",
        },
      },
    },
  };

  const otherChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: true,
        color: "#ffffff",         
        borderRadius: 4,
        padding: 4,
        anchor: "center",
        align: "center",
        font: {
          size: 10,
        },
        formatter: (value) => {
          if (!value) return "0 VND";
          return value.toLocaleString("vi-VN") + " VND"; // Thêm đơn vị VND
        },
      },
      legend: {
        display: true,
        position: "top",
      },
    },
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
          <h3 style={styles.cardTitle}>Bảng điều khiển</h3>

          {/* CHỌN THÁNG */}
          <div style={styles.section}>
            <label style={styles.label}>Tháng trong năm</label>
            <div style={styles.gridContainer}>
              {monthsList.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(month);
                    setSelectedWeek("Tất cả"); // Auto reset tuần khi đổi tháng
                  }}
                  style={{
                    ...styles.btn,
                    ...(selectedMonth === month ? styles.btnActiveMonth : {}),
                  }}
                >
                  {month === "Tất cả" ? "Tất cả" : `Tháng ${month}`}
                </button>
              ))}
            </div>
          </div>

          {/* CHỌN TUẦN */}
          <div style={styles.section}>
            <label style={styles.label}>Tuần trong tháng</label>
            <div style={styles.weekFlexContainer}>
              {weeksList.map((week) => (
                <button
                  key={week}
                  type="button"
                  disabled={selectedMonth === "Tất cả"} // Khóa chọn tuần nếu chọn "Tất cả tháng"
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

          {/* BIỂU ĐỒ ĐƯỜNG XU HƯỚNG CHI TIÊU */}
          <div style={{ ...styles.card, flex: 2 }}>
            <h4 style={styles.cardTitle}>
              Biểu đồ thể hiện thu chi theo danh mục
            </h4>
            <div style={styles.chartHolder}>
              <Line
                data={lineChartData}
                options={lineChartOptions}
              />
            </div>
          </div>

          {/* BIỂU ĐỒ TRÒN KHOẢN THU
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Khoản thu theo Danh mục</h4>
            <div style={styles.chartHolder}>
              <Pie data={pieChartData} />
            </div>
          </div> */}

          {/* BIỂU ĐỒ TRÒN KHOẢN chi */}
          <div style={{ ...styles.card, position: 'relative' }}>
            <h4 style={styles.cardTitle}>Khoản chi theo Danh mục</h4>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "-6px 0 8px 0" }}>
              * Chú thích: Click vào các phân vùng màu sắc để xem nguồn tiền và chi tiết giao dịch.
            </p>
            <div style={styles.chartHolder}>
              <Pie data={expensePieChartData} options={expensePieChartOptions} />
            </div>
          </div>


          <div style={{ ...styles.card, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <h4 style={{ ...styles.cardTitle, color: "#1e293b" }}>💡 Phân tích & Gợi ý (Insight)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {totalExpense > 0 ? (
                <>
                  <div style={{ padding: "10px", backgroundColor: "#eff6ff", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#1e40af", margin: "0 0 4px 0" }}>Khoản chi tiêu lớn nhất:</p>
                    <p style={{ fontSize: "11px", color: "#1e3a8a", margin: 0 }}>
                      Nhóm <span style={{ fontWeight: "bold", color: "#ef4444" }}>"{categoryNames[categoryAmounts.indexOf(Math.max(...categoryAmounts))]}"</span> đang chiếm tỷ trọng lớn nhất với tổng chi <strong>{Math.max(...categoryAmounts).toLocaleString("vi-VN")} VND</strong>.
                    </p>
                  </div>
                  <div style={{ padding: "10px", backgroundColor: "#fffbeb", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                    <p style={{ fontSize: "12px", fontWeight: "bold", color: "#92400e", margin: "0 0 4px 0" }}>Gợi ý quản lý ví:</p>
                    <p style={{ fontSize: "11px", color: "#78350f", margin: 0 }}>
                      Bạn nên phân bổ lại ngân sách hoặc đặt hạn mức chi tiêu cho các hoạt động giải trí, mua sắm để duy trì số dư ổn định cuối tháng.
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "12px", color: "#64748b" }}>Chưa phát hiện giao dịch chi tiêu nào trong tháng để phân tích.</p>
              )}
            </div>
          </div>


          {/* BIỂU ĐỒ CỘT SO SÁNH TỔNG QUAN */}
          <div style={{ ...styles.card, flex: 1.5 }}>
            <h4 style={styles.cardTitle}>Cân đối Thu nhập & Chi tiêu</h4>
            <div style={styles.chartHolder}>
              <Bar
                data={barChartData}
                options={otherChartOptions}
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
      {/* ==================== POPUP CHI TIẾT GIAO DỊCH (MODAL DÀNH CHO DASHBOARD) ==================== */}
      {showPopup && (
        <div style={localStyles.modalOverlay}>
          <div style={localStyles.modalContent}>
            <div style={localStyles.modalHeader}>
              <h3 style={localStyles.modalTitle}>
                Chi tiết: <span style={{ color: "#ef4444" }}>{selectedCategory}</span>
              </h3>
              <button style={localStyles.closeBtn} onClick={() => setShowPopup(false)}>
                &times;
              </button>
            </div>
            
            <div style={localStyles.modalBody}>
              {categoryDetails.length > 0 ? (
                categoryDetails.map((t, idx) => {
                  // Việt hóa tên nguồn tiền hiển thị chuẩn xác
                  let sourceText = "Tiền mặt";
                  if (t.source_type === "wallet" || t.source_type === "e-wallet") sourceText = "Ví điện tử";
                  if (t.source_type === "card") sourceText = "Thẻ ngân hàng";

                  return (
                    <div key={idx} style={localStyles.itemCard}>
                      <div style={{ flex: 1 }}>
                        <p style={localStyles.itemDate}>
                          {t.date || t.transaction_date ? new Date(t.date || t.transaction_date).toLocaleDateString("vi-VN") : "Không rõ ngày"}
                        </p>
                        <p style={localStyles.itemDesc}>{t.description || "Không có ghi chú"}</p>
                        <span style={{
                          ...localStyles.badge,
                          backgroundColor: t.source_type === "wallet" || t.source_type === "e-wallet" ? "#f3e8ff" : t.source_type === "card" ? "#dbeafe" : "#f3f4f6",
                          color: t.source_type === "wallet" || t.source_type === "e-wallet" ? "#7e22ce" : t.source_type === "card" ? "#1d4ed8" : "#374151"
                        }}>
                          Nguồn: {sourceText}
                        </span>
                      </div>
                      <span style={localStyles.itemAmount}>
                        -{Number(t.amount).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  );
                })
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

// DÁN ĐOẠN NÀY VÀO CUỐI CÙNG CỦA FILE DASHBOARD.JSX (BÊN NGOÀI HÀM COMPONENT)
const localStyles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Đảm bảo nổi hẳn lên trên cùng các biểu đồ
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    width: "90%",
    maxWidth: "420px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  modalTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "26px",
    color: "#94a3b8",
    cursor: "pointer",
    lineHeight: "1",
  },
  modalBody: {
    maxHeight: "280px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  itemCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #f1f5f9",
  },
  itemDate: {
    fontSize: "10px",
    color: "#64748b",
    margin: "0 0 3px 0",
  },
  itemDesc: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    margin: "0 0 5px 0",
  },
  itemAmount: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#e11d48",
  },
  badge: {
    fontSize: "9px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "10px",
  }
};

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
    position: "relative",
    zIndex: 1,
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
    position: "relative",
    width: "100%",
    height: "240px",
    cursor: "pointer",
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
  controlCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    width: "100%",
    maxWidth: "400px",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "20px",
    marginTop: 0,
  },
  section: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "10px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  weekFlexContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  btn: {
    padding: "10px 6px",
    borderWidth: "1px",            
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  btnWeek: {
    padding: "10px 14px",
    borderWidth: "1px",            
    borderStyle: "solid",
    borderColor: "#cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  btnActiveMonth: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
    fontWeight: "600",
  },
  btnActiveWeek: {
    background: "#10b981",
    color: "#fff",
    borderColor: "#10b981",
    fontWeight: "600",
  },
  btnDisabled: {
    background: "#f1f5f9",
    color: "#94a3b8",
    borderColor: "#e2e8f0",
    cursor: "not-allowed",
  },
};
