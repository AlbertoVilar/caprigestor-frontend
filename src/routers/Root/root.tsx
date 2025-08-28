import { Outlet, useLocation } from "react-router-dom";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../Components/footer-compoent/Footer"; // ok se o diretório se chama assim mesmo
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  const location = useLocation();
  const p = location.pathname;

  // Esconde header:
  // - exatamente em /cabras (com ou sem query)
  // - em /cabras/:registrationNumber/eventos (com / no fim ou não)
  const hideHeader =
    p === "/cabras" ||
    /^\/cabras\/[^/]+\/eventos(?:\/|$)/.test(p);

  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        {!hideHeader && <HeaderTopbar />}

        {/* Conteúdo da rota atual */}
        <Outlet />

        <Footer />

        {/* Toasts visuais (mantenha apenas UM container no app) */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
