// src/Components/Topbar/header-topbar/HeaderTopbar.tsx
import { useNavigate } from "react-router-dom";
import ButtonPrimary from "../../buttons/ButtonPrimary";
import ButtonOutline from "../../buttons/ButtonOutline";
import { useAuth } from "../../../contexts/AuthContext";
import { logOut } from "../../../services/auth-service";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  const navigate = useNavigate();
  // ✅ Note que não precisamos mais do tokenPayload aqui
  const { isAuthenticated, setTokenPayload } = useAuth();

  // ✅ Nossa função de logout correta
  function handleLogout() {
    logOut();
    setTokenPayload(undefined);
    window.location.replace("/fazendas"); // ou para "/" se preferir
  }

  return (
    <header className="topbar">
      <h1>Bem-vindo ao CapriGestor</h1>

      <div className="button-group-into">
        {/* Você pode adicionar o "Olá, usuário" de volta se quiser, 
            só precisará pegar o tokenPayload do useAuth() novamente */}

        <ButtonPrimary
          label={isAuthenticated ? "Sair" : "Entrar"}
          icon={isAuthenticated ? "fa-solid fa-sign-out-alt" : "fa-solid fa-sign-in-alt"}
          onClick={() => (isAuthenticated ? handleLogout() : navigate("/login"))}
        />

        {/* ✅ BOTÃO RESTAURADO AQUI */}
        {!isAuthenticated && (
          <ButtonOutline
            to="/fazendas/novo"
            label="Cadastrar"
            icon="fa-solid fa-user-plus"
          />
        )}
      </div>
    </header>
  );
}