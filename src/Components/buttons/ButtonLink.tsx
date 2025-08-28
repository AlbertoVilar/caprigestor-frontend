import { Link } from "react-router-dom";
import "./buttonlink.css";

interface ButtonLinkProps {
  to: string;
  label: string;
  className?: string;
  replace?: boolean;
  state?: unknown; // permite passar state (ex.: { goat })
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export default function ButtonLink({
  to,
  label,
  className = "btn-link",
  replace = false,
  state,
  target,
  rel,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={className}
      replace={replace}
      state={state}
      target={target}
      rel={rel}
    >
      {label}
    </Link>
  );
}
