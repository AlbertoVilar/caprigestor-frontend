import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import {
  getFarmPermissions,
  getGoatFarmById,
} from "../../api/GoatFarmAPI/goatFarm";

import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import GoatEventModal from "../../Components/goat-event-form/GoatEventModal";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import { Button } from "../../Components/ui/Button";

import {
  exitGoat,
  fetchGoatById,
  findGoatsByFarmAndName,
  type GoatExitRequestDTO,
  type GoatExitType,
} from "../../api/GoatAPI/goat";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildFarmDashboardPath,
  buildFarmGoatsPath,
} from "../../utils/appRoutes";
import { saveLastGoatContext } from "../../utils/lastGoatContext";

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
    (location.state?.farmOwnerId as number | undefined) ??
      initialGoat?.ownerId ??
      initialGoat?.userId
  );
  const [resolvedFarmId, setResolvedFarmId] = useState<number | undefined>(
    routeFarmId ??
      ((location.state?.farmId as number | undefined) ??
        (searchParams.get("farmId")
          ? Number(searchParams.get("farmId"))
          : undefined) ??
        initialGoat?.farmId)
  );

  const [canAccessFarmModules, setCanAccessFarmModules] = useState(false);
  const [searchResults, setSearchResults] = useState<GoatResponseDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitSubmitting, setExitSubmitting] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);
  const [exitForm, setExitForm] = useState<GoatExitRequestDTO>({
    exitType: "VENDA",
    exitDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    if (!location.state?.goat) {
      return;
    }

    const stateGoat = location.state.goat as GoatResponseDTO;

    setGoat(stateGoat);
    setResolvedFarmId(
      routeFarmId ??
        ((location.state.farmId as number | undefined) ?? stateGoat.farmId)
    );
    setFarmOwnerId(
      (location.state.farmOwnerId as number | undefined) ??
        stateGoat.ownerId ??
        stateGoat.userId
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
        const goatData = await fetchGoatById(routeFarmId, routeGoatId);

        if (cancelled) {
          return;
        }

        setGoat(goatData);
        if (goatData.farmId) {
          setResolvedFarmId(Number(goatData.farmId));
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Detalhe do animal: erro ao carregar animal pela rota",
            error
          );
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
        const fullData = await fetchGoatById(
          resolvedFarmId,
          goat.registrationNumber
        );

        if (!cancelled) {
          setGoat((prev) => (prev ? { ...prev, ...fullData } : fullData));
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Detalhe do animal: erro ao completar dados da cabra",
            error
          );
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
          console.error(
            "Detalhe do animal: erro ao carregar dados da fazenda",
            error
          );
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
        console.error(
          "Detalhe do animal: falha ao resolver permissão da fazenda",
          error
        );
        setCanAccessFarmModules(false);
      }
    };

    void resolveFarmAccess();
  }, [resolvedFarmId, tokenPayload?.userId, permissions]);

  const handleShowEventForm = () => setShowEventForm(true);

  async function handleSearch(term: string) {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    if (!resolvedFarmId) {
      console.warn("Detalhe do animal: farmId não resolvido para busca.");
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
  const farmGoatsPath = resolvedFarmId
    ? buildFarmGoatsPath(resolvedFarmId)
    : "/goatfarms";

  const breadcrumbItems = [
    { label: "Fazendas", to: "/goatfarms" },
    ...(resolvedFarmId
      ? [
          {
            label: farmData?.name || goat?.farmName || "Fazenda",
            to: farmDashboardPath,
          },
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
  const normalizedStatus = String(goat?.status ?? "").trim().toUpperCase();
  const isOperationallyActive = ["ATIVO", "ACTIVE"].includes(normalizedStatus);
  const exitTypeOptions: Array<{ value: GoatExitType; label: string }> = [
    { value: "VENDA", label: "Venda" },
    { value: "MORTE", label: "Morte" },
    { value: "DESCARTE", label: "Descarte" },
    { value: "DOACAO", label: "Doação" },
    { value: "TRANSFERENCIA", label: "Transferência" },
  ];

  useEffect(() => {
    if (!resolvedFarmId || !goat) {
      return;
    }

    const goatRouteId = goat.id ?? goat.registrationNumber;

    if (!goatRouteId) {
      return;
    }

    saveLastGoatContext(resolvedFarmId, goatRouteId);
  }, [goat, resolvedFarmId]);

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

  const handleOpenExitModal = () => {
    if (!goat || !resolvedFarmId) {
      return;
    }
    setExitError(null);
    setExitForm({
      exitType: "VENDA",
      exitDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowExitModal(true);
  };

  const handleSubmitExit = async () => {
    if (!goat || !resolvedFarmId) {
      return;
    }

    if (!exitForm.exitDate) {
      setExitError("Informe a data efetiva da saída.");
      return;
    }

    try {
      setExitSubmitting(true);
      setExitError(null);
      const goatIdentifier = goat.id ?? goat.registrationNumber;
      await exitGoat(resolvedFarmId, goatIdentifier, {
        ...exitForm,
        notes: exitForm.notes?.trim() ? exitForm.notes.trim() : undefined,
      });

      const refreshedGoat = await fetchGoatById(resolvedFarmId, goatIdentifier);
      setGoat(refreshedGoat);
      setShowExitModal(false);
      toast.success("Saída do rebanho registrada com sucesso.");
    } catch (error) {
      console.error("Detalhe do animal: erro ao registrar saída", error);
      setExitError("Não foi possível registrar a saída agora. Revise os dados e tente novamente.");
      toast.error("Não foi possível registrar a saída do animal.");
    } finally {
      setExitSubmitting(false);
    }
  };

  return (
    <div className="content-in animal-context-page">
      <ContextBreadcrumb items={breadcrumbItems} />

      <section className="animal-context-hero" aria-label="Contexto do animal">
        <div>
          <span className="animal-context-hero__eyebrow">Gerir o animal</span>
          <h1 className="animal-context-hero__title">{heroTitle}</h1>
          <p className="animal-context-hero__description">{heroDescription}</p>
        </div>

        {canShowFarmShortcut && (
          <Link to={farmDashboardPath} className="animal-context-hero__cta">
            Gerenciar fazenda
          </Link>
        )}
      </section>

      <SearchInputBox
        onSearch={handleSearch}
        placeholder="Buscar outro animal desta fazenda..."
      />

      {isSearching ? (
        <div className="search-results-wrapper goat-search-results">
          <div className="goat-search-results__header">
            <h3>Resultados da busca ({searchResults.length})</h3>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchResults([]);
              }}
              className="btn-secondary"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              Fechar
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

              <div className="goat-panel__aside">
                <GoatActionPanel
                  registrationNumber={goat.registrationNumber}
                  resourceOwnerId={goat.ownerId ?? goat.userId ?? farmOwnerId}
                  canAccessModules={canAccessFarmModules}
                  onShowEventForm={handleShowEventForm}
                  onRequestExit={handleOpenExitModal}
                  farmId={resolvedFarmId ?? goat.farmId}
                  goatId={goat.id}
                  gender={goat.gender}
                  status={String(goat.status ?? "")}
                />
              </div>

              {showEventForm && (
                <GoatEventModal
                  goatId={goat.registrationNumber}
                  farmId={Number(goat.farmId)}
                  onClose={() => setShowEventForm(false)}
                  onEventCreated={() => setShowEventForm(false)}
                />
              )}

              {showExitModal && (
                <div className="animal-exit-modal" role="dialog" aria-modal="true">
                  <div className="animal-exit-modal__content">
                    <h3>Registrar saída do rebanho</h3>
                    <p className="animal-exit-modal__helper">
                      Esta ação encerra operações do animal nesta fazenda e mantém rastreabilidade de histórico.
                    </p>
                    {!isOperationallyActive && (
                      <p className="animal-exit-modal__warning">
                        Este animal já não está ativo para novas operações.
                      </p>
                    )}
                    <div className="animal-exit-modal__grid">
                      <div>
                        <label htmlFor="goat-exit-type">Tipo de saída</label>
                        <select
                          id="goat-exit-type"
                          value={exitForm.exitType}
                          onChange={(event) =>
                            setExitForm((prev) => ({
                              ...prev,
                              exitType: event.target.value as GoatExitType,
                            }))
                          }
                          disabled={exitSubmitting || !isOperationallyActive}
                        >
                          {exitTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="goat-exit-date">Data efetiva</label>
                        <input
                          id="goat-exit-date"
                          type="date"
                          value={exitForm.exitDate}
                          onChange={(event) =>
                            setExitForm((prev) => ({ ...prev, exitDate: event.target.value }))
                          }
                          max={new Date().toISOString().slice(0, 10)}
                          disabled={exitSubmitting || !isOperationallyActive}
                        />
                      </div>
                      <div className="animal-exit-modal__notes">
                        <label htmlFor="goat-exit-notes">Observações</label>
                        <textarea
                          id="goat-exit-notes"
                          rows={3}
                          value={exitForm.notes ?? ""}
                          onChange={(event) =>
                            setExitForm((prev) => ({ ...prev, notes: event.target.value }))
                          }
                          disabled={exitSubmitting || !isOperationallyActive}
                        />
                      </div>
                    </div>
                    {exitError && <p className="animal-exit-modal__error">{exitError}</p>}
                    <div className="animal-exit-modal__actions">
                      <Button
                        variant="secondary"
                        onClick={() => setShowExitModal(false)}
                        disabled={exitSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleSubmitExit}
                        loading={exitSubmitting}
                        disabled={!isOperationallyActive}
                      >
                        Confirmar saída
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-dashboard">
              <h3>Nenhum animal selecionado</h3>
              <p>
                Use a busca acima ou abra um animal pela lista do rebanho para
                entrar no detalhe individual.
              </p>
              <div className="goat-placeholder" aria-hidden="true">
                🐐
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
