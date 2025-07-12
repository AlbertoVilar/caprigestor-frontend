import { Outlet } from "react-router-dom";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../footer-compoent/Footer";
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        <HeaderTopbar />

        {/* Conteúdo da rota atual */}
        <Outlet />

        <Footer />

        {/* Toasts visuais */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
