import "./buttonCards.css";

interface ButtonCardProps {
  name: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

export default function ButtonCard({ name, className = "", type = "button", onClick, disabled = false }: ButtonCardProps) {
  return (
    <button className={`btn-card ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {name}
    </button>
  );
}
