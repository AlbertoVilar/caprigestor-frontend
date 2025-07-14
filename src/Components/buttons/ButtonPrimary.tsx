//Botton
// src/Components/buttons/ButtonPrimary.tsx
import React from "react";
import "./buttons.css";

interface ButtonPrimaryProps {
  label: string;
  onClick?: () => void;
  icon?: string; // Ex: 'fa-solid fa-search'
  type?: "button" | "submit" | "reset";
}

export default function ButtonPrimary({
  label,
  onClick,
  icon,
  type = "button",
}: ButtonPrimaryProps) {
  return (
    <button type={type} className="btn-primary" onClick={onClick}>
      {icon && <i className={icon} style={{ marginRight: "6px" }}></i>}
      {label}
    </button>
  );
}
