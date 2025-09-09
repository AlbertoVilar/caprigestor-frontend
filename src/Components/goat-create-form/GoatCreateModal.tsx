// src/components/goat-create-form/GoatCreateModal.tsx

import { useEffect } from "react";
import "./goatCreateModal.css";
import GoatCreateForm from "./GoatCreateForm";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";

interface Props {
  onClose: () => void;
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatRequestDTO;
  defaultFarmId?: number;
  defaultOwnerId?: number; // Compatibilidade - usar defaultUserId
  defaultTod?: string;
}

export default function GoatCreateModal({
  onClose,
  onGoatCreated,
  mode = "create",
  initialData,
  defaultFarmId,
  defaultOwnerId, // Compatibilidade
  defaultTod,
}: Props) {
  // Log para debug (pode remover depois)
  useEffect(() => {
    console.log("🧬 Props recebidos no modal:", {
      defaultFarmId,
      defaultOwnerId, // Compatibilidade
      defaultTod,
      mode,
    });
  }, [defaultFarmId, defaultOwnerId, defaultTod, mode]); // ownerId para compatibilidade

  // ✅ Não bloqueia o modal: apenas alerta se props estão ausentes
  const missingProps =
    mode === "create" &&
    (defaultFarmId === undefined ||
      defaultOwnerId === undefined || // Compatibilidade
      defaultTod === undefined);

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
            defaultOwnerId={defaultOwnerId} // Compatibilidade
            defaultTod={defaultTod}
          />
        )}
      </div>
    </div>
  );
}
