// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Doughnut } from 'react-chartjs-2'; // Dùng biểu đồ tròn khuyết giữa nhìn cho hiện đại
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// ChartJS.register(ArcElement, Tooltip, Legend);

// function Reports() {
//   // Trạng thái lưu ngày bộ lọc (mặc định lấy từ đầu tháng đến cuối tháng hiện tại)
//   const [startDate, setStartDate] = useState("2026-06-01");
//   const [endDate, setEndDate] = useState("2026-06-30");

//   // Trạng thái lưu dữ liệu từ Backend
//   const [reportData, setReportData] = useState({
//     summary: { totalIncome: "0đ", totalExpense: "0đ", netSavings: "0đ", topExpenseCategory: "Đang tải..." },
//     chart: { labels: [], data: [] }
//   });

//   // Hàm gọi API lấy dữ liệu
//   const fetchReportData = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(`http://localhost:5000/api/dashboard/reports-data?startDate=${startDate}&endDate=${endDate}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setReportData(res.data);
//     } catch (err) {
//       console.error("Lỗi fetch dữ liệu báo cáo:", err);
//     }
//   };

//   // Tự động gọi lại hàm khi bấm nút hoặc khi component render lần đầu
//   useEffect(() => {
//     fetchReportData();
//   }, []);

//   // Cấu hình dữ liệu cho biểu đồ tròn tỷ trọng chi tiêu
//   const pieChartConfig = {
//     labels: reportData.chart.labels,
//     datasets: [
//       {
//         label: 'Số tiền chi (VND)',
//         data: reportData.chart.data,
//         backgroundColor: [
//           '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7'
//         ], // Mảng màu sắc sặc sỡ cho từng danh mục
//         borderWidth: 1,
//       },
//     ],
//   };

//   const handleExportExcel = () => {
//     alert("Chức năng xuất file Excel báo cáo thành công!");
//   };

//   return (
//     <div style={styles.container}>
//       {/* 1. TIÊU ĐỀ & NÚT XUẤT FILE */}
//       <div style={styles.headerRow}>
//         <h2 style={styles.pageTitle}>📊 Báo Cáo Tài Chính Chi Tiết</h2>
//         <button onClick={handleExportExcel} style={styles.exportBtn}>
//           📥 Xuất Báo Cáo (Excel)
//         </button>
//       </div>

//       {/* 2. BỘ LỌC THỜI GIAN */}
//       <div style={styles.filterCard}>
//         <span style={{ fontWeight: '500' }}>Khoảng thời gian: </span>
//         <input 
//           type="date" 
//           value={startDate} 
//           onChange={(e) => setStartDate(e.target.value)} 
//           style={styles.dateInput} 
//         />
//         <span style={{ margin: '0 8px' }}>đến</span>
//         <input 
//           type="date" 
//           value={endDate} 
//           onChange={(e) => setEndDate(e.target.value)} 
//           style={styles.dateInput} 
//         />
//         <button onClick={fetchReportData} style={styles.filterBtn}>Xem báo cáo</button>
//       </div>

//       {/* 3. CÁC THẺ TỔNG HỢP DỮ LIỆU THẬT */}
//       <div style={styles.statsGrid}>
//         <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
//           <p style={styles.cardLabel}>Tổng thu nhận được</p>
//           <h3 style={{ ...styles.cardValue, color: '#22c55e' }}>{reportData.summary.totalIncome}</h3>
//         </div>
//         <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
//           <p style={styles.cardLabel}>Tổng chi tiêu</p>
//           <h3 style={{ ...styles.cardValue, color: '#ef4444' }}>{reportData.summary.totalExpense}</h3>
//         </div>
//         <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
//           <p style={styles.cardLabel}>Tiền tích lũy (Số dư)</p>
//           <h3 style={{ ...styles.cardValue, color: '#3b82f6' }}>{reportData.summary.netSavings}</h3>
//         </div>
//         <div style={{ ...styles.statCard, borderLeft: '4px solid #a855f7' }}>
//           <p style={styles.cardLabel}>Chi nhiều nhất vào</p>
//           <h3 style={{ ...styles.cardValue, color: '#a855f7', fontSize: '16px' }}>{reportData.summary.topExpenseCategory}</h3>
//         </div>
//       </div>

