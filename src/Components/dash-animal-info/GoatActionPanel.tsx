import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  goatId?: number;
  resourceOwnerId?: number;
  onShowEventForm: () => void;
  onOpenEventHistory?: () => void;
  onRequestExit?: () => void;
  onRequestOwnershipTransfer?: () => void;
  farmId?: number | null;
  /** @deprecated module visibility is resolved from farm permissions. */
  canAccessModules?: boolean;
  gender?: string;
  status?: string;
  onOpenRegistrationRectification?: () => void;
  onOpenRegistrationHistory?: () => void;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowEventForm,
  onOpenEventHistory,
  farmId,
  status,
  onRequestExit,
  onRequestOwnershipTransfer,
  onOpenRegistrationRectification,
  onOpenRegistrationHistory,
}: Props) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { canOperateFarm, canAdministerFarm, loading: loadingFarmPermissions } =
    useFarmPermissions(farmId == null ? undefined : Number(farmId));

  const normalizedStatus = String(status ?? "").trim().toUpperCase();
  const hasOperationalStatus = normalizedStatus.length > 0;
  const isOperationallyActive =
    !hasOperationalStatus || ["ATIVO", "ACTIVE"].includes(normalizedStatus);

  const canAccessModules = canOperateFarm && !loadingFarmPermissions;

  if (!registrationNumber) {
    return null;
  }

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

        {canAccessModules && (
          <>
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

      {(canAddEvent || canEdit) && (
        <div className="goat-action-panel__group goat-action-panel__group--surface">
          <span className="goat-action-panel__group-label">Eventos</span>

          {canAddEvent && (
            <button className="action-btn" onClick={onShowEventForm}>
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              Novo evento
            </button>
          )}

          {canEdit && onOpenEventHistory && (
            <button className="action-btn" onClick={onOpenEventHistory}>
              <i className="fa-solid fa-pen" aria-hidden="true"></i>
              Editar evento
            </button>
          )}
        </div>
      )}

      {canEdit && (onOpenRegistrationRectification || onOpenRegistrationHistory) && (
        <div className="goat-action-panel__group goat-action-panel__group--surface">
          <span className="goat-action-panel__group-label">Identidade registral</span>
          {onOpenRegistrationRectification && (
            <button
              className="action-btn"
              type="button"
              onClick={onOpenRegistrationRectification}
            >
              <i className="fa-solid fa-id-card" aria-hidden="true"></i>
              Retificar registro
            </button>
          )}
          {onOpenRegistrationHistory && (
            <button
              className="action-btn"
              type="button"
              onClick={onOpenRegistrationHistory}
            >
              <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
              Histórico de registro
            </button>
          )}
        </div>
      )}

      {canEdit && onRequestOwnershipTransfer && (
        <div className="goat-action-panel__group goat-action-panel__group--surface">
          <span className="goat-action-panel__group-label">Propriedade</span>
          <button
            className="action-btn"
            type="button"
            onClick={onRequestOwnershipTransfer}
          >
            <i className="fa-solid fa-arrow-right-arrow-left" aria-hidden="true"></i>
            Transferir propriedade
          </button>
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
