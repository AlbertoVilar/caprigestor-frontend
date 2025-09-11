import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de erro 401 - Não autorizado
 */
export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="error-page unauthorized-page">
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <span className="icon-large">🔒</span>
          </div>
          
          <div className="error-info">
            <h1 className="error-code">401</h1>
            <h2 className="error-title">Não Autorizado</h2>
            <p className="error-description">
              Sua sessão expirou ou você não está autenticado. 
              Por favor, faça login novamente para continuar.
            </p>
          </div>

          <div className="error-actions">
            <button 
              onClick={handleLogin}
              className="btn btn-primary btn-large"
            >
              Fazer Login
            </button>
            
            <button 
              onClick={handleLogout}
              className="btn btn-secondary btn-large"
            >
              Sair da Conta
            </button>
            
            <Link 
              to="/"
              className="btn btn-outline btn-large"
            >
              Ir para Início
            </Link>
          </div>

          <div className="error-help">
            <p>
              <strong>Por que isso aconteceu?</strong>
            </p>
            <ul>
              <li>Sua sessão pode ter expirado</li>
              <li>Você pode ter sido desconectado por inatividade</li>
              <li>Suas credenciais podem ter sido alteradas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;