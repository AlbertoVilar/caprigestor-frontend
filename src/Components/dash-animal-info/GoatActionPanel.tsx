import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import {
  buildFarmDashboardPath,
  buildGoatEventsPath,
  buildGoatGenealogyPath,
  buildGoatHealthPath,
  buildGoatLactationsPath,
  buildGoatMilkProductionsPath,
  buildGoatReproductionPath,
} from "../../utils/appRoutes";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  goatId?: number;
  resourceOwnerId?: number;
  onShowEventForm: () => void;
  onRequestExit?: () => void;
  farmId?: number | null;
  /** @deprecated module visibility is resolved from farm permissions. */
  canAccessModules?: boolean;
  gender?: string;
  status?: string;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowEventForm,
  farmId,
  gender,
  status,
  goatId,
  onRequestExit,
}: Props) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { canOperateFarm, canAdministerFarm, loading: loadingFarmPermissions } =
    useFarmPermissions(farmId == null ? undefined : Number(farmId));

  const normalizedGender = String(gender ?? "").toUpperCase();
  const isMale = ["MALE", "MACHO", "M"].includes(normalizedGender);
  const normalizedStatus = String(status ?? "").trim().toUpperCase();
  const hasOperationalStatus = normalizedStatus.length > 0;
  const isOperationallyActive =
    !hasOperationalStatus || ["ATIVO", "ACTIVE"].includes(normalizedStatus);

  const canAccessModules = canOperateFarm && !loadingFarmPermissions;

  if (!registrationNumber) {
    return null;
  }

  const goatRouteId = goatId ?? registrationNumber;

  const canSeeEvents = isAuthenticated && canAccessModules;
  const canAddEvent = isAuthenticated && canAccessModules;
  const canEdit = isAuthenticated && canAdministerFarm && !loadingFarmPermissions;

  return (
    <aside className="goat-action-panel" aria-label="Ações do animal">
      <div className="goat-action-panel__group goat-action-panel__group--intro">
        <h4 className="goat-action-panel__title">Ações do animal</h4>
      </div>

      <div className="goat-action-panel__group goat-action-panel__group--surface">
        <span className="goat-action-panel__group-label">Manejo</span>
        {hasOperationalStatus && !isOperationallyActive && (
          <p className="goat-action-panel__warning">
            Animal com status não ativo: operações operacionais ficam bloqueadas.
          </p>
        )}

        <button
          className="action-btn"
          disabled={!farmId}
          onClick={() => {
            if (farmId) {
              navigate(buildGoatGenealogyPath(farmId, goatRouteId));
            }
          }}
          title={
            !farmId
              ? "Aguardando carregamento dos dados do animal..."
              : "Abrir visualização completa da genealogia"
          }
        >
          <i className="fa-solid fa-dna" aria-hidden="true"></i>
          {!farmId ? "Carregando..." : "Abrir genealogia completa"}
        </button>

        {canAccessModules && (
          <>
            <button
              className="action-btn"
              disabled={!farmId}
              onClick={() => {
                if (farmId) {
                  navigate(buildGoatHealthPath(farmId, goatRouteId));
                }
              }}
              title={
                !farmId
                  ? "Aguardando carregamento dos dados do animal..."
                  : "Controle sanitário do animal"
              }
            >
              <i className="fa-solid fa-notes-medical" aria-hidden="true"></i>
              {!farmId ? "Carregando..." : "Sanidade"}
            </button>

            {!isMale && (
              <>
                <button
                  className="action-btn"
                  disabled={!farmId}
                  onClick={() => {
                    if (farmId) {
                      navigate(buildGoatLactationsPath(farmId, goatRouteId));
                    }
                  }}
                  title={
                    !farmId
                      ? "Aguardando carregamento dos dados do animal..."
                      : "Gerenciar lactações"
                  }
                >
                  <i className="fa-solid fa-circle-nodes" aria-hidden="true"></i>
                  {!farmId ? "Carregando..." : "Lactações"}
                </button>

                <button
                  className="action-btn"
                  disabled={!farmId}
                  onClick={() => {
                    if (farmId) {
                      navigate(buildGoatMilkProductionsPath(farmId, goatRouteId));
                    }
                  }}
                  title={
                    !farmId
                      ? "Aguardando carregamento dos dados do animal..."
                      : "Produção de leite"
                  }
                >
                  <i className="fa-solid fa-jug-detergent" aria-hidden="true"></i>
                  {!farmId ? "Carregando..." : "Produção de leite"}
                </button>

                <button
                  className="action-btn"
                  disabled={!farmId}
                  onClick={() => {
                    if (farmId) {
                      navigate(buildGoatReproductionPath(farmId, goatRouteId));
                    }
                  }}
                  title={
                    !farmId
                      ? "Aguardando carregamento dos dados do animal..."
                      : "Reprodução"
                  }
                >
                  <i className="fa-solid fa-venus-mars" aria-hidden="true"></i>
                  {!farmId ? "Carregando..." : "Reprodução"}
                </button>
              </>
            )}

            {onRequestExit && (
              <button
                className="action-btn action-btn--exit"
                onClick={onRequestExit}
                disabled={!isOperationallyActive}
                title={
                  isOperationallyActive
                    ? "Registrar saída controlada do rebanho"
                    : "A saída já foi registrada para este animal"
                }
              >
                <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                Registrar saída do rebanho
              </button>
            )}
          </>
        )}
      </div>

      {(canSeeEvents || canAddEvent || canEdit) && (
        <div className="goat-action-panel__group goat-action-panel__group--surface">
          <span className="goat-action-panel__group-label">Eventos</span>

          {canSeeEvents && (
            <button
              className="action-btn"
              onClick={() => {
                navigate(buildGoatEventsPath(registrationNumber, farmId));
              }}
            >
              <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
              Ver eventos
            </button>
          )}

          {canAddEvent && (
            <button className="action-btn" onClick={onShowEventForm}>
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Novo evento
            </button>
          )}

          {canEdit && (
            <button className="action-btn" onClick={onShowEventForm}>
              <i className="fa-solid fa-pen" aria-hidden="true"></i>
              Editar evento
            </button>
          )}
        </div>
      )}

      {farmId && (
        <div className="goat-action-panel__group goat-action-panel__group--surface goat-action-panel__group--context">
          <span className="goat-action-panel__group-label">Fazenda</span>
          <button
            className="action-btn action-btn--context"
            onClick={() => {
              navigate(buildFarmDashboardPath(farmId));
            }}
          >
            <i className="fa-solid fa-tractor" aria-hidden="true"></i>
            Gerenciar Fazenda
          </button>
        </div>
      )}
    </aside>
  );
}
