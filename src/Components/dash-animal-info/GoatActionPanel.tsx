// src/Components/dash-animal-info/GoatActionPanel.tsx

import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  onShowGenealogy: () => void;
  onShowEvents: () => void; // 👈 nova prop
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEvents, // 👈 recebendo a função
}: Props) {
  if (!registrationNumber) return null;

  return (
    <div className="goat-action-panel">
      <button className="btn-primary" onClick={onShowGenealogy}>
        🧬 Ver genealogia
      </button>
      <button className="btn-primary" onClick={onShowEvents}>
        🗓️ Ver eventos
      </button>
      <button className="btn-primary">➕ Adicionar evento</button>
      <button className="btn-disabled">Editar</button>
      <button className="btn-disabled">Excluir</button>
    </div>
  );
}
