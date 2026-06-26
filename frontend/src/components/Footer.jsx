import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div>© 2026 Finance Dashboard</div>

      <div style={styles.right}>
        <span>Version 1.0</span>

        <span>Made by Tina</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    height: 55,

    background: "#fff",

    borderTop: "1px solid #e5e7eb",

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    padding: "0 35px",

    color: "#6b7280",

    fontSize: 14,
  },

  right: {
    display: "flex",
    gap: 25,
  },
};
