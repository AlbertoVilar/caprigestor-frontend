import "./goatCreateModal.css";
import GoatCreateForm from "./GoatCreateForm";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";

interface Props {
  onClose: () => void;
  onGoatCreated: () => void;
  mode?: "create" | "edit"; // modo opcional (default: create)
  initialData?: GoatRequestDTO; // dados iniciais para edição
}

export default function GoatCreateModal({
  onClose,
  onGoatCreated,
  mode = "create",
  initialData,
}: Props) {
  // Nova função: atualiza a lista e fecha o modal após sucesso
  const handleGoatCreatedAndClose = () => {
    onGoatCreated();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content goat-create-modal">
        <button className="modal-close-btn" onClick={onClose}>
          ✖
        </button>
        <h2 className="modal-title">
          {mode === "edit" ? "Editar Cabra" : "Cadastrar Nova Cabra"}
        </h2>
        <GoatCreateForm
          mode={mode}
          initialData={initialData}
          onGoatCreated={handleGoatCreatedAndClose} // ⬅️ novo comportamento
        />
      </div>
    </div>
  );
}
