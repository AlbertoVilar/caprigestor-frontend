import { Outlet } from "react-router-dom";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../footer-compoent/Footer";

import "../../index.css"; 
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";


export default function Root() {
  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        <HeaderTopbar />
        
        {/* Aqui o conteúdo da página atual será injetado */}
        <Outlet />

        <Footer />
      </div>
    </div>
  );
}
