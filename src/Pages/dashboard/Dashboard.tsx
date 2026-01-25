// src/Pages/dashboard/AnimalDashboard.tsx
import { useLocation } from "react-router-dom";
import { useState } from "react";

import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import GoatEventModal from "../../Components/goat-event-form/GoatEventModal";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import LactationManager from "../../Components/lactation/LactationManager";

import { getGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const location = useLocation();
  const goat = (location.state?.goat as GoatResponseDTO | null) ?? null;
  const farmOwnerId = location.state?.farmOwnerId as number | undefined;

  const [genealogyData, setGenealogyData] = useState<GoatGenealogyDTO | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showLactation, setShowLactation] = useState(false);

  const isFemale = goat?.gender === 'Fêmea' || goat?.gender === 'F' || goat?.gender === 'FEMALE';

  const showGenealogy = () => {
    if (goat?.registrationNumber && goat?.farmId != null) {
      getGenealogy(Number(goat.farmId), goat.registrationNumber)
        .then(setGenealogyData)
        .catch((error) => {
          console.error("Erro ao buscar genealogia:", error);
        });
    }
  };

  const handleShowEventForm = () => setShowEventForm(true);

  return (
    <div className="content-in">
      <SearchInputBox onSearch={() => {}} />

      {goat ? (
        <div className="goat-panel">
          <div className="goat-info-card">
            <GoatInfoCard goat={goat} />
          </div>

          <GoatActionPanel
            registrationNumber={goat.registrationNumber}
            resourceOwnerId={goat.userId}
            onShowGenealogy={showGenealogy}
            onShowEventForm={handleShowEventForm}
            // novo: passar farmId para navegação de eventos
            farmId={goat.farmId}
            isFemale={isFemale}
            onShowLactation={() => setShowLactation(!showLactation)}
          />

          {showEventForm && (
            <GoatEventModal
              goatId={goat.registrationNumber}
              farmId={Number(goat.farmId)}
              onClose={() => setShowEventForm(false)}
              onEventCreated={() => setShowEventForm(false)}
            />
          )}
        </div>
      ) : (
        <div className="empty-dashboard">
          <h3>Nenhuma cabra selecionada</h3>
          <p>
            Use a barra de busca acima ou clique em "Detalhes" de alguma cabra
            para visualizar suas informações.
          </p>
          <div className="goat-placeholder">🐐</div>
        </div>
      )}

      {goat && showLactation && goat.id && (
        <div className="goat-lactation-wrapper" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <LactationManager 
            farmId={Number(goat.farmId)}
            goatId={goat.id}
            goatName={goat.name || goat.registrationNumber}
          />
        </div>
      )}

      {genealogyData && (
        <div className="goat-genealogy-wrapper">
          <h3>🧬 Árvore Genealógica</h3>
          <GoatGenealogyTree data={genealogyData} />
        </div>
      )}
    </div>
  );
}
