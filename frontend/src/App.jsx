import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Chuyển hướng mặc định */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Không dùng Layout (Trang độc lập) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Các trang nằm bên trong khung Layout chung (Có Header, Footer) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
        </Route>

        {/* Route không tồn tại */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;