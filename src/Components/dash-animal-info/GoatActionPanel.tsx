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
  isFemale?: boolean;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
  resourceOwnerId,
  farmId,
  isFemale,
}: Props) {
  const navigate = useNavigate();
  const { tokenPayload } = useAuth();
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
      {/* Público (read-only) */}
      <button className="btn-primary action-btn" onClick={onShowGenealogy}>
        <span className="icon">🧬</span> Ver genealogia
      </button>

      {isFemale && (
        <>
          <button
            className="btn-primary action-btn"
            disabled={!farmId}
            onClick={() => {
              if (farmId) {
                navigate(`/app/goatfarms/${farmId}/goats/${registrationNumber}/lactations`);
              }
            }}
            title={!farmId ? "Aguardando carregamento dos dados do animal..." : "Gerenciar lactações"}
          >
            <span className="icon">🍼</span>
            {!farmId ? "Carregando..." : "Lactações"}
          </button>
          <button
            className="btn-primary action-btn"
            disabled={!farmId}
            onClick={() => {
              if (farmId) {
                navigate(`/app/goatfarms/${farmId}/goats/${registrationNumber}/milk-productions`);
              }
            }}
            title={!farmId ? "Aguardando carregamento dos dados do animal..." : "Produção de leite"}
          >
            <span className="icon">🥛</span>
            {!farmId ? "Carregando..." : "Produção de leite"}
          </button>
          <button
            className="btn-primary action-btn"
            disabled={!farmId}
            onClick={() => {
              if (farmId) {
                navigate(`/app/goatfarms/${farmId}/goats/${registrationNumber}/reproduction`);
              }
            }}
            title={!farmId ? "Aguardando carregamento dos dados do animal..." : "Reprodução"}
          >
            <span className="icon">🧫</span>
            {!farmId ? "Carregando..." : "Reprodução"}
          </button>
        </>
      )}

      {/* Eventos: restrito (admin ou operador dono) */}
      {canSeeEvents && (
        <button
          className="btn-primary action-btn"
          onClick={() => {
            const base = `/cabras/${registrationNumber}/eventos`;
            const url = farmId != null ? `${base}?farmId=${farmId}` : base;
            navigate(url);
          }}
        >
          <span className="icon">🗓️</span> Ver eventos
        </button>
      )}

      {/* Separador visível apenas se houver alguma ação restrita liberada */}
      {(canAddEvent || canEdit || canDelete) && <div className="btn-divider"></div>}

      {/* Ações restritas */}
      {canAddEvent && (
        <button className="btn-primary action-btn" onClick={onShowEventForm}>
          <span className="icon">➕</span> Novo evento
        </button>
      )}

      {canEdit && (
        <button
          className="btn-primary action-btn"
          onClick={() => {
            // abra seu modal/fluxo de edição aqui, se tiver
            onShowEventForm(); // ou outro handler específico de editar
          }}
        >
          <span className="icon">✏️</span> Editar
        </button>
      )}

      {canDelete && (
        <button
          className="btn-danger action-btn"
          onClick={() => {
            // Implementar ação de exclusão
          }}
        >
          <span className="icon">🗑️</span> Excluir
        </button>
      )}
    </div>
  );
}
