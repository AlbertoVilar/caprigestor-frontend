// src/components/goat-create-form/GoatCreateModal.tsx
// NOTA: Modal de criação desativado - use a página /goats/new

import "./goatCreateModal.css";
import GoatCreateForm from "./GoatCreateForm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

interface Props {
  onClose: () => void;
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatResponseDTO;
  defaultFarmId?: number;
  defaultUserId?: number;
  defaultTod?: string;
}

export default function GoatCreateModal({
  onClose,
  onGoatCreated,
  mode = "create",
  initialData,
  defaultFarmId,
  defaultUserId,
  defaultTod,
}: Props) {

  // ✅ Verifica se as props necessárias estão presentes e válidas
  const missingProps =
    mode === "create" &&
    (defaultFarmId === undefined || defaultFarmId === null ||
      defaultUserId === undefined || defaultUserId === null ||
      defaultTod === undefined || defaultTod === null || defaultTod === "");

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

        {missingProps ? (
          <p>⏳ Carregando dados da fazenda...</p>
        ) : (
          <GoatCreateForm
            mode={mode}
            initialData={initialData}
            onGoatCreated={handleGoatCreatedAndClose}
            defaultFarmId={defaultFarmId}
            defaultUserId={defaultUserId}
            defaultTod={defaultTod}
          />
        )}
      </div>
    </div>
  );
}
