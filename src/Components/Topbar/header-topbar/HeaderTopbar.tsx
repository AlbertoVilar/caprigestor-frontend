import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { logOut } from "../../../services/auth-service";
import { healthAPI } from "../../../api/GoatFarmAPI/health";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { farmId } = useParams<{ farmId: string }>();
  const { isAuthenticated, setTokenPayload, tokenPayload } = useAuth();
  const [alertCount, setAlertCount] = useState<number>(0);

  // Extract farmId from URL if not in params (e.g. if Topbar is outside Routes)
  const getFarmIdFromUrl = () => {
    if (farmId) return Number(farmId);
    const match = location.pathname.match(/\/goatfarms\/(\d+)/);
    return match ? Number(match[1]) : NaN;
  };

  const currentFarmId = getFarmIdFromUrl();

  useEffect(() => {
    if (!isNaN(currentFarmId)) {
      healthAPI.getAlerts(currentFarmId)
        .then(data => {
            const count = (data.overdueCount || 0) + (data.dueTodayCount || 0);
            setAlertCount(count);
        })
        .catch(err => {
            console.error("Failed to load alerts count", err);
            setAlertCount(0);
        });
    } else {
        setAlertCount(0);
    }
  }, [currentFarmId]);

  const handleNotificationClick = () => {
    if (!isNaN(currentFarmId)) {
        navigate(`/app/goatfarms/${currentFarmId}/health-agenda`);
    }
  };

  // Função para obter o nome da role em português
  const getUserRoleDisplay = () => {
    if (!tokenPayload?.authorities || tokenPayload.authorities.length === 0) {
      return 'Usuário';
    }
    
    const roleMap: Record<string, string> = {
      'ROLE_ADMIN': 'Administrador',
      'ROLE_FARM_OWNER': 'Proprietário',
      'ROLE_OPERATOR': 'Operador',
      'ROLE_PUBLIC': 'Visitante'
    };
    
    // Prioriza ROLE_ADMIN se existir, senão pega a primeira role
    const hasAdmin = tokenPayload.authorities.includes('ROLE_ADMIN');
    const primaryRole = hasAdmin ? 'ROLE_ADMIN' : tokenPayload.authorities[0];
    return roleMap[primaryRole] || primaryRole;
  };

  // Função para obter apenas o primeiro nome do usuário
  const getFirstName = () => {
    const fullName = tokenPayload?.userName || tokenPayload?.user_name || tokenPayload?.name || 'Usuário';
    return fullName.split(' ')[0];
  };

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
          <button className="notification-btn" title="Alertas Sanitários" onClick={handleNotificationClick}>
            <i className="fa-solid fa-bell"></i>
            {alertCount > 0 && <span className="notification-badge">{alertCount}</span>}
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
                    {getFirstName()}
                  </span>
                  <span className="user-role">{getUserRoleDisplay()}</span>
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
                  onClick={() => navigate("/registro")}
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
