import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import "./Modal.css";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  open,
  onClose,
  title,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer,
  className = "",
}) => {
  const isVisible = isOpen ?? open ?? false;
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isVisible || !closeOnEscape) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (shouldCloseModalOnEscape(event.key, closeOnEscape)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isVisible, closeOnEscape, onClose]);

  useEffect(() => {
    if (isVisible) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    previousActiveElement.current?.focus();
    return undefined;
  }, [isVisible]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const panelClasses = [
    "gf-modal__panel",
    `gf-modal__panel--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const modalContent = (
    <div className="gf-modal" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={panelClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="gf-modal__header">
            {title && (
              <h2 id={titleId} className="gf-modal__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="gf-modal__close"
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="gf-modal__body">{children}</div>

        {footer && <div className="gf-modal__footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export function shouldCloseModalOnEscape(
  key: string,
  closeOnEscape = true
) {
  return closeOnEscape && key === "Escape";
}

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmação",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "info",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmVariant =
    variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary";

  const footer = (
    <div className="gf-modal__actions">
      <Button variant="secondary" onClick={onClose}>
        {cancelText}
      </Button>
      <Button variant={confirmVariant} onClick={handleConfirm}>
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footer}>
      <p className="gf-modal__message">{message}</p>
    </Modal>
  );
};
