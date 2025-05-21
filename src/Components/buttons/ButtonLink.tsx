
import "./buttonlink.css";

interface ButtonLinkProps {
  to: string;
  label: string;
}

export default function ButtonLink({ to, label }: ButtonLinkProps) {
  return (
    <a className="btn-link" href={to}>
      {label}
    </a>
  );
}
