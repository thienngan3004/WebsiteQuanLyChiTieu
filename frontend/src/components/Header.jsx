import { Bell, UserCircle } from "lucide-react";
import React from "react";

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>💰 Finance</div>

      <nav style={styles.nav}>
        <a href="/dashboard" style={styles.link}>
          Dashboard
        </a>
        <a href="/transactions" style={styles.link}>
          Transactions
        </a>
        <a href="#">Reports</a>
      </nav>

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
  },

  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
  },

  nav: {
    display: "flex",
    gap: 35,
    fontWeight: "600",
  },

  link: {
    textDecoration: "none",
    color: "#374151",
  },

  right: {
    display: "flex",
    alignItems: "center",
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
