// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// export default function Login() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/auth/login",
//         formData
//       );
//       if (response.status === 200) {
//         // Lưu token và thông tin user thật vào trình duyệt
//         localStorage.setItem("token", response.data.token);
//         localStorage.setItem("userId", response.data.user.id);
//         localStorage.setItem("userName", response.data.user.name);

//         alert(`Chào mừng ${response.data.user.name} đã đăng nhập thành công!`);
//         navigate("/dashboard"); // Đăng nhập xong nhảy thẳng vào trang quản lý
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Email hoặc mật khẩu sai!");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <h2 style={styles.title}>Đăng Nhập Hệ Thống</h2>
//         {error && <p style={styles.error}>{error}</p>}
//         <form onSubmit={handleLogin} style={styles.form}>
//           <input
//             type="email"
//             placeholder="Nhập Email"
//             required
//             value={formData.email}
//             onChange={(e) =>
//               setFormData({ ...formData, email: e.target.value })
//             }
//             style={styles.input}
//           />
//           <input
//             type="password"
//             placeholder="Nhập Mật khẩu"
//             required
//             value={formData.password}
//             onChange={(e) =>
//               setFormData({ ...formData, password: e.target.value })
//             }
//             style={styles.input}
//           />
//           <button type="submit" style={styles.button}>
//             Đăng Nhập
//           </button>
//         </form>
//         <p style={styles.text}>
//           Chưa có tài khoản?{" "}
//           <span onClick={() => navigate("/register")} style={styles.link}>
//             Đăng ký ngay
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
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userName", response.data.user.name);

        alert(`Chào mừng ${response.data.user.name} đã đăng nhập thành công!`);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Email hoặc mật khẩu sai!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* BÊN TRÁI: Hình ảnh minh họa cực nghệ */}
        <div style={styles.imageSection}>
          <div style={styles.overlay}>
            <h2 style={styles.welcomeText}>Chào Mừng Trở Lại!</h2>
            <p style={styles.subWelcomeText}>
              Quản lý hệ thống của bạn một cách thông minh và tối ưu nhất.
            </p>
          </div>
        </div>

        {/* BÊN PHẢI: Form đăng nhập */}
        <div style={styles.formSection}>
          <div style={styles.formCard}>
            <h2 style={styles.title}>Đăng Nhập Hệ Thống</h2>
            <p style={styles.subtitle}>Vui lòng điền thông tin tài khoản của bạn</p>
            
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mật khẩu</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  style={styles.input}
                />
              </div>

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

      </div>
    </div>
  );
}

// BỘ STYLES MỚI - HIỆN ĐẠI, RESPONSIVE, CÓ ẢNH NỀN
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "20px",
  },
  wrapper: {
    display: "flex",
    width: "100%",
    maxWidth: "960px",
    minHeight: "560px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    overflow: "hidden", // Để bo góc luôn phần ảnh nền
  },
  // Phần hình ảnh bên trái (Sẽ ẩn trên màn hình điện thoại nếu làm CSS thuần, ở đây tối ưu trung bình)
  imageSection: {
    flex: 1,
    backgroundImage: "url('https://picsum.photos/id/180/800/1000')", // Ảnh thiên nhiên/công nghệ ngẫu nhiên rất đẹp
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(to bottom, rgba(37, 99, 235, 0.3), rgba(15, 23, 42, 0.85))",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  welcomeText: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  subWelcomeText: {
    color: "#e2e8f0",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  // Phần Form bên phải
  formSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  formCard: {
    width: "100%",
    maxWidth: "360px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#f8fafc",
  },
  button: {
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: "10px",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    border: "1px solid #fee2e2",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "left",
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
    textDecoration: "underline",
  },
};