import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      if (response.status === 201) {
        alert(
          "Đăng ký tài khoản thật thành công! Chuyển hướng sang trang Đăng nhập."
        );
        navigate("/login"); // Đăng ký xong tự chuyển sang trang login
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Đăng ký thất bại, thử lại xem sao ní!"
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng Ký Tài Khoản</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="text"
            placeholder="Họ và tên"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Đăng Ký
          </button>
        </form>
        <p style={styles.text}>
          Đã có tài khoản?{" "}
          <span onClick={() => navigate("/login")} style={styles.link}>
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
}

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
    textALign: "center",
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
