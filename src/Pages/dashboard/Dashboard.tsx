import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import SearchInput from "../../Components/searchs/SearchInput";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import HeaderTopbar from "../../Components/Topbar/header-topbar/HeaderTopbar";
import Footer from "../../foot-compoent/Foot";

import "./animalDashboard.css";

export default function AnimalDashboard() {
  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        <HeaderTopbar />

        <div className="goat-header">
          <h2>Cabras</h2>
          <SearchInput />
        </div>

        {/* Painel principal que agrupa o card e os botões */}
        <div className="goat-panel">
          <div className="goat-card">
            <GoatInfoCard />
            <GoatActionPanel />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
