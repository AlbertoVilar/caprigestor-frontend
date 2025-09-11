// src/Components/Topbar/header-topbar/HeaderTopbar.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { logOut } from "../../../services/auth-service";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  const navigate = useNavigate();
  const { isAuthenticated, setTokenPayload, tokenPayload } = useAuth();

  function handleLogout() {
    logOut();
    setTokenPayload(undefined);
    window.location.replace("/fazendas");
  }

  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="modern-topbar">
      <div className="topbar-left">
        <div className="welcome-section">
          <h1 className="welcome-title">
            <span className="greeting">Bem-vindo ao</span>
            <span className="brand-name">CapriGestor</span>
          </h1>
          <div className="date-time-info">
            <span className="current-date">{currentDate}</span>
            <span className="current-time">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-actions">
          {/* Notifications */}
          <button className="notification-btn" title="Notificações">
            <i className="fa-solid fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>

          {/* Search */}
          <button className="search-btn" title="Buscar">
            <i className="fa-solid fa-search"></i>
          </button>

          {/* User Menu */}
          <div className="user-menu">
            {isAuthenticated ? (
              <div className="user-profile">
                <div className="user-avatar">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {tokenPayload?.name || 'Usuário'}
                  </span>
                  <span className="user-role">Administrador</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Sair">
                  <i className="fa-solid fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="login-btn"
                  onClick={() => navigate("/login")}
                >
                  <i className="fa-solid fa-sign-in-alt"></i>
                  Entrar
                </button>
                <button 
                  className="register-btn"
                  onClick={() => navigate("/fazendas/novo")}
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}