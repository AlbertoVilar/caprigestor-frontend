import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout(); // limpa token + contexto
  }, [logout]);

  return <Navigate to="/login" replace />;
}
