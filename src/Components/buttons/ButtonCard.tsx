import "./buttonCards.css";

interface ButtonCardProps {
  name: string;
  className?: string;
  type?: "button" | "submit" | "reset"; // permite uso como botão de formulário
  onClick?: () => void;
}

export default function ButtonCard({ name, className = "", type = "button", onClick }: ButtonCardProps) {
  return (
    <button className={`btn-card ${className}`} type={type} onClick={onClick}>
      {name}
    </button>
  );
}
