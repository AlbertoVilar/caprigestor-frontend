import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ButtonCard from "@/Components/buttons/ButtonCard";

export default function LogoutButton({
  className = "btn-outline",
  label = "Sair",
}: { className?: string; label?: string }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <ButtonCard
      name={label}
      className={className}
      onClick={() => {
        logout();
        navigate("/login", { replace: true });
      }}
    />
  );
}
