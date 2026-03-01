import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionService } from "@/services/PermissionService";
import {
  buildFarmDashboardPath,
  buildGoatEventsPath,
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
  onShowGenealogy: () => void;
  onShowEventForm: () => void;
  farmId?: number | null;
  canAccessModules?: boolean;
  gender?: string;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
  resourceOwnerId,
  farmId,
  canAccessModules = false,
  gender,
  goatId,
}: Props) {
  const navigate = useNavigate();
  const { tokenPayload } = useAuth();

  const gUpper = String(gender ?? "").toUpperCase();
  const isMale = ["MALE", "MACHO", "M"].includes(gUpper);

  if (!registrationNumber) return null;

  const userRole =
    tokenPayload?.authorities?.includes("ROLE_ADMIN")
      ? "ROLE_ADMIN"
      : tokenPayload?.authorities?.includes("ROLE_OPERATOR")
        ? "ROLE_OPERATOR"
        : tokenPayload?.authorities?.includes("ROLE_FARM_OWNER")
          ? "ROLE_FARM_OWNER"
          : tokenPayload?.authorities?.[0] ?? "";
  const userId = tokenPayload?.userId;
  const farmOwnerId = resourceOwnerId;
  const goatRouteId = goatId ?? registrationNumber;

  const canSeeEvents =
    !!tokenPayload &&
    PermissionService.canViewEvent(userRole, userId, farmOwnerId);
  const canAddEvent =
    !!tokenPayload &&
    PermissionService.canCreateEvent(userRole, userId, farmOwnerId);
  const canEdit =
    !!tokenPayload &&
    PermissionService.canEditEvent(userRole, userId, farmOwnerId);
  const canDelete =
    !!tokenPayload &&
    PermissionService.canDeleteEvent(userRole, userId, farmOwnerId);

  return (
    <aside className="goat-action-panel" aria-label="Ações do animal">
      <div className="goat-action-panel__group">
        <h4 className="goat-action-panel__title">Ações do Animal</h4>
        <p className="goat-action-panel__subtitle">
          O manejo individual fica aqui. A gestão da fazenda segue em um contexto separado.
        </p>
      </div>

      <div className="goat-action-panel__group">
        <span className="goat-action-panel__group-label">Manejo individual</span>
        <button className="action-btn" onClick={onShowGenealogy}>
          <i className="fa-solid fa-dna"></i> Ver genealogia
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
              <i className="fa-solid fa-notes-medical"></i>
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
                  <i className="fa-solid fa-circle-nodes"></i>
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
                  <i className="fa-solid fa-jug-detergent"></i>
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
                  <i className="fa-solid fa-venus-mars"></i>
                  {!farmId ? "Carregando..." : "Reprodução"}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {(canSeeEvents || canAddEvent || canEdit || canDelete) && (
        <div className="goat-action-panel__group">
          <span className="goat-action-panel__group-label">Eventos do animal</span>

          {canSeeEvents && (
            <button
              className="action-btn"
              onClick={() => {
                navigate(buildGoatEventsPath(registrationNumber, farmId));
              }}
            >
              <i className="fa-solid fa-calendar-days"></i> Ver eventos
            </button>
          )}

          {canAddEvent && (
            <button className="action-btn" onClick={onShowEventForm}>
              <i className="fa-solid fa-plus"></i> Novo evento
            </button>
          )}

          {canEdit && (
            <button
              className="action-btn"
              onClick={() => {
                onShowEventForm();
              }}
            >
              <i className="fa-solid fa-pen"></i> Editar
            </button>
          )}

          {canDelete && (
            <button
              className="action-btn btn-danger"
              onClick={() => {
                // Implementar acao de exclusao
              }}
            >
              <i className="fa-solid fa-trash"></i> Excluir
            </button>
          )}
        </div>
      )}

      {farmId && (
        <div className="goat-action-panel__group goat-action-panel__group--context">
          <span className="goat-action-panel__group-label">Contexto da fazenda</span>
          <button
            className="action-btn action-btn--context"
            onClick={() => {
              navigate(buildFarmDashboardPath(farmId));
            }}
          >
            <i className="fa-solid fa-tractor"></i> Gerenciar Fazenda
          </button>
        </div>
      )}
    </aside>
  );
}