//       {/* 4. KHU VỰC ĐỒ THỊ BIỂU ĐỒ TRÒN THẬT */}
//       <div style={styles.chartsGrid}>
//         <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
//           <h4>📈 Phân tích tỷ trọng chi tiêu từng danh mục</h4>
//           <div style={styles.chartHolder}>
//             {reportData.chart.labels.length > 0 ? (
//               <Doughnut 
//                 data={pieChartConfig} 
//                 options={{ responsive: true, maintainAspectRatio: false }} 
//               />
//             ) : (
//               <p style={{ color: '#9ca3af' }}>Không có dữ liệu chi tiêu trong khoảng thời gian này.</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Thêm style này vào đống styles cũ của ní để chứa Chart cho đẹp
// const styles = {
//     container: {
//       padding: '24px',
//       backgroundColor: '#f8fafc',
//       minHeight: 'calc(100vh - 64px)',
//       fontFamily: 'sans-serif',
//       marginTop: '64px', // Để không bị Header che mất
//       textAlign: 'left'
//     },
//     headerRow: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: '20px'
//     },
//     pageTitle: {
//       margin: 0,
//       fontSize: '24px',
//       fontWeight: '700',
//       color: '#1e293b'
//     },
//     exportBtn: {
//       padding: '10px 16px',
//       backgroundColor: '#2563eb',
//       color: '#fff',
//       border: 'none',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       fontWeight: 'bold'
//     },
//     filterCard: {
//       backgroundColor: '#fff',
//       padding: '16px',
//       borderRadius: '8px',
//       boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//       marginBottom: '20px',
//       display: 'flex',
//       alignItems: 'center',
//       gap: '10px' // Ép các ô input và chữ nằm trên 1 hàng ngang
//     },
//     dateInput: {
//       padding: '8px 12px',
//       borderRadius: '6px',
//       border: '1px solid #cbd5e1',
//       outline: 'none'
//     },
//     filterBtn: {
//       padding: '8px 16px',
//       backgroundColor: '#2563eb',
//       color: '#fff',
//       border: 'none',
//       borderRadius: '6px',
//       cursor: 'pointer',
//       fontWeight: '600'
//     },
//     statsGrid: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(4, 1fr)', // CHIA THÀNH 4 CỘT NGANG
//       gap: '16px',
//       marginBottom: '20px'
//     },
//     statCard: {
//       backgroundColor: '#fff',
//       padding: '20px',
//       borderRadius: '8px',
//       boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//       boxSizing: 'border-box'
//     },
//     cardLabel: {
//       margin: '0 0 8px 0',
//       color: '#64748b',
//       fontSize: '14px',
//       fontWeight: '500'
//     },
//     cardValue: {
//       margin: 0,
//       fontSize: '22px',
//       fontWeight: 'bold'
//     },
//     chartsGrid: {
//       display: 'grid',
//       gridTemplateColumns: '1fr',
//       gap: '16px'
//     },
//     chartCard: {
//       backgroundColor: '#fff',
//       padding: '20px',
//       borderRadius: '8px',
//       boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//     },
//     chartHolder: {
//       height: '320px',
//       marginTop: '16px',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center'
//     }
//   };

// export default Reports;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Filler);

export default function Reports() {
  // Lấy ngày đầu tháng và ngày cuối tháng hiện tại tự động
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [reportData, setReportData] = useState({
    summary: { totalIncome: "0đ", totalExpense: "0đ", netSavings: "0đ", topExpenseCategory: "Chưa có dữ liệu" },
    chart: { labels: [], data: [] }
  });

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem("token");
      // Tự động đồng bộ URL theo Port Backend của ní
      const res = await axios.get(`http://localhost:5000/api/dashboard/reports-data?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
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
        label: 'Số tiền chi (VND)',
        data: reportData.chart.data || [],
        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7'],
        borderWidth: 1,
      },
    ],
  };

  const handleExportExcel = () => {
    alert("Tính năng xuất file Excel báo cáo đã sẵn sàng!");
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
        <span style={{ fontWeight: '600', color: '#4b5563' }}>Khoảng thời gian: </span>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
          style={styles.dateInput} 
        />
        <span style={{ color: '#9ca3af' }}>đến</span>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
          style={styles.dateInput} 
        />
        <button onClick={fetchReportData} style={styles.filterBtn}>Xem báo cáo</button>
      </div>

      {/* 3. CÁC THẺ TỔNG HỢP DỮ LIỆU THẬT */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #22c55e' }}>
          <p style={styles.cardLabel}>Tổng thu nhận được</p>
          <h3 style={{ ...styles.cardValue, color: '#22c55e' }}>{reportData.summary?.totalIncome || "0đ"}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #ef4444' }}>
          <p style={styles.cardLabel}>Tổng chi tiêu</p>
          <h3 style={{ ...styles.cardValue, color: '#ef4444' }}>{reportData.summary?.totalExpense || "0đ"}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #3b82f6' }}>
          <p style={styles.cardLabel}>Tiền tích lũy (Số dư)</p>
          <h3 style={{ ...styles.cardValue, color: '#3b82f6' }}>{reportData.summary?.netSavings || "0đ"}</h3>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '5px solid #a855f7' }}>
          <p style={styles.cardLabel}>Chi nhiều nhất vào</p>
          <h3 style={{ ...styles.cardValue, color: '#a855f7', fontSize: '18px' }}>{reportData.summary?.topExpenseCategory || "Chưa có dữ liệu"}</h3>
        </div>
      </div>

      {/* 4. KHU VỰC ĐỒ THỊ BIỂU ĐỒ TRÒN THẬT */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>📈 Phân tích tỷ trọng chi tiêu từng danh mục</h4>
          <div style={styles.chartHolder}>
            {reportData.chart?.labels?.length > 0 ? (
              <Doughnut 
                data={pieChartConfig} 
                options={{ responsive: true, maintainAspectRatio: false }} 
              />
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không có dữ liệu chi tiêu trong khoảng thời gian này.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 64px)',
    fontFamily: 'sans-serif',
    marginTop: '64px', 
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#1e293b',
    fontWeight: '700'
  },
  exportBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  filterCard: {
    backgroundColor: '#fff',
    padding: '16px 24px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dateInput: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    fontSize: '14px'
  },
  filterBtn: {
    padding: '9px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    marginLeft: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)', // Ép chia thành 4 cột ngang đều nhau
    gap: '20px',
    marginBottom: '25px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  },
  cardLabel: {
    margin: '0 0 6px 0',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500'
  },
  cardValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px'
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
  },
  chartHolder: {
    height: '320px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};