import { useEffect, useState } from "react";
import { Modal } from "../../../Components/ui/Modal";

interface ReopenHealthEventModalProps {
  isOpen: boolean;
  eventTitle?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function ReopenHealthEventModal({
  isOpen,
  eventTitle,
  onClose,
  onConfirm
}: ReopenHealthEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await onConfirm();
    } catch {
      setError("Erro ao reabrir evento. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="health-modal-actions">
      <button 
        type="button" 
        className="health-btn health-btn-outline-secondary" 
        onClick={onClose} 
        disabled={isSubmitting}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="health-btn health-btn-primary"
        onClick={handleConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Reabrindo..." : "Reabrir evento"}
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Reabrir evento?" 
      footer={footer} 
      size="sm"
    >
      <div className="health-modal-content">
        <p>
          O evento <strong>{eventTitle}</strong> voltará para o status <strong>AGENDADO</strong> e poderá ser editado ou cancelado novamente.
        </p>
        <p className="health-text-muted">
          A data de realização será limpa.
        </p>
        {error && <div className="health-modal-error">{error}</div>}
      </div>
    </Modal>
  );
}
