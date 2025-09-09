import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/Hooks/usePermissions";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  onShowGenealogy: () => void;
  onShowEventForm: () => void;
  resourceOwnerId?: number;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
  resourceOwnerId,
}: Props) {
  const navigate = useNavigate();
  const { canManage, canDelete } = usePermissions({ resourceOwnerId });

  if (!registrationNumber) return null;

  return (
    <div className="goat-action-panel">
      {/* Público (read-only) */}
      <button className="btn-primary" onClick={onShowGenealogy}>
        <span className="icon">🧬</span> Ver genealogia
      </button>

      {/* Ações para dono ou admin */}
      {canManage && (
        <>
          <button
            className="btn-primary"
            onClick={() => navigate(`/cabras/${registrationNumber}/eventos`)}
          >
            <span className="icon">📅</span> Ver eventos
          </button>

          <div className="btn-divider"></div>

          <button className="btn-primary" onClick={onShowEventForm}>
            <span className="icon">➕</span> Novo evento
          </button>
          
          <button className="btn-primary" onClick={() => onShowEventForm() /* ou handler de edição */}>
            Editar
          </button>
        </>
      )}
      
      {/* Botão de exclusão: apenas admin */}
      {canDelete && (
        <button
          className="btn-danger"
          onClick={() => { /* TODO: conectar ação de exclusão */ }}
        >
          Excluir
        </button>
      )}
    </div>
  );
}
