// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function Register() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/auth/register",
//         formData
//       );
//       if (response.status === 201) {
//         alert(
//           "Đăng ký tài khoản thật thành công! Chuyển hướng sang trang Đăng nhập."
//         );
//         navigate("/login"); // Đăng ký xong tự chuyển sang trang login
//       }
//     } catch (err) {
//       setError(
//         err.response?.data?.error || "Đăng ký thất bại, thử lại xem sao ní!"
//       );
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <h2 style={styles.title}>Đăng Ký Tài Khoản</h2>
//         {error && <p style={styles.error}>{error}</p>}
//         <form onSubmit={handleRegister} style={styles.form}>
//           <input
//             type="text"
//             placeholder="Họ và tên"
//             required
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             style={styles.input}
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             required
//             value={formData.email}
//             onChange={(e) =>
//               setFormData({ ...formData, email: e.target.value })
//             }
//             style={styles.input}
//           />
//           <input
//             type="password"
//             placeholder="Mật khẩu"
//             required
//             value={formData.password}
//             onChange={(e) =>
//               setFormData({ ...formData, password: e.target.value })
//             }
//             style={styles.input}
//           />
//           <button type="submit" style={styles.button}>
//             Đăng Ký
//           </button>
//         </form>
//         <p style={styles.text}>
//           Đã có tài khoản?{" "}
//           <span onClick={() => navigate("/login")} style={styles.link}>
//             Đăng nhập
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     height: "100vh",
//     background: "#f5f7fb",
//   },
//   card: {
//     background: "#fff",
//     padding: "40px",
//     borderRadius: "8px",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
//     width: "100%",
//     maxWidth: "400px",
//     textALign: "center",
//   },
//   title: { marginBottom: "20px", color: "#1e293b", textAlign: "center" },
//   form: { display: "flex", flexDirection: "column", gap: "15px" },
//   input: {
//     padding: "12px",
//     borderRadius: "4px",
//     border: "1px solid #cbd5e1",
//     fontSize: "14px",
//   },
//   button: {
//     padding: "12px",
//     backgroundColor: "#2563eb",
//     color: "#fff",
//     border: "none",
//     borderRadius: "4px",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
//   error: {
//     color: "#ef4444",
//     backgroundColor: "#fef2f2",
//     padding: "10px",
//     borderRadius: "4px",
//     fontSize: "13px",
//     marginBottom: "15px",
//     textAlign: "center",
//   },
//   text: {
//     marginTop: "20px",
//     fontSize: "14px",
//     color: "#64748b",
//     textAlign: "center",
//   },
//   link: { color: "#2563eb", cursor: "pointer", fontWeight: "bold" },
// };


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
          "Đăng ký tài khoản thành công! Chuyển hướng sang trang Đăng nhập."
        );
        navigate("/login");
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
        <h2 style={styles.title}>Tạo Tài Khoản</h2>
        <p style={styles.subtitle}>Bắt đầu hành trình của bạn ngay hôm nay</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Họ và tên</label>
            <input
              type="text"
              placeholder="Nhập họ và tên"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="name@gmail.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <button 
            type="submit" 
            style={styles.button}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
          >
            Đăng Ký
          </button>
        </form>

        <p style={styles.text}>
          Đã có tài khoản?{" "}
          <span 
            onClick={() => navigate("/login")} 
            style={styles.link}
            onMouseEnter={(e) => (e.target.style.color = "#1d4ed8")}
            onMouseLeave={(e) => (e.target.style.color = "#2563eb")}
          >
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
    minHeight: "100vh",
    backgroundColor: "#f8fafc", // Màu nền xám xanh dịu mắt hơn
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    padding: "20px",
  },
  card: {
    background: "#ffffff",
    padding: "40px 32px",
    borderRadius: "16px", // Góc bo tròn hiện đại hơn
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)", // Đổ bóng mịn màng
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
  },
  title: { 
    marginBottom: "8px", 
    color: "#0f172a", 
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    color: "#64748b",
    textAlign: "center",
    fontSize: "14px",
    marginBottom: "24px",
    marginTop: "0px"
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "20px" 
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease-in-out", // Tạo hiệu ứng mượt mà khi focus
    color: "#1e293b",
    backgroundColor: "#f8fafc"
  },
  button: {
    padding: "14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "10px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)"
  },
  error: {
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
    fontWeight: "500"
  },
  text: {
    marginTop: "24px",
    fontSize: "14px",
    color: "#64748b",
    textAlign: "center",
  },
  link: { 
    color: "#2563eb", 
    cursor: "pointer", 
    fontWeight: "600",
    transition: "color 0.2s ease",
    textDecoration: "underline"
  },
};