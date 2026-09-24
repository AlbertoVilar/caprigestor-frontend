import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { buildManagedFarmsPath } from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { ErrorState, LoadingState } from "../ui";
import FarmLogoImage from "../farm-logo/FarmLogoImage";
import "./FarmWorkspaceLayout.css";

type WorkspaceModule = {
  label: string;
  path: string;
  icon: string;
  end?: boolean;
  requiresAdministration?: boolean;
};

const modules: WorkspaceModule[] = [
  { label: "Visão geral", path: "dashboard", icon: "fa-solid fa-house", end: true },
  { label: "Rebanho", path: "goats", icon: "fa-solid fa-goat" },
  { label: "Registro", path: "registry", icon: "fa-solid fa-book-open" },
  { label: "Alertas", path: "alerts", icon: "fa-solid fa-bell" },
  { label: "Saúde", path: "health-agenda", icon: "fa-solid fa-notes-medical" },
  { label: "Leite", path: "milk-consolidated", icon: "fa-solid fa-droplet" },
  { label: "Estoque", path: "inventory", icon: "fa-solid fa-boxes-stacked" },
  { label: "Comercial", path: "commercial", icon: "fa-solid fa-cash-register" },
  {
    label: "Transferências",
    path: "ownership-transfers",
    icon: "fa-solid fa-right-left",
    requiresAdministration: true,
  },
  { label: "Relatórios", path: "reports", icon: "fa-solid fa-chart-line" },
];

export default function FarmWorkspaceLayout() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const validFarmId = Number.isSafeInteger(farmIdNumber) && farmIdNumber > 0;
  const {
    canOperateFarm,
    canAdministerFarm,
    loading: permissionsLoading,
    error: permissionsError,
    retry: retryPermissions,
  } = useFarmPermissions(validFarmId ? farmIdNumber : undefined);
  const [farm, setFarm] = useState<GoatFarmDTO | null>(null);
  const [loadingFarm, setLoadingFarm] = useState(validFarmId);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [farmRequestVersion, setFarmRequestVersion] = useState(0);
  const retryFarm = () => setFarmRequestVersion((version) => version + 1);

  useEffect(() => {
    let cancelled = false;

    if (!validFarmId) {
      setFarm(null);
      setFarmError(null);
      setLoadingFarm(false);
      return () => {
        cancelled = true;
      };
    }

    setLoadingFarm(true);
    setFarmError(null);

    void getGoatFarmById(farmIdNumber)
      .then((nextFarm) => {
        if (!cancelled) {
          setFarm(nextFarm);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFarm(null);
          setFarmError(getApiErrorMessage(parseApiError(error)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFarm(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [farmIdNumber, farmRequestVersion, validFarmId]);

  if (!validFarmId) {
    return (
      <ErrorState
        title="Fazenda inválida"
        description="Não foi possível identificar a fazenda solicitada."
        onRetry={() => navigate(buildManagedFarmsPath())}
        retryLabel="Escolher fazenda"
      />
    );
  }

  if (loadingFarm || permissionsLoading) {
    return <LoadingState label="Carregando o espaço de trabalho da fazenda..." />;
  }

  if (farmError || !farm) {
    return (
      <div className="farm-workspace__context-error">
        <ErrorState
          title="Não foi possível carregar a fazenda"
          description={farmError ?? "A fazenda solicitada não foi encontrada."}
          onRetry={retryFarm}
        />
        <button
          type="button"
          className="farm-workspace__safe-exit"
          onClick={() => navigate(buildManagedFarmsPath())}
        >
          Escolher fazenda
        </button>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <div className="farm-workspace__context-error">
        <ErrorState
          title="Não foi possível consultar as permissões"
          description={getApiErrorMessage(parseApiError(permissionsError))}
          onRetry={retryPermissions}
          retryLabel="Tentar novamente"
        />
        <button
          type="button"
          className="farm-workspace__safe-exit"
          onClick={() => navigate(buildManagedFarmsPath())}
        >
          Escolher fazenda
        </button>
      </div>
    );
  }

  if (!canOperateFarm && !canAdministerFarm) {
    return (
      <Navigate
        to="/403"
        replace
        state={{
          from: location.pathname,
          requiredRoles: [],
          reason: "farm-context-not-authorized",
        }}
      />
    );
  }

  const visibleModules = modules.filter((item) =>
    item.requiresAdministration ? canAdministerFarm : true
  );

  return (
    <div className="farm-workspace" data-farm-id={farm.id}>
      <header className="farm-workspace__header">
        <div className="farm-workspace__identity">
          <FarmLogoImage
            src={farm.logoUrl}
            farmName={farm.name}
            className="farm-workspace__logo"
          />
          <div>
            <p className="farm-workspace__eyebrow">Central administrativa</p>
            <h1>{farm.name}</h1>
            <p className="farm-workspace__tod">
              <span>TOD</span> {farm.tod || "Não informado"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="farm-workspace__switch"
          onClick={() => navigate(buildManagedFarmsPath())}
        >
          <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
          <span>Trocar fazenda</span>
        </button>
      </header>

      <nav className="farm-workspace__navigation" aria-label="Módulos da fazenda">
        {visibleModules.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            aria-current={
              location.pathname.endsWith(`/${item.path}`) ||
              location.pathname.includes(`/${item.path}/`)
                ? "page"
                : undefined
            }
            className={({ isActive }) =>
              `farm-workspace__nav-link${isActive ? " is-active" : ""}`
            }
          >
            <i className={item.icon} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="farm-workspace__content" key={location.pathname}>
        <Outlet />
      </div>
    </div>
  );
}
