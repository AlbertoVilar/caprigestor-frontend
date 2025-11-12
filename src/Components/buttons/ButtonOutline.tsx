// src/Components/buttons/ButtonOutline.tsx
import { Link } from "react-router-dom";
import "../../index.css";
import "./ButtonOutline.css";

type ButtonOutlineProps = {
  to: string;
  label: string;
  icon?: string;
};

export default function ButtonOutline({ to, label, icon }: ButtonOutlineProps) {
  return (
    <Link to={to} className="btn-outline">
      {icon && <i className={icon}></i>}
      {label}
    </Link>
  );
}
