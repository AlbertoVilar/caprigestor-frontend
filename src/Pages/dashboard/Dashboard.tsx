import { useLocation } from "react-router-dom";
import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInputBox from "../../Components/searchs/SearchInputBox";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const location = useLocation();
  const goat = location.state?.goat ?? null;

  return (
    <div className="content-in">
      <PageHeader title="Cabras" />
      <SearchInputBox onSearch={() => {}} />

      {goat ? (
        <div className="goat-panel">
          <div className="goat-info-card">
            <GoatInfoCard goat={goat} />
          </div>
          <div className="goat-action-panel">
            <GoatActionPanel registrationNumber={goat.registrationNumber} />
          </div>
        </div>
      ) : (
        <div className="empty-dashboard">
          <h3>Nenhuma cabra selecionada</h3>
          <p>Use a barra de busca acima ou clique em "Detalhes" de alguma cabra para visualizar suas informações.</p>
          <div className="goat-placeholder">🐐</div>
        </div>
      )}
    </div>
  );
}
