import React, { useState, useEffect } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import * as XLSX from "xlsx"; // 🔥 Đã thêm thư viện xử lý Excel chuẩn bài

ChartJS.register(ArcElement, Tooltip, Legend, Filler);

export default function Reports() {
  // Lấy ngày đầu tháng và ngày cuối tháng hiện tại tự động
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: "0đ",
      totalExpense: "0đ",
      netSavings: "0đ",
      topExpenseCategory: "Chưa có dữ liệu",
    },
    chart: { labels: [], data: [] },
  });

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/dashboard/reports-data?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Dữ liệu trả về thực tế:", res.data);

      if (res.data && res.data.summary) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Lỗi fetch dữ liệu báo cáo:", err);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const pieChartConfig = {
    labels: reportData.chart.labels || [],
    datasets: [
      {
        label: "Số tiền chi (VND)",
        data: reportData.chart.data || [],
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#f59e0b",
          "#10b981",
          "#3b82f6",
          "#6366f1",
          "#a855f7",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 🔥 THỰC THI LOGIC XUẤT FILE EXCEL TỪ DỮ LIỆU THẬT
  const handleExportExcel = () => {
    try {
      if (!reportData || !reportData.summary) {
        alert("Chưa có dữ liệu hiển thị để xuất báo cáo!");
        return;
      }

      // 1. Khởi tạo cấu trúc các dòng dữ liệu tổng quan
      const excelRows = [
        {
          "Hạng mục báo cáo": "Khoảng thời gian thống kê",
          "Số tiền / Giá trị hiển thị": `${startDate} đến ${endDate}`,
        },
        {
          "Hạng mục báo cáo": "Tổng thu nhận được",
          "Số tiền / Giá trị hiển thị": reportData.summary.totalIncome,
        },
        {
          "Hạng mục báo cáo": "Tổng chi tiêu",
          "Số tiền / Giá trị hiển thị": reportData.summary.totalExpense,
        },
        {
          "Hạng mục báo cáo": "Tiền tích lũy (Số dư)",
          "Số tiền / Giá trị hiển thị": reportData.summary.netSavings,
        },
        {
          "Hạng mục báo cáo": "Chi tiêu nhiều nhất vào",
          "Số tiền / Giá trị hiển thị": reportData.summary.topExpenseCategory,
        },
        {}, // Tạo một dòng trống để phân cách
        {
          "Hạng mục báo cáo": "DANH SÁCH CHI TIẾT TỪNG DANH MỤC CHI TIÊU",
          "Số tiền / Giá trị hiển thị": "",
        },
      ];

      // 2. Vòng lặp lấy chi tiết dữ liệu từ chart gắn tiếp vào file Excel
      if (reportData.chart && reportData.chart.labels) {
        reportData.chart.labels.forEach((label, index) => {
          const val = reportData.chart.data[index];
          excelRows.push({
            "Hạng mục báo cáo": `• Phân loại: ${label}`,
            "Số tiền / Giá trị hiển thị": val.toLocaleString("vi-VN") + "đ",
          });
        });
      }

      // 3. Tiến hành đóng gói và tạo Worksheet bằng SheetJS
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo Cáo Chi Tiết");

      // 4. Cân chỉnh tự động độ rộng của các hàng cột Excel tránh lỗi hiển thị khuất chữ
      worksheet["!cols"] = [{ wch: 45 }, { wch: 30 }];

      // 5. Kích hoạt trình duyệt tải tệp tin về máy
      XLSX.writeFile(
        workbook,
        `Bao_Cao_Tai_Chinh_${startDate}_den_${endDate}.xlsx`
      );
    } catch (error) {
      console.error("Gặp lỗi trong quá trình xuất Excel:", error);
      alert("Hệ thống không thể xử lý xuất tập tin ngay bây giờ!");
    }
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

  return (
    <div style={styles.container}>
      {/* 1. TIÊU ĐỀ & NÚT XUẤT FILE */}
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>📊 Báo Cáo Tài Chính Chi Tiết</h2>
        <button onClick={handleExportExcel} style={styles.exportBtn}>
          📥 Xuất Báo Cáo (Excel)
        </button>
      </div>

      {/* 2. BỘ LỌC THỜI GIAN */}
      <div style={styles.filterCard}>
        <span style={{ fontWeight: "600", color: "#4b5563" }}>
          Khoảng thời gian:{" "}
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={styles.dateInput}
        />
        <span style={{ color: "#9ca3af" }}>đến</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={styles.dateInput}
        />
        <button onClick={fetchReportData} style={styles.filterBtn}>
          Xem báo cáo
        </button>
      </div>

      {/* 3. CÁC THẺ TỔNG HỢP DỮ LIỆU THẬT */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "5px solid #22c55e" }}>
          <p style={styles.cardLabel}>Tổng thu nhận được</p>
          <h3 style={{ ...styles.cardValue, color: "#22c55e" }}>
            {reportData.summary?.totalIncome || "0đ"}
          </h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "5px solid #ef4444" }}>
          <p style={styles.cardLabel}>Tổng chi tiêu</p>
          <h3 style={{ ...styles.cardValue, color: "#ef4444" }}>
            {reportData.summary?.totalExpense || "0đ"}
          </h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "5px solid #3b82f6" }}>
          <p style={styles.cardLabel}>Tiền tích lũy (Số dư)</p>
          <h3 style={{ ...styles.cardValue, color: "#3b82f6" }}>
            {reportData.summary?.netSavings || "0đ"}
          </h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "5px solid #a855f7" }}>
          <p style={styles.cardLabel}>Chi nhiều nhất vào</p>
          <h3
            style={{ ...styles.cardValue, color: "#a855f7", fontSize: "18px" }}
          >
            {reportData.summary?.topExpenseCategory || "Chưa có dữ liệu"}
          </h3>
        </div>
      </div>

      {/* 4. KHU VỰC ĐỒ THỊ BIỂU ĐỒ TRÒN THẬT */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h4 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>
            📈 Phân tích tỷ trọng chi tiêu từng danh mục
          </h4>
          <div style={styles.chartHolder}>
            {reportData.chart?.labels?.length > 0 ? (
              <Doughnut
                data={pieChartConfig}
                options={otherChartOptions}
              />
            ) : (
              <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
                Không có dữ liệu chi tiêu trong khoảng thời gian này.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Giữ nguyên phần styles cũ của ní...
const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f8fafc",
    minHeight: "calc(100vh - 64px)",
    fontFamily: "sans-serif",
    textAlign: "left",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#1e293b",
    fontWeight: "700",
  },
  exportBtn: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  filterCard: {
    backgroundColor: "#fff",
    padding: "16px 24px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    marginBottom: "25px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dateInput: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontSize: "14px",
  },
  filterBtn: {
    padding: "9px 20px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    marginLeft: "10px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },
  statCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    margin: "0 0 6px 0",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
  },
  cardValue: { margin: 0, fontSize: "24px", fontWeight: "700" },
  chartsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
  chartCard: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  chartHolder: {
    height: "320px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
