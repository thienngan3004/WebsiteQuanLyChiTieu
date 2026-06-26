import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div style={styles.wrapper}>
      <Header />

      <main style={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f5f7fb",
  },

  main: {
    flex: 1,
    marginTop: "70px", // chiều cao Header
    marginBottom: "60px", // chiều cao Footer
    padding: "25px",
  },
};