// src/Components/buttons/ButtonOutline.tsx
import "../../index.css";
import "./ButtonOutline.css";

type ButtonOutlineProps = {
  to: string;
  label: string;
  icon?: string;
};

export default function ButtonOutline({ to, label, icon }: ButtonOutlineProps) {
  return (
    <a href={to} className="btn-outline">
      {icon && <i className={icon}></i>}
      {label}
    </a>
  );
}
