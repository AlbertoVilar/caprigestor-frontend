import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../Hooks/usePermissions';

/**
 * Página de erro 403 - Acesso Proibido
 */
export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { tokenPayload, isAuthenticated } = useAuth();
  const permissions = usePermissions();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // Aqui você pode implementar um sistema de contato ou abrir um modal
    const email = 'suporte@caprilvilar.com';
    const subject = 'Solicitação de Acesso - Erro 403';
    const body = `Olá,\n\nEstou tentando acessar um recurso mas recebo erro 403.\n\nMeu usuário: ${tokenPayload?.sub || 'N/A'}\nMinha role: ${tokenPayload?.authorities?.join(', ') || 'N/A'}\n\nPor favor, verifiquem minhas permissões.\n\nObrigado!`;
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const getUserRoleDisplay = () => {
    if (!tokenPayload?.authorities || tokenPayload.authorities.length === 0) {
      return 'Usuário sem role definida';
    }
    
    const roleMap: Record<string, string> = {
      'ROLE_ADMIN': 'Administrador',
      'ROLE_OPERATOR': 'Operador',
      'ROLE_PUBLIC': 'Usuário Público'
    };
    
    return tokenPayload.authorities
      .map(role => roleMap[role] || role)
      .join(', ');
  };

  return (
    <div className="error-page forbidden-page">
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <span className="icon-large">⛔</span>
          </div>
          
          <div className="error-info">
            <h1 className="error-code">403</h1>
            <h2 className="error-title">Acesso Proibido</h2>
            <p className="error-description">
              Você não tem permissão para acessar este recurso. 
              Entre em contato com o administrador se acredita que isso é um erro.
            </p>
          </div>

          {isAuthenticated && tokenPayload && (
            <div className="user-info">
              <h3>Informações da sua conta:</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Usuário:</strong> {tokenPayload.sub}
                </div>
                <div className="info-item">
                  <strong>Perfil:</strong> {getUserRoleDisplay()}
                </div>
                <div className="info-item">
                  <strong>Status:</strong> 
                  <span className="status-badge active">Autenticado</span>
                </div>
              </div>
            </div>
          )}

          <div className="error-actions">
            <button 
              onClick={handleGoBack}
              className="btn btn-primary btn-large"
            >
              Voltar
            </button>
            
            <button 
              onClick={handleGoHome}
              className="btn btn-secondary btn-large"
            >
              Ir para Início
            </button>
            
            <button 
              onClick={handleContactSupport}
              className="btn btn-outline btn-large"
            >
              Solicitar Acesso
            </button>
          </div>

          <div className="error-help">
            <p>
              <strong>Por que isso aconteceu?</strong>
            </p>
            <ul>
              <li>Você não tem a permissão necessária para este recurso</li>
              <li>Sua role de usuário não permite esta ação</li>
              <li>O recurso pode ser restrito a proprietários ou administradores</li>
              <li>Suas permissões podem ter sido alteradas recentemente</li>
            </ul>
            
            <div className="help-actions">
              <p>
                <strong>O que você pode fazer:</strong>
              </p>
              <ul>
                <li>Verifique se você está logado com a conta correta</li>
                <li>Entre em contato com o administrador do sistema</li>
                <li>Solicite as permissões necessárias através do botão acima</li>
              </ul>
            </div>
          </div>

          {/* Informações técnicas para debug (apenas em desenvolvimento) */}
          {import.meta.env.DEV && (
            <details className="debug-info">
              <summary>Informações de Debug</summary>
              <pre>
                {JSON.stringify({
                  user: tokenPayload?.sub,
                  roles: tokenPayload?.authorities,
                  permissions: {
                    isAdmin: permissions.isAdmin,
                    isOperator: permissions.isOperator
                  },
                  timestamp: new Date().toISOString(),
                  url: window.location.href
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
