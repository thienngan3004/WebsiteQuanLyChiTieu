import React from 'react';
import { Link } from 'react-router-dom';

function Register() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Tạo Tài Khoản Mới</h2>
        <p style={styles.subtitle}>Bắt đầu hành trình quản lý tài chính thông minh</p>
        
        <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Họ và Tên</label>
            <input type="text" placeholder="Nguyễn Văn A" style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Địa chỉ Email</label>
            <input type="email" placeholder="example@gmail.com" style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input type="password" placeholder="Tối thiểu 6 ký tự" style={styles.input} />
          </div>

          <button type="button" style={styles.button}>Đăng Ký</button>
        </form>

        <p style={styles.footerText}>
          Đã có tài khoản? <Link to="/login" style={styles.link}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

// Sử dụng lại toàn bộ bộ style của trang Login để đồng bộ giao diện
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' },
  card: { background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { margin: '0 0 10px 0', fontSize: '24px', color: '#1f2937' },
  subtitle: { margin: '0 0 30px 0', fontSize: '14px', color: '#6b7280' },
  form: { textAlign: 'left' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  footerText: { marginTop: '20px', fontSize: '14px', color: '#4b5563' },
  link: { color: '#10b981', textDecoration: 'none', fontWeight: '500' }
};

export default Register;