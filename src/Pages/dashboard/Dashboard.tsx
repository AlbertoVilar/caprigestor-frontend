// src/Pages/dashboard/AnimalDashboard.tsx
import { useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import { getGoatFarmById, getFarmPermissions } from "../../api/GoatFarmAPI/goatFarm";

import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import GoatEventModal from "../../Components/goat-event-form/GoatEventModal";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";

import { getGenealogy } from "../../api/GenealogyAPI/genealogy";
import {
  fetchGoatByRegistrationNumber,
  findGoatsByFarmAndName
} from "../../api/GoatAPI/goat";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(
    (location.state?.goat as GoatResponseDTO | null) ?? null
  );
  const { tokenPayload } = useAuth();
  const permissions = usePermissions();
  const [farmOwnerId, setFarmOwnerId] = useState<number | undefined>(
    location.state?.farmOwnerId as number | undefined
  );
  const [resolvedFarmId, setResolvedFarmId] = useState<number | undefined>(
    (location.state?.farmId as number | undefined) ??
      (searchParams.get("farmId") ? Number(searchParams.get("farmId")) : undefined) ??
      goat?.farmId
  );

  const [canAccessFarmModules, setCanAccessFarmModules] = useState(false);

  // Search State
  const [searchResults, setSearchResults] = useState<GoatResponseDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [genealogyData, setGenealogyData] = useState<GoatGenealogyDTO | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // Sync state with location updates (when clicking a result card)
  useEffect(() => {
    if (location.state?.goat) {
      setGoat(location.state.goat);
      setResolvedFarmId(location.state.farmId);
      setFarmOwnerId(location.state.farmOwnerId);
      
      // Reset search state
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [location.state]);

  useEffect(() => {
    if (goat?.farmId && !resolvedFarmId) {
      setResolvedFarmId(Number(goat.farmId));
    }
  }, [goat?.farmId, resolvedFarmId]);

  useEffect(() => {
    if (!goat?.registrationNumber || !resolvedFarmId) {
      return;
    }
    if (goat.id && goat.farmId) {
      return;
    }
    const fetchDetails = async () => {
      try {
        const fullData = await fetchGoatByRegistrationNumber(
          goat.registrationNumber
        );
        setGoat((prev) => (prev ? { ...prev, ...fullData } : fullData));
      } catch (err) {
        console.error("Dashboard: Erro ao carregar detalhes da cabra:", err);
      }
    };
    fetchDetails();
  }, [goat?.registrationNumber, goat?.id, goat?.farmId, resolvedFarmId]);



  



  useEffect(() => {
    const resolveFarmAccess = async () => {
      if (!resolvedFarmId || !tokenPayload?.userId) {
        setCanAccessFarmModules(false);
        return;
      }
      try {
        const farm = await getGoatFarmById(Number(resolvedFarmId));
        const ownerId = farm?.userId;
        if (ownerId != null) {
          setFarmOwnerId(Number(ownerId));
        }
        if (permissions.isAdmin()) {
          setCanAccessFarmModules(true);
          return;
        }
        const perms = await getFarmPermissions(Number(resolvedFarmId));
        setCanAccessFarmModules(Boolean(perms?.canCreateGoat));
      } catch (error) {
        console.error("Dashboard: falha ao resolver permissao da fazenda", error);
        setCanAccessFarmModules(false);
      }
    };
    resolveFarmAccess();
  }, [resolvedFarmId, tokenPayload?.userId, permissions]);

  // Debug em dev
  if (import.meta.env.DEV) {
    console.log("Dashboard Render: ", { 
      registration: goat?.registrationNumber, 
      id: goat?.id, 
      farmId: goat?.farmId, 
      gender: goat?.gender
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

  async function handleSearch(term: string) {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    if (!resolvedFarmId) {
        console.warn("Dashboard: farmId não resolvido para busca.");
        return;
    }

    try {
      const results = await findGoatsByFarmAndName(resolvedFarmId, trimmedTerm);
      setSearchResults(results);
      setIsSearching(true);
    } catch (err) {
      console.error("Erro na busca:", err);
      setSearchResults([]);
    }
  }

  return (
    <div className="content-in">
      <SearchInputBox onSearch={handleSearch} placeholder="🔍 Buscar animal na dashboard..." />

      {isSearching ? (
         <div className="search-results-wrapper" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Resultados da busca ({searchResults.length})</h3>
                <button 
                    onClick={() => { setIsSearching(false); setSearchResults([]); }}
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <i className="fa-solid fa-xmark"></i> Fechar
                </button>
            </div>
            
            <GoatCardList
                goats={searchResults}
                onEdit={() => {}} 
                farmOwnerId={farmOwnerId}
            />
         </div>
      ) : (
        <>
            {goat ? (
                <div className="goat-panel">
                <div className="goat-info-card">
                    <GoatInfoCard goat={goat} />
                </div>

                <GoatActionPanel
                    registrationNumber={goat.registrationNumber}
                    resourceOwnerId={goat.ownerId ?? goat.userId ?? farmOwnerId}
                    canAccessModules={canAccessFarmModules}
                    onShowGenealogy={showGenealogy}
                    onShowEventForm={handleShowEventForm}
                    // novo: passar farmId para navegação de eventos
                    farmId={goat.farmId}
                    goatId={goat.id}
                    gender={goat.gender}
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

            {genealogyData && (
                <div className="goat-genealogy-wrapper">
                <h3>🧬 Árvore Genealógica</h3>
                <GoatGenealogyTree data={genealogyData} />
                </div>
            )}
        </>
      )}
    </div>
  );
}
