// src/routers/Root/root.tsx
import { Outlet, useLocation } from "react-router-dom";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../Components/footer-compoent/Footer";
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  const { pathname } = useLocation();

  // se quiser esconder o header só nos eventos:
  // const hideHeader = /^\/cabras\/[^/]+\/eventos(?:\/|$)/.test(pathname);
  const hideHeader =
    pathname === "/cabras" ||
    /^\/cabras\/[^/]+\/eventos(?:\/|$)/.test(pathname);

  return (
    <div className="container">
      <SidebarClient />
      <div className="content">


        {!hideHeader && <HeaderTopbar />}

        <Outlet />

        <Footer />

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
