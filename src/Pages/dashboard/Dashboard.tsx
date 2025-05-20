import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInput from "../../Components/searchs/SearchInput";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../footer-compoent/Footer";

import "./animalDashboard.css";

export default function AnimalDashboard() {
  return (
    <div className="container">
      <SidebarClient />
      <div className="content">
        <PageHeader title="Detalhes da Cabra" />

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
