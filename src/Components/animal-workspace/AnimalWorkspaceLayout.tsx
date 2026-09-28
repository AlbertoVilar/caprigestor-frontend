import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildFarmWorkspaceGoatsPath,
  buildGoatDetailPath,
  buildGoatHealthPath,
  buildGoatLactationsPath,
  buildGoatMilkProductionsPath,
  buildGoatReproductionPath,
  buildManagedFarmsPath,
  buildPrivateGoatEventsPath,
  buildPrivateGoatGenealogyPath,
  resolveGoatInternalRouteId,
} from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { ErrorState, LoadingState } from "../ui";
import "./AnimalWorkspaceLayout.css";

type AnimalModule = { label: string; path: string; icon: string; end?: boolean; femaleOnly?: boolean };

const modules: AnimalModule[] = [
  { label: "Visão geral", path: "", icon: "fa-solid fa-house", end: true },
  { label: "Eventos", path: "events", icon: "fa-solid fa-calendar-days" },
  { label: "Saúde", path: "health", icon: "fa-solid fa-notes-medical" },
  { label: "Reprodução", path: "reproduction", icon: "fa-solid fa-venus-mars", femaleOnly: true },
  { label: "Lactações", path: "lactations", icon: "fa-solid fa-circle-nodes", femaleOnly: true },
  { label: "Leite", path: "milk-productions", icon: "fa-solid fa-droplet", femaleOnly: true },
  { label: "Genealogia", path: "genealogy", icon: "fa-solid fa-dna" },
];

const isMale = (gender?: string) => ["MALE", "MACHO", "M"].includes(String(gender ?? "").toUpperCase());

export default function AnimalWorkspaceLayout() {
  const { farmId: farmIdParam, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const farmId = useMemo(() => Number(farmIdParam), [farmIdParam]);
  const validContext = Number.isSafeInteger(farmId) && farmId > 0 && Boolean(goatId);
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(validContext);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (!validContext) {
      setGoat(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchGoatById(farmId, goatId as string)
      .then((loaded) => {
        if (!cancelled) setGoat(loaded);
      })
      .catch((reason) => {
        if (!cancelled) {
          setGoat(null);
          setError(getApiErrorMessage(parseApiError(reason)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [farmId, goatId, requestVersion, validContext]);

  if (!validContext) {
    return <ErrorState title="Animal inválido" description="Não foi possível identificar o animal solicitado." onRetry={() => navigate(buildManagedFarmsPath())} retryLabel="Escolher fazenda" />;
  }
  if (loading) return <LoadingState label="Carregando o espaço de trabalho do animal..." />;
  if (error || !goat) {
    return (
      <div className="animal-workspace__context-error">
        <ErrorState title="Não foi possível carregar o animal" description={error ?? "O animal solicitado não foi encontrado nesta fazenda."} onRetry={() => setRequestVersion((value) => value + 1)} retryLabel="Tentar novamente" />
        <button type="button" className="animal-workspace__safe-exit" onClick={() => navigate(buildFarmWorkspaceGoatsPath(farmId))}>Voltar ao rebanho</button>
      </div>
    );
  }

  const visibleModules = modules.filter((item) => !(item.femaleOnly && isMale(goat.gender)));
  const technicalGoatId = resolveGoatInternalRouteId(goat);
  const modulePaths: Record<string, string> = {
    "": buildGoatDetailPath(farmId, technicalGoatId),
    events: buildPrivateGoatEventsPath(farmId, technicalGoatId),
    health: buildGoatHealthPath(farmId, technicalGoatId),
    reproduction: buildGoatReproductionPath(farmId, technicalGoatId),
    lactations: buildGoatLactationsPath(farmId, technicalGoatId),
    "milk-productions": buildGoatMilkProductionsPath(farmId, technicalGoatId),
    genealogy: buildPrivateGoatGenealogyPath(farmId, technicalGoatId),
  };
  const legacyOverviewPath = buildGoatDetailPath(farmId, goatId as string);
  return (
    <div className="animal-workspace" data-farm-id={farmId} data-goat-id={goat.technicalId ?? goat.id ?? goatId}>
      <header className="animal-workspace__header">
        <div className="animal-workspace__identity">
          <span className="animal-workspace__avatar" aria-hidden="true"><i className="fa-solid fa-goat" /></span>
          <div>
            <p className="animal-workspace__eyebrow">Espaço do animal</p>
            <h1>{goat.name || "Animal"}</h1>
            <p className="animal-workspace__meta">Registro {goat.registrationNumber || "Não informado"} · {String(goat.status || "").trim() || "Status não informado"}</p>
          </div>
        </div>
        <button type="button" className="animal-workspace__return" onClick={() => navigate(buildFarmWorkspaceGoatsPath(farmId))}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> <span>Voltar ao rebanho</span>
        </button>
      </header>
      <nav className="animal-workspace__navigation" aria-label="Módulos do animal">
        {visibleModules.map((item) => (
          <NavLink
            key={item.label}
            to={modulePaths[item.path]}
            end={item.end}
            aria-current={
              location.pathname === modulePaths[item.path] ||
              (item.path === "" && location.pathname === legacyOverviewPath) ||
              (item.path !== "" && location.pathname.endsWith(`/${item.path}`))
                ? "page"
                : undefined
            }
            className={({ isActive }) => {
              const legacyOverviewActive = item.path === "" && location.pathname === legacyOverviewPath;
              const legacyModuleActive = item.path !== "" && location.pathname.endsWith(`/${item.path}`);
              return `animal-workspace__nav-link${isActive || legacyOverviewActive || legacyModuleActive ? " is-active" : ""}`;
            }}
          >
            <i className={item.icon} aria-hidden="true" /><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="animal-workspace__content"><Outlet context={{ goat, farmId }} /></div>
    </div>
  );
}
