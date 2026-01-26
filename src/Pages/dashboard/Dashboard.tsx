// src/Pages/dashboard/AnimalDashboard.tsx
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import GoatEventModal from "../../Components/goat-event-form/GoatEventModal";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import LactationManager from "../../Components/lactation/LactationManager";

import { getGenealogy } from "../../api/GenealogyAPI/genealogy";
import { fetchGoatByRegistrationNumber } from "../../api/GoatAPI/goat";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const location = useLocation();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(
    (location.state?.goat as GoatResponseDTO | null) ?? null
  );
  const farmOwnerId = location.state?.farmOwnerId as number | undefined;

  const [genealogyData, setGenealogyData] = useState<GoatGenealogyDTO | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showLactation, setShowLactation] = useState(false);

  // Se o goat não tiver ID (veio de uma lista incompleta), buscamos os detalhes
  useEffect(() => {
    // Se tiver registrationNumber mas faltar ID ou FarmID, recarrega
    if (goat && (!goat.id || !goat.farmId) && goat.registrationNumber) {
      console.log("Dashboard: Dados incompletos do animal (falta id ou farmId). Buscando detalhes para:", goat.registrationNumber);
      fetchGoatByRegistrationNumber(goat.registrationNumber)
        .then((fullData) => {
          console.log("Dashboard: Detalhes carregados:", fullData);
          setGoat((prev) => prev ? { ...prev, ...fullData } : fullData);
        })
        .catch((err) => {
          console.error("Dashboard: Erro ao carregar detalhes completos da cabra:", err);
        });
    }
  }, [goat?.registrationNumber, goat?.id, goat?.farmId]);

  // Normalização robusta do gênero para exibir botão de lactação
  const genderUpper = goat?.gender ? String(goat.gender).toUpperCase() : '';
  const isFemale = 
    genderUpper.includes('FÊMEA') || 
    genderUpper.includes('FEMEA') || 
    genderUpper === 'F' || 
    genderUpper === 'FEMALE';

  // Debug em dev
  if (import.meta.env.DEV) {
    console.log("Dashboard Render: ", { 
      registration: goat?.registrationNumber, 
      id: goat?.id, 
      farmId: goat?.farmId, 
      gender: goat?.gender, 
      isFemale 
    });
  }

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

      {goat && showLactation && (
        <div className="goat-lactation-wrapper" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {goat.id && goat.farmId ? (
            <LactationManager 
              farmId={Number(goat.farmId)}
              goatId={goat.id}
              goatName={goat.name || goat.registrationNumber}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Carregando dados do animal...
            </div>
          )}
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
