import { useNavigate } from "react-router-dom";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
}

export default function GoatActionPanel({ registrationNumber }: Props) {
  const navigate = useNavigate();

  if (!registrationNumber) return null;

  const goToGenealogy = () => {
    navigate(`/genealogia/${registrationNumber}`);
  };

  return (
    <div className="goat-action-panel">
      <button className="btn-primary" onClick={goToGenealogy}>
        🧬 Ver genealogia
      </button>
      <button className="btn-primary">🗓️ Ver eventos</button>
      <button className="btn-primary">➕ Adicionar evento</button>
      <button className="btn-disabled">Editar</button>
      <button className="btn-disabled">Excluir</button>
    </div>
  );
}
