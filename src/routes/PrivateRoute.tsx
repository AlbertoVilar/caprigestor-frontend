import { useAuth } from "../contexts/AuthContext";
import { logOut } from "../services/auth-service";
import { useEffect } from "react";


export default function Logout() {
  const { setTokenPayload } = useAuth();

  useEffect(() => {
    try {
      logOut();
      setTokenPayload(undefined);
    } finally {
      // força rota pública após sair
      window.location.replace("/"); // ou "/fazendas"
    }
  }, [setTokenPayload]);

  return null;
}
