// src/components/buttons/ButtonLink.tsx

import { Link } from "react-router-dom";
import "./buttonlink.css"

interface ButtonLinkProps {
  to: string;
  label: string;
  className?: string;
}

export default function ButtonLink({
  to,
  label,
  className = "btn-link", // <- garante estilo padrão
}: ButtonLinkProps) {
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  );
}
