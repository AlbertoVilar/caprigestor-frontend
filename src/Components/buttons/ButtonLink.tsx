
import "./buttonlink.css";

import { Link } from "react-router-dom";
import "./buttonlink.css";

interface ButtonLinkProps {
  to: string;
  label: string;
}

export default function ButtonLink({ to, label }: ButtonLinkProps) {
  return (
    <Link to={to} className="btn-link">
      {label}
    </Link>
  );
}

