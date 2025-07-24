// src/Components/buttons/CloseButton.tsx
import "./CloseButton.css";

interface CloseButtonProps {
  onClick: () => void;
  position?: "absolute" | "fixed"; // permite flexibilidade
}

export default function CloseButton({ onClick, position = "absolute" }: CloseButtonProps) {
  return (
    <button
      className={`close-button ${position}`}
      onClick={onClick}
      aria-label="Fechar"
    >
      <i className="fas fa-times"></i>
    </button>
  );
}
