import React, { useState, useEffect, useRef } from "react";

export default function Header() {
  // Lấy đường dẫn hiện tại để tô màu tab điều hướng
  const currentPath = window.location.pathname;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // State lưu thông tin user
  const [user, setUser] = useState({
    name: "Người dùng",
    email: "",
    avatar: "" 
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser({
          name: parsedUser.name || "Người dùng",
          email: parsedUser.email || "",
          avatar: parsedUser.picture || parsedUser.avatarUrl || parsedUser.avatar || ""
        });
      } catch (e) {
        console.error("Lỗi lấy thông tin user:", e);
      }
    }
  }, []);

  // Chữ cái đầu tiên đại diện nếu không có ảnh
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : "U";

  // Hàm chuyển trang an toàn sử dụng cơ chế sẵn có của ní, không lo mất State
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    const navEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navEvent);
    setShowMenu(false);
  };

  // Click ra ngoài tự đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch bộ nhớ tạm
    window.location.href = "/login"; 
  };

  return (
    <header style={styles.header}>
      {/* CỤM TRÁI: LOGO */}
      <div style={styles.logo}>💰 QL Chi Tiêu</div>

      {/* 🌟 CỤM GIỮA: TRẢ LẠI MENU NAV ĐỂ KHÔNG BỊ TRỐNG TRANG */}
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

      {/* CỤM PHẢI: HIỂN THỊ AVATAR & TÊN ĐỘNG */}
      <div style={styles.right} ref={menuRef}>        
        <div 
          onClick={() => setShowMenu(!showMenu)} 
          style={styles.avatarWrapper}
          title={user.name}
        >
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt="Avatar" 
              style={styles.avatarImg} 
              onError={(e) => {
                e.target.style.display = 'none';
                setUser(prev => ({ ...prev, avatar: "" }));
              }}
            />
          ) : (
            <span style={styles.avatarText}>{avatarLetter}</span>
          )}
        </div>

        {/* DROP DOWN MENU */}
        {showMenu && (
          <div style={styles.dropdown}>
            <div style={styles.menuHeader}>
              <div style={styles.menuAvatarMini}>
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={styles.avatarImg} />
                ) : (
                  avatarLetter
                )}
              </div>
              <div>
                <div style={styles.profileName}>{user.name}</div>
                <div style={styles.profileRole}>{user.email || "Thành viên"}</div>
              </div>
            </div>
            
            <hr style={styles.divider} />
            
            <button onClick={handleLogout} style={styles.logoutBtn}>
            Đăng xuất
            </button>
          </div>
        )}
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
    gap: 12,
    position: "relative",
  },
  welcomeText: {
    fontSize: "14px",
    color: "#475569",
    fontFamily: "sans-serif",
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
    userSelect: "none",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
  },
  dropdown: {
    position: "absolute",
    top: "52px",
    right: 0,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "1px solid #f1f5f9",
    width: "250px",
    padding: "8px 0",
    display: "flex",
    flexDirection: "column",
  },
  menuHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
  },
  menuAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    overflow: "hidden"
  },
  profileName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
  },
  profileRole: {
    fontSize: "12px",
    color: "#64748b",
    wordBreak: "break-all"
  },
  divider: {
    border: 0,
    borderTop: "1px solid #f1f5f9",
    margin: "6px 0",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#dc2626",
    cursor: "pointer",
    width: "100%",
    fontFamily: "sans-serif",
    transition: "background 0.2s ease",
  },
};