import "./FormStepButton.css"



interface Props {
  label: string;
  onClick: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export default function FormStepButton({ label, onClick, type = "button", disabled = false, className = "" }: Props) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`form-step-button ${className}`}
    >
      {label}
    </button>
  );
}
