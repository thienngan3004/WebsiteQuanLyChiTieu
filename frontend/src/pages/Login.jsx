import React from 'react';
import { Link } from 'react-router-dom';

function Login() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Đăng Nhập Hệ Thống</h2>
        <p style={styles.subtitle}>Quản lý tài chính cá nhân tích hợp AI</p>
        
        <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Địa chỉ Email</label>
            <input type="email" placeholder="example@gmail.com" style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input type="password" placeholder="••••••••" style={styles.input} />
          </div>

          <button type="button" style={styles.button}>Đăng Nhập</button>
        </form>

        <p style={styles.footerText}>
          Chưa có tài khoản? <Link to="/register" style={styles.link}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

// CSS-in-JS cơ bản để giao diện nhìn sạch sẽ, dễ nhìn
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { margin: '0 0 10px 0', fontSize: '24px', color: '#1f2937' },
  subtitle: { margin: '0 0 30px 0', fontSize: '14px', color: '#6b7280' },
  form: { textAlign: 'left' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  footerText: { marginTop: '20px', fontSize: '14px', color: '#4b5563' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: '500' }
};

export default Login;