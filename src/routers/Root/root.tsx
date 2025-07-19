import { Outlet, useLocation } from "react-router-dom";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../Components/footer-compoent/Footer";
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  const location = useLocation();

  // Oculta o HeaderTopbar somente na página de lista de cabras e em eventos
  const hideHeader =
    location.pathname === "/cabras" ||
    (location.pathname.includes("/cabras/") && location.pathname.includes("/eventos"));

  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        {!hideHeader && <HeaderTopbar />}

        {/* Conteúdo da rota atual */}
        <Outlet />

        <Footer />

        {/* Toasts visuais */}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
