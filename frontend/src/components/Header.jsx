import { Bell } from "lucide-react";
import React from "react";

export default function Header() {
  // Lấy đường dẫn hiện tại để tô màu tab
  const currentPath = window.location.pathname;

  // Hàm chuyển trang an toàn, giữ nguyên State của ứng dụng React
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    // Kích hoạt một sự kiện để React Router nhận biết vừa có sự thay đổi đường dẫn
    const navEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navEvent);
  };

  return (
    <header style={styles.header}>
      {/* CỤM TRÁI: LOGO */}
      <div style={styles.logo}>💰 QL Chi Tiêu</div>

      {/* CỤM GIỮA: NAV MENU (Dùng button để không bị reload trang) */}
      <nav style={styles.nav}>
        <button 
          onClick={() => navigateTo("/dashboard")} 
          style={{ 
            ...styles.link, 
            ...(currentPath === "/dashboard" ? styles.activeLink : {}) 
          }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => navigateTo("/transactions")} 
          style={{ 
            ...styles.link, 
            ...(currentPath === "/transactions" ? styles.activeLink : {}) 
          }}
        >
          Transactions
        </button>
        <button 
          onClick={() => navigateTo("/reports")} 
          style={{ 
            ...styles.link, 
            ...(currentPath === "/reports" ? styles.activeLink : {}) 
          }}
        >
          Reports
        </button>
      </nav>

      {/* CỤM PHẢI: SEARCH & AVATAR */}
      <div style={styles.right}>
        <input type="text" placeholder="Tìm kiếm..." style={styles.search} />
        <button style={styles.icon}>🔔</button>
        <div style={styles.avatar}>H</div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 35px",
    boxShadow: "0 2px 15px rgba(0,0,0,.08)",
    zIndex: 999,
    fontFamily: "sans-serif",
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
  },
  nav: {
    display: "flex",
    gap: 35,
    fontWeight: "600",
  },
  link: {
    background: "none",
    border: "none",
    outline: "none",
    fontFamily: "sans-serif",
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeLink: {
    color: "#2563eb",
    background: "#eff6ff",
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 15,
  },
  search: {
    width: 220,
    padding: "9px 15px",
    borderRadius: 25,
    border: "1px solid #ddd",
    outline: "none",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    cursor: "pointer",
  },
};