import "./buttonCards.css";
import type { MouseEventHandler } from "react";

interface ButtonCardProps {
  name: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export default function ButtonCard({ name, className = "", type = "button", onClick, disabled = false }: ButtonCardProps) {
  return (
    <button className={`btn-card ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {name}
    </button>
  );
}
