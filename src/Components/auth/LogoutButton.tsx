import { useAuth } from "../../contexts/AuthContext";
import ButtonLink from "../buttons/ButtonLink";

type Props = { className?: string };

export default function AuthActions({ className = "" }: Props) {
  const { isAuthenticated } = useAuth();

  // Só mostra algo se estiver logado
  if (!isAuthenticated) return null;

  return (
    <div className={`auth-actions ${className}`}>
      <ButtonLink to="/logout" label="Sair" className="btn-link btn-logout" />
    </div>
  );
}
