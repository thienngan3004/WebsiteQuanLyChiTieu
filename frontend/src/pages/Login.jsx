import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      if (response.status === 200) {
        // Lưu token và thông tin user thật vào trình duyệt
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userName", response.data.user.name);

        alert(`Chào mừng ${response.data.user.name} đã đăng nhập thành công!`);
        navigate("/dashboard"); // Đăng nhập xong nhảy thẳng vào trang quản lý
      }
    } catch (err) {
      setError(err.response?.data?.error || "Email hoặc mật khẩu sai kìa ní!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng Nhập Hệ Thống</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Nhập Email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Nhập Mật khẩu"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Đăng Nhập
          </button>
        </form>
        <p style={styles.text}>
          Chưa có tài khoản?{" "}
          <span onClick={() => navigate("/register")} style={styles.link}>
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}

// Dùng chung bộ styles giống hệt bên Register bên trên cho đẹp đồng bộ luôn ní nhé!
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f5f7fb",
  },
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: { marginBottom: "20px", color: "#1e293b", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "#ef4444",
    backgroundColor: "#fef2f2",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "13px",
    marginBottom: "15px",
    textAlign: "center",
  },
  text: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#64748b",
    textAlign: "center",
  },
  link: { color: "#2563eb", cursor: "pointer", fontWeight: "bold" },
};
