import { useEffect, useState } from "react";
import { Modal } from "../../../Components/ui/Modal";

interface CancelHealthEventModalProps {
  isOpen: boolean;
  eventTitle?: string;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void> | void;
}

export default function CancelHealthEventModal({
  isOpen,
  eventTitle,
  onClose,
  onConfirm
}: CancelHealthEventModalProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setError("");
      setGeneralError("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!notes.trim()) {
      setError("Informe um motivo.");
      return;
    }
    if (notes.trim().length > 255) {
      setError("Máximo de 255 caracteres.");
      return;
    }

    setError("");
    setGeneralError("");
    setIsSubmitting(true);

    try {
      await onConfirm(notes.trim());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao cancelar. Tente novamente.";
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="health-modal-actions">
      <button type="button" className="health-btn health-btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
        Voltar
      </button>
      <button
        type="button"
        className="health-btn health-btn-danger"
        onClick={handleConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cancelando..." : "Confirmar cancelamento"}
      </button>
    </div>
  );

  const modalTitle = eventTitle ? `Cancelar ${eventTitle}` : "Cancelar evento";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer} size="md">
      <div className="health-modal-field">
        <label className="health-modal-label" htmlFor="health-cancel-notes">
          Motivo
        </label>
        <textarea
          id="health-cancel-notes"
          className="health-modal-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={255}
          placeholder="Explique o motivo do cancelamento (máx. 255 caracteres)"
        />
        <div className="health-modal-helper">
          <span>{notes.length}/255</span>
          {error && <span className="health-modal-error">{error}</span>}
        </div>
      </div>

      {generalError && <div className="health-modal-error">{generalError}</div>}
    </Modal>
  );
}
