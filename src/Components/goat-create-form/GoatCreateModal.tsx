// src/components/goat-create-form/GoatCreateModal.tsx
// Modal de criação reutilizado no fluxo de cadastro/edição da cabra.

import "./goatCreateModal.css";
import GoatCreateForm from "./GoatCreateForm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

interface Props {
  onClose: () => void;
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatResponseDTO;
  loading?: boolean;
  defaultFarmId?: number;
  defaultUserId?: number;
  defaultTod?: string;
}

export default function GoatCreateModal({
  onClose,
  onGoatCreated,
  mode = "create",
  initialData,
  loading = false,
  defaultFarmId,
  defaultUserId,
  defaultTod,
}: Props) {
  // Verifica se as props necessárias estão presentes e válidas.
  const missingProps =
    mode === "create" &&
    (defaultFarmId === undefined ||
      defaultFarmId === null ||
      defaultUserId === undefined ||
      defaultUserId === null ||
      defaultTod === undefined ||
      defaultTod === null ||
      defaultTod === "");

  const isEditLoading = mode === "edit" && (loading || !initialData);

  const handleGoatCreatedAndClose = () => {
    onGoatCreated();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content goat-create-modal" role="dialog" aria-modal="true" aria-label={mode === "edit" ? "Editar cabra" : "Cadastrar nova cabra"}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Fechar cadastro de cabra"
        >
          ×
        </button>

        <div className="goat-create-modal__body">
          {missingProps || isEditLoading ? (
            <p className="goat-create-modal__loading">
              {mode === "edit"
                ? "Carregando dados completos da cabra..."
                : "Carregando dados da fazenda..."}
            </p>
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
    </div>
  );
}
