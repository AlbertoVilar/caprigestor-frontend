// src/Components/debug/AuthDebug.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAccessToken, getAccessTokenPayload } from '../../services/auth-service';
import { jwtDecode } from 'jwt-decode';

export const AuthDebug: React.FC = () => {
  const { tokenPayload, isAuthenticated } = useAuth();
  const rawToken = getAccessToken();
  const rawPayload = getAccessTokenPayload();

  let decodedToken: Record<string, unknown> | null = null;
  if (rawToken) {
    try {
      decodedToken = jwtDecode<Record<string, unknown>>(rawToken);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '15px', 
      borderRadius: '8px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Debug de Autenticação</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {isAuthenticated ? '✅ Autenticado' : '❌ Não autenticado'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Token existe:</strong> {rawToken ? '✅ Sim' : '❌ Não'}
      </div>

      {tokenPayload && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Payload do Context:</strong>
          <pre style={{ background: '#f5f5f5', padding: '5px', margin: '5px 0' }}>
            {JSON.stringify(tokenPayload, null, 2)}
          </pre>
        </div>
      )}

      {rawPayload && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Payload Raw (Service):</strong>
          <pre style={{ background: '#f0f8ff', padding: '5px', margin: '5px 0' }}>
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </div>
      )}

      {decodedToken && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Token Decodificado Direto:</strong>
          <pre style={{ background: '#fff5f5', padding: '5px', margin: '5px 0' }}>
            {JSON.stringify(decodedToken, null, 2)}
          </pre>
        </div>
      )}

      {tokenPayload?.authorities && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Authorities:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {tokenPayload.authorities.map((auth, index) => (
              <li key={index} style={{ color: auth.includes('OPERATOR') ? 'green' : 'blue' }}>
                {auth}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AuthDebug;
