import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Página de erro 500 - Erro do Servidor
 */
export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

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

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReportIssue = () => {
    const email = 'suporte@caprilvilar.com';
    const subject = 'Erro 500 - Problema no Servidor';
    const body = `Olá,\n\nEncontrei um erro 500 no sistema.\n\nURL: ${window.location.href}\nHorário: ${new Date().toLocaleString('pt-BR')}\nNavegador: ${navigator.userAgent}\n\nDescrição do que estava fazendo:\n[Descreva aqui o que você estava fazendo quando o erro ocorreu]\n\nObrigado!`;
    
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="error-page server-error-page">
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">
            <span className="icon-large">🔧</span>
          </div>
          
          <div className="error-info">
            <h1 className="error-code">500</h1>
            <h2 className="error-title">Erro do Servidor</h2>
            <p className="error-description">
              Ops! Algo deu errado no nosso servidor. 
              Nossa equipe foi notificada e está trabalhando para resolver o problema.
            </p>
          </div>

          <div className="error-actions">
            <button 
              onClick={handleRefresh}
              className="btn btn-primary btn-large"
            >
              🔄 Tentar Novamente
            </button>
            
            <button 
              onClick={handleGoBack}
              className="btn btn-secondary btn-large"
            >
              ← Voltar
            </button>
            
            <button 
              onClick={handleGoHome}
              className="btn btn-outline btn-large"
            >
              🏠 Ir para Início
            </button>
            
            <button 
              onClick={handleReportIssue}
              className="btn btn-outline btn-large"
            >
              📧 Reportar Problema
            </button>
          </div>

          <div className="error-help">
            <p>
              <strong>O que aconteceu?</strong>
            </p>
            <ul>
              <li>Nosso servidor encontrou um problema inesperado</li>
              <li>Pode ser um problema temporário de conectividade</li>
              <li>O serviço pode estar em manutenção</li>
              <li>Houve uma falha interna no sistema</li>
            </ul>
            
            <div className="help-actions">
              <p>
                <strong>O que você pode fazer:</strong>
              </p>
              <ul>
                <li>Aguarde alguns minutos e tente novamente</li>
                <li>Verifique sua conexão com a internet</li>
                <li>Limpe o cache do seu navegador</li>
                <li>Entre em contato conosco se o problema persistir</li>
              </ul>
            </div>
          </div>

          <div className="error-status">
            <div className="status-item">
              <strong>Status do Sistema:</strong>
              <span className="status-indicator checking">Verificando...</span>
            </div>
            <div className="status-item">
              <strong>Horário do Erro:</strong>
              <span>{new Date().toLocaleString('pt-BR')}</span>
            </div>
            <div className="status-item">
              <strong>ID da Sessão:</strong>
              <span className="session-id">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </div>

          {/* Informações técnicas para debug (apenas em desenvolvimento) */}
          {import.meta.env.DEV && (
            <details className="debug-info">
              <summary>Informações Técnicas</summary>
              <pre>
                {JSON.stringify({
                  timestamp: new Date().toISOString(),
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                  referrer: document.referrer,
                  viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                  }
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerErrorPage;
