// src/routers/Root/root.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../Components/footer-compoent/Footer";
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../../index.css";

export default function Root() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // se quiser esconder o header só nos eventos:
  // const hideHeader = /^\/cabras\/[^/]+\/eventos(?:\/|$)/.test(pathname);
  const hideHeader =
    pathname === "/cabras" ||
    /^\/cabras\/[^/]+\/eventos(?:\/|$)/.test(pathname);

  return (
    <div className="app-container">
      <SidebarClient 
        isCollapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="content">
          {!hideHeader && <HeaderTopbar />}
          
          <Outlet />
        </div>
        
        <Footer />
        
        <ToastContainer position="top-right" autoClose={3000} />
      </main>
    </div>
  );
}
