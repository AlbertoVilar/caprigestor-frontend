// src/routers/Root/root.tsx
import { Outlet } from "react-router-dom";
import Navbar from "../../Components/navigation/Navbar";
import Footer from "../../Components/footer-compoent/Footer";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div className="content">
          <Outlet />
        </div>

        <Footer />

        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
}
