// src/Components/goat-create-form/GoatCreateModal.tsx

import "./goatCreateModal.css";
import GoatCreateForm from "./GoatCreateForm";

interface Props {
  onClose: () => void;
  onGoatCreated: () => void;
}

export default function GoatCreateModal({ onClose, onGoatCreated }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal-content goat-create-modal">
        <button className="modal-close-btn" onClick={onClose}>
          ✖
        </button>
        <h2 className="modal-title">Cadastrar Nova Cabra</h2>
        <GoatCreateForm onGoatCreated={onGoatCreated} />
      </div>
    </div>
  );
}
