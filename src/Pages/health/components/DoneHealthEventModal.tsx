import { useEffect, useRef, useState } from "react";
import { Modal } from "../../../Components/ui/Modal";
import { Input } from "../../../Components/ui/Input";
import type { HealthEventDoneRequestDTO } from "../../../Models/HealthDTOs";

import { normalizePerformedAt, formatLocalDateTime } from "../healthHelpers";

interface DoneHealthEventModalProps {
  isOpen: boolean;
  eventTitle?: string;
  onClose: () => void;
  onConfirm: (payload: HealthEventDoneRequestDTO) => Promise<void> | void;
}

const buildLocalDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // Return yyyy-MM-ddThh:mm for datetime-local input
  return formatLocalDateTime(date).slice(0, 16);
};

const getCurrentLocalDateTime = () => buildLocalDateTime(new Date().toISOString());

export default function DoneHealthEventModal({
  isOpen,
  eventTitle,
  onClose,
  onConfirm
}: DoneHealthEventModalProps) {
  const performedAtInputRef = useRef<HTMLInputElement | null>(null);
  const [performedAt, setPerformedAt] = useState<string>("");
  const [isPerformedAtTouched, setIsPerformedAtTouched] = useState(false);
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{
    performedAt?: string;
    responsible?: string;
    notes?: string;
  }>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPerformedAt(getCurrentLocalDateTime());
      setIsPerformedAtTouched(false);
      setResponsible("");
      setNotes("");
      setErrors({});
      setGeneralError("");
      setTimeout(() => {
        performedAtInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const isValid = () => {
    const nextErrors: typeof errors = {};
    if (!performedAt) {
      nextErrors.performedAt = "Informe a data e hora da realização.";
    } else if (new Date(performedAt) > new Date()) {
      nextErrors.performedAt = "A data não pode ser futura.";
    }

    const trimmedResponsible = responsible.trim();
    if (!trimmedResponsible) {
      nextErrors.responsible = "Informe o responsável.";
    } else if (trimmedResponsible.length > 100) {
      nextErrors.responsible = "Máximo de 100 caracteres.";
    }

    if (notes.length > 1000) {
      nextErrors.notes = "Máximo de 1000 caracteres.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const footer = (
    <div className="health-modal-actions">
      <button type="button" className="health-btn health-btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
        Cancelar
      </button>
      <button
        type="button"
        className="health-btn health-btn-primary"
        onClick={async () => {
          if (!isValid()) return;
          setIsSubmitting(true);
          setGeneralError("");

          let finalDate: Date;
          const now = new Date();
          
          if (!isPerformedAtTouched) {
            // If user didn't change the date, use "now" but normalized to ensure clamp
            finalDate = normalizePerformedAt(now, now);
          } else {
            // Clamp to avoid "future date" error if user selected "today" but slightly ahead
            const selectedDate = new Date(performedAt);
            finalDate = normalizePerformedAt(selectedDate, now);
          }

          const payload: HealthEventDoneRequestDTO = {
            performedAt: formatLocalDateTime(finalDate),
            responsible: responsible.trim(),
            notes: notes.trim() || undefined
          };

          try {
            await onConfirm(payload);
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Erro ao marcar como realizado. Tente novamente.";
            setGeneralError(message);
          } finally {
            setIsSubmitting(false);
          }
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando..." : "Marcar como realizado"}
      </button>
    </div>
  );

  const modalTitle = eventTitle ? `Realizar ${eventTitle}` : "Marcar como realizado";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer} size="md">
      <div className="health-modal-field">
        <Input
          ref={performedAtInputRef}
          label="Data e hora da realização"
          type="datetime-local"
          value={performedAt}
          onChange={(event) => {
            setPerformedAt(event.target.value);
            setIsPerformedAtTouched(true);
          }}
          error={errors.performedAt}
          max={buildLocalDateTime(new Date().toISOString())}
        />
      </div>

      <div className="health-modal-field">
        <Input
          label="Responsável"
          type="text"
          value={responsible}
          onChange={(event) => setResponsible(event.target.value)}
          error={errors.responsible}
          maxLength={100}
        />
      </div>

      <div className="health-modal-field">
        <label className="health-modal-label" htmlFor="health-done-notes">
          Observações
        </label>
        <textarea
          id="health-done-notes"
          className="health-modal-textarea"
          value={notes}
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Opcional, máximo de 1000 caracteres"
        />
        <div className="health-modal-helper">
          <span>{notes.length}/1000 caracteres</span>
          {errors.notes && <span className="health-modal-error">{errors.notes}</span>}
        </div>
      </div>

      {generalError && <div className="health-modal-error">{generalError}</div>}
    </Modal>
  );
}
