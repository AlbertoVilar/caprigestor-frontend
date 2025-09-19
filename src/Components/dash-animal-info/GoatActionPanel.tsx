import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  onShowGenealogy: () => void;
  onShowEventForm: () => void;

  /**
   * Opcional: ID do proprietário/dono do recurso.
   * Se você passar (ex.: ownerId da cabra/fazenda), o operador só verá ações se for o dono.
   * Se não passar, apenas ADMIN verá as ações (operador ficará bloqueado).
   */
  resourceOwnerId?: number;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
  resourceOwnerId,
}: Props) {
  const navigate = useNavigate();
  const { isAuthenticated, tokenPayload } = useAuth();

  if (!registrationNumber) return null;

  const roles = tokenPayload?.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);

  // Operador só pode gerenciar se for dono do recurso (quando resourceOwnerId for informado)
  const isOwnerOperator =
    isOperator &&
    resourceOwnerId != null &&
    tokenPayload?.userId === resourceOwnerId;

  // Regras de visibilidade: Admin tem acesso total, Operator tem acesso total se for dono
  const canSeeEvents = isAdmin || isOperator || isOwnerOperator;
  const canAddEvent = isAdmin || isOperator || isOwnerOperator;
  const canEdit = isAdmin || isOwnerOperator;
  const canDelete = isAdmin || isOwnerOperator;



  return (
    <div className="goat-action-panel">
      {/* Público (read-only) */}
      <button className="btn-primary" onClick={onShowGenealogy}>
        <span className="icon">🧬</span> Ver genealogia
      </button>

      {/* Eventos: restrito (admin ou operador dono) */}
      {canSeeEvents && (
        <button
          className="btn-primary"
          onClick={() => navigate(`/cabras/${registrationNumber}/eventos`)}
        >
          <span className="icon">📅</span> Ver eventos
        </button>
      )}

      {/* Separador visível apenas se houver alguma ação restrita liberada */}
      {(canAddEvent || canEdit || canDelete) && <div className="btn-divider"></div>}

      {/* Ações restritas */}
      {canAddEvent && (
        <button className="btn-primary" onClick={onShowEventForm}>
          <span className="icon">➕</span> Novo evento
        </button>
      )}

      {canEdit && (
        <button
          className="btn-primary"
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
          className="btn-danger"
          onClick={() => {
            // TODO: conectar sua ação de exclusão
          }}
        >
          <span className="icon">🗑️</span> Excluir
        </button>
      )}
    </div>
  );
}
