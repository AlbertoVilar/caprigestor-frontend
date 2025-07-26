import { useNavigate } from "react-router-dom";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  onShowGenealogy: () => void;
  onShowEventForm: () => void;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
}: Props) {
  const navigate = useNavigate();

  if (!registrationNumber) return null;

  return (
    <div className="goat-action-panel">
      {/* Ações públicas */}
      <button className="btn-primary" onClick={onShowGenealogy}>
        <span className="icon">🧬</span> Ver genealogia
      </button>

      <button
        className="btn-primary"
        onClick={() => navigate(`/cabras/${registrationNumber}/eventos`)}
      >
        <span className="icon">📅</span> Ver eventos
      </button>

      {/* Separador */}
      <div className="btn-divider"></div>

      {/* Ações restritas */}
      <button className="btn-primary" onClick={onShowEventForm}>
        <span className="icon">➕</span> Novo evento
      </button>

      <button className="btn-disabled">Editar</button>
      <button className="btn-disabled">Excluir</button>
    </div>
  );
}
