import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionService } from "@/services/PermissionService";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  goatId?: number; // ID numérico para rotas RESTful
  resourceOwnerId?: number;
  onShowGenealogy: () => void;
  onShowEventForm: () => void;
  /** Novo: contexto de fazenda para rotas aninhadas */
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
  // hooks de auxilio se necessário no futuro
  // const { isAdmin: checkAdmin } = usePermissions();

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
    <div className="goat-action-panel">
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ações Rápidas</h4>
      
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
                // Prefer goatId (database ID) for RESTful routes, fallback to registrationNumber if needed
                const identifier = goatId ? goatId.toString() : registrationNumber;
                navigate(
                  `/app/goatfarms/${farmId}/goats/${identifier}/health`
                );
              }
            }}
            title={
              !farmId
                ? "Aguardando carregamento dos dados do animal..."
                : "Controle Sanitário"
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
                    navigate(
                      `/app/goatfarms/${farmId}/goats/${registrationNumber}/lactations`
                    );
                  }
                }}
                title={
                  !farmId
                    ? "Aguardando carregamento dos dados do animal..."
                    : "Gerenciar lactacoes"
                }
              >
                <i className="fa-solid fa-circle-nodes"></i>
                {!farmId ? "Carregando..." : "Lactacoes"}
              </button>
              <button
                className="action-btn"
                disabled={!farmId}
                onClick={() => {
                  if (farmId) {
                    navigate(
                      `/app/goatfarms/${farmId}/goats/${registrationNumber}/milk-productions`
                    );
                  }
                }}
                title={
                  !farmId
                    ? "Aguardando carregamento dos dados do animal..."
                    : "Producao de leite"
                }
              >
                <i className="fa-solid fa-jug-detergent"></i>
                {!farmId ? "Carregando..." : "Producao de leite"}
              </button>
              <button
                className="action-btn"
                disabled={!farmId}
                onClick={() => {
                  if (farmId) {
                    navigate(
                      `/app/goatfarms/${farmId}/goats/${registrationNumber}/reproduction`
                    );
                  }
                }}
                title={
                  !farmId
                    ? "Aguardando carregamento dos dados do animal..."
                    : "Reproducao"
                }
              >
                <i className="fa-solid fa-venus-mars"></i>
                {!farmId ? "Carregando..." : "Reproducao"}
              </button>
            </>
          )}
        </>
      )}

      {canSeeEvents && (
        <button
          className="action-btn"
          onClick={() => {
            const base = `/cabras/${registrationNumber}/eventos`;
            const url = farmId != null ? `${base}?farmId=${farmId}` : base;
            navigate(url);
          }}
        >
          <i className="fa-solid fa-calendar-days"></i> Ver eventos
        </button>
      )}

      {(canAddEvent || canEdit || canDelete) && <div className="btn-divider"></div>}

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
  );


}
