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
      <button className="btn-primary" onClick={onShowGenealogy}>
        🧬 Ver genealogia
      </button>

      <button
        className="btn-primary"
        onClick={() => navigate(`/cabras/${registrationNumber}/eventos`)}
      >
        🗓️ Ver eventos
      </button>

      <button className="btn-primary" onClick={onShowEventForm}>
        ➕ Adicionar evento
      </button>

      <button className="btn-disabled">Editar</button>
      <button className="btn-disabled">Excluir</button>
    </div>
  );
}
