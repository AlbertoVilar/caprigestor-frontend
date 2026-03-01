import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import { getGoatFarmById, getFarmPermissions } from "../../api/GoatFarmAPI/goatFarm";

import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import GoatEventModal from "../../Components/goat-event-form/GoatEventModal";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";

import { getGenealogy } from "../../api/GenealogyAPI/genealogy";
import {
  fetchGoatById,
  fetchGoatByRegistrationNumber,
  findGoatsByFarmAndName,
} from "../../api/GoatAPI/goat";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildFarmDashboardPath,
  buildFarmGoatsPath,
} from "../../utils/appRoutes";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { farmId: routeFarmIdParam, goatId: routeGoatId } =
    useParams<{ farmId: string; goatId: string }>();
  const routeFarmId = routeFarmIdParam ? Number(routeFarmIdParam) : undefined;
  const initialGoat = (location.state?.goat as GoatResponseDTO | null) ?? null;

  const [goat, setGoat] = useState<GoatResponseDTO | null>(initialGoat);
  const { tokenPayload } = useAuth();
  const permissions = usePermissions();
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [farmOwnerId, setFarmOwnerId] = useState<number | undefined>(
    (location.state?.farmOwnerId as number | undefined) ?? initialGoat?.ownerId ?? initialGoat?.userId
  );
  const [resolvedFarmId, setResolvedFarmId] = useState<number | undefined>(
    routeFarmId ??
      ((location.state?.farmId as number | undefined) ??
        (searchParams.get("farmId") ? Number(searchParams.get("farmId")) : undefined) ??
        initialGoat?.farmId)
  );

  const [canAccessFarmModules, setCanAccessFarmModules] = useState(false);

  const [searchResults, setSearchResults] = useState<GoatResponseDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [genealogyData, setGenealogyData] = useState<GoatGenealogyDTO | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    if (!location.state?.goat) {
      return;
    }

    setGoat(location.state.goat as GoatResponseDTO);
    setResolvedFarmId(
      routeFarmId ??
        ((location.state.farmId as number | undefined) ?? (location.state.goat as GoatResponseDTO).farmId)
    );
    setFarmOwnerId(
      (location.state.farmOwnerId as number | undefined) ??
        (location.state.goat as GoatResponseDTO).ownerId ??
        (location.state.goat as GoatResponseDTO).userId
    );
    setIsSearching(false);
    setSearchResults([]);
  }, [location.state, routeFarmId]);

  useEffect(() => {
    if (routeFarmId && resolvedFarmId !== routeFarmId) {
      setResolvedFarmId(routeFarmId);
    }
  }, [routeFarmId, resolvedFarmId]);

  useEffect(() => {
    if (!routeGoatId || !routeFarmId) {
      return;
    }

    const matchesCurrentGoat =
      goat != null &&
      goat.farmId === routeFarmId &&
      ((goat.id != null && String(goat.id) === routeGoatId) ||
        goat.registrationNumber === routeGoatId);

    if (matchesCurrentGoat) {
      return;
    }

    let cancelled = false;

    const loadGoatFromRoute = async () => {
      try {
        let goatData: GoatResponseDTO;

        if (/^\d+$/.test(routeGoatId)) {
          try {
            goatData = await fetchGoatById(routeFarmId, routeGoatId);
          } catch (error) {
            console.warn("Detalhe do animal: fallback para registro apos falha por ID", error);
            goatData = await fetchGoatByRegistrationNumber(routeGoatId);
          }
        } else {
          goatData = await fetchGoatByRegistrationNumber(routeGoatId);
        }

        if (cancelled) {
          return;
        }

        setGoat(goatData);
        if (goatData.farmId) {
          setResolvedFarmId(Number(goatData.farmId));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Detalhe do animal: erro ao carregar animal pela rota", error);
        }
      }
    };

    void loadGoatFromRoute();

    return () => {
      cancelled = true;
    };
  }, [goat, routeFarmId, routeGoatId]);

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

    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const fullData = await fetchGoatByRegistrationNumber(goat.registrationNumber);
        if (!cancelled) {
          setGoat((prev) => (prev ? { ...prev, ...fullData } : fullData));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Detalhe do animal: erro ao completar dados da cabra", error);
        }
      }
    };

    void fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [goat?.registrationNumber, goat?.id, goat?.farmId, resolvedFarmId]);

  useEffect(() => {
    if (!resolvedFarmId) {
      setFarmData(null);
      return;
    }

    let cancelled = false;

    const loadFarm = async () => {
      try {
        const farm = await getGoatFarmById(Number(resolvedFarmId));
        if (cancelled) {
          return;
        }

        setFarmData(farm);
        if (farm?.userId != null) {
          setFarmOwnerId(Number(farm.userId));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Detalhe do animal: erro ao carregar dados da fazenda", error);
        }
      }
    };

    void loadFarm();

    return () => {
      cancelled = true;
    };
  }, [resolvedFarmId]);

  useEffect(() => {
    const resolveFarmAccess = async () => {
      if (!resolvedFarmId || !tokenPayload?.userId) {
        setCanAccessFarmModules(false);
        return;
      }

      try {
        if (permissions.isAdmin()) {
          setCanAccessFarmModules(true);
          return;
        }

        const perms = await getFarmPermissions(Number(resolvedFarmId));
        setCanAccessFarmModules(Boolean(perms?.canCreateGoat));
      } catch (error) {
        console.error("Detalhe do animal: falha ao resolver permissao da fazenda", error);
        setCanAccessFarmModules(false);
      }
    };

    void resolveFarmAccess();
  }, [resolvedFarmId, tokenPayload?.userId, permissions]);

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
      console.warn("Detalhe do animal: farmId nao resolvido para busca.");
      return;
    }

    try {
      const results = await findGoatsByFarmAndName(resolvedFarmId, trimmedTerm);
      setSearchResults(results);
      setIsSearching(true);
    } catch (error) {
      console.error("Erro na busca:", error);
      setSearchResults([]);
    }
  }

  const farmDashboardPath = resolvedFarmId
    ? buildFarmDashboardPath(resolvedFarmId)
    : "/goatfarms";
  const farmGoatsPath = resolvedFarmId ? buildFarmGoatsPath(resolvedFarmId) : "/goatfarms";
  const breadcrumbItems = [
    { label: "Fazendas", to: "/goatfarms" },
    ...(resolvedFarmId
      ? [
          { label: farmData?.name || goat?.farmName || "Fazenda", to: farmDashboardPath },
          { label: "Cabras", to: farmGoatsPath },
        ]
      : []),
    { label: goat?.name || "Detalhe do animal" },
  ];
  const heroTitle = goat?.name || "Detalhe do animal";
  const heroDescription = goat
    ? `Registro ${goat.registrationNumber} • ${goat.breed} • ${
        goat.farmName || farmData?.name || "Fazenda"
      }`
    : "Selecione um animal para visualizar histórico, manejo e ações individuais.";
  const canShowFarmShortcut = Boolean(resolvedFarmId);

  if (import.meta.env.DEV) {
    console.log("Animal detail render:", {
      routeFarmId,
      routeGoatId,
      registration: goat?.registrationNumber,
      goatId: goat?.id,
      farmId: goat?.farmId,
      gender: goat?.gender,
    });
  }

  return (
    <div className="content-in animal-context-page">
      <ContextBreadcrumb items={breadcrumbItems} />

      <section className="animal-context-hero" aria-label="Contexto do animal">
        <div>
          <span className="animal-context-hero__eyebrow">Gerir o Animal</span>
          <h1 className="animal-context-hero__title">{heroTitle}</h1>
          <p className="animal-context-hero__description">{heroDescription}</p>
        </div>

        {canShowFarmShortcut && (
          <Link to={farmDashboardPath} className="animal-context-hero__cta">
            Gerenciar Fazenda
          </Link>
        )}
      </section>

      <SearchInputBox
        onSearch={handleSearch}
        placeholder="🔍 Buscar outro animal desta fazenda..."
      />

      {isSearching ? (
        <div className="search-results-wrapper" style={{ marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3>Resultados da busca ({searchResults.length})</h3>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchResults([]);
              }}
              className="btn-secondary"
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
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
                farmId={resolvedFarmId ?? goat.farmId}
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
              <h3>Nenhum animal selecionado</h3>
              <p>
                Use a busca acima ou abra um animal pela lista do rebanho para entrar
                no detalhe individual.
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
