import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../Components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../Hooks/usePermissions';

import './errorPages.css';

type ForbiddenLocationState = {
  from?: string;
  requiredRoles?: string[];
  currentRoles?: string[];
};

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokenPayload, isAuthenticated } = useAuth();
  const permissions = usePermissions();

  const state = (location.state as ForbiddenLocationState | null) ?? null;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    const email = 'suporte@caprilvilar.com';
    const subject = 'Solicitação de acesso - erro 403';
    const body = `Olá,\n\nEstou tentando acessar um recurso, mas recebo erro 403.\n\nUsuário: ${tokenPayload?.sub || 'N/A'}\nPerfis atuais: ${tokenPayload?.authorities?.join(', ') || 'N/A'}\nRecurso: ${state?.from || window.location.pathname}\nPerfis exigidos: ${state?.requiredRoles?.join(', ') || 'N/A'}\n\nPor favor, verifiquem minhas permissões.\n\nObrigado!`;

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const roleMap: Record<string, string> = {
    ROLE_ADMIN: 'Administrador',
    ROLE_OPERATOR: 'Operador',
    ROLE_FARM_OWNER: 'Proprietário da fazenda',
    ROLE_PUBLIC: 'Usuário público',
  };

  const formatRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) {
      return 'Não informado';
    }

    return roles.map((role) => roleMap[role] || role).join(', ');
  };

  return (
    <div className="gf-error-page gf-error-page--forbidden">
      <div className="gf-error-shell">
        <div className="gf-error-card">
          <div className="gf-error-eyebrow">Acesso restrito</div>
          <div className="gf-error-header">
            <div className="gf-error-icon" aria-hidden="true">
              ⛔
            </div>
            <div className="gf-error-copy">
              <h1 className="gf-error-code">403</h1>
              <h2 className="gf-error-title">Acesso proibido</h2>
              <p className="gf-error-description">
                Você não tem permissão para acessar este recurso. Se acredita que isso é um erro,
                confirme o perfil usado ou solicite revisão de acesso.
              </p>
            </div>
          </div>

          {isAuthenticated && tokenPayload && (
            <section className="gf-error-account" aria-label="Informações da conta">
              <h3>Informações da sua conta</h3>
              <div className="gf-error-account-grid">
                <div className="gf-error-account-item">
                  <span className="gf-error-account-label">Usuário</span>
                  <strong>{tokenPayload.sub}</strong>
                </div>
                <div className="gf-error-account-item">
                  <span className="gf-error-account-label">Perfis atuais</span>
                  <strong>{formatRoles(tokenPayload.authorities)}</strong>
                </div>
                <div className="gf-error-account-item">
                  <span className="gf-error-account-label">Status</span>
                  <span className="gf-status-badge gf-status-badge--active">Autenticado</span>
                </div>
              </div>
            </section>
          )}

          {(state?.from || state?.requiredRoles?.length) && (
            <section className="gf-error-account" aria-label="Contexto do bloqueio">
              <h3>Contexto do bloqueio</h3>
              <div className="gf-error-account-grid gf-error-account-grid--context">
                <div className="gf-error-account-item">
                  <span className="gf-error-account-label">Recurso</span>
                  <strong>{state?.from || window.location.pathname}</strong>
                </div>
                <div className="gf-error-account-item">
                  <span className="gf-error-account-label">Perfis exigidos</span>
                  <strong>{formatRoles(state?.requiredRoles)}</strong>
                </div>
              </div>
            </section>
          )}

          <div className="gf-error-actions">
            <Button onClick={handleGoBack} variant="primary" size="lg">
              Voltar
            </Button>
            <Button onClick={handleGoHome} variant="secondary" size="lg">
              Ir para o início
            </Button>
            <Button onClick={handleContactSupport} variant="outline" size="lg">
              Solicitar acesso
            </Button>
          </div>

          <div className="gf-error-panels">
            <section className="gf-error-panel">
              <h3>Por que isso aconteceu?</h3>
              <ul>
                <li>Você não tem a permissão necessária para este recurso.</li>
                <li>Seu perfil atual não cobre esta ação.</li>
                <li>O recurso pode ser restrito a proprietários, operadores ou administradores.</li>
                <li>Suas permissões podem ter sido alteradas recentemente.</li>
              </ul>
            </section>

            <section className="gf-error-panel">
              <h3>O que você pode fazer</h3>
              <ul>
                <li>Confirme se está logado com a conta correta.</li>
                <li>Volte para a tela anterior e tente acessar pelo fluxo normal.</li>
                <li>Solicite revisão de acesso se você deveria ter essa permissão.</li>
              </ul>
            </section>
          </div>

          {import.meta.env.DEV && (
            <details className="gf-error-debug">
              <summary>Informações de debug</summary>
              <pre>
                {JSON.stringify(
                  {
                    user: tokenPayload?.sub,
                    currentRoles: tokenPayload?.authorities,
                    requiredRoles: state?.requiredRoles,
                    from: state?.from,
                    permissions: {
                      isAdmin: permissions.isAdmin(),
                      isOperator: permissions.isOperator(),
                      isFarmOwner: permissions.isFarmOwner(),
                    },
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
