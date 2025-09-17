// src/Pages/login/LoginPage.tsx

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '@/services/auth-service';
import { useAuth } from '@/contexts/AuthContext';

import './login.css';
import { LoginForm } from '@/Components/login/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, tokenPayload, login, logout } = useAuth();
  const [email, setEmail] = useState('admin@test.com'); // Valor padrão para teste
  const [password, setPassword] = useState('123456'); // Valor padrão para teste
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await loginRequest({ email, password });
      const token = res?.data?.access_token || res?.data?.accessToken;
      if (!token) throw new Error('Token não encontrado na resposta');

      login(token);

      const dest = localStorage.getItem('caprigestor_redirect_to') || '/fazendas';
      localStorage.removeItem('caprigestor_redirect_to');
      navigate(dest, { replace: true });
    } catch (error) {
      console.error(error);
      setErr('Falha no login. Verifique usuário e senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Entrar</h1>

        {isAuthenticated && (
          <div className="already-logged">
            <p>
              Você já está logado como{' '}
              <strong>{tokenPayload?.userName ?? tokenPayload?.user_name}</strong>.
            </p>
            <button type="button" className="btn-secondary" onClick={logout}>
              Sair para trocar de usuário
            </button>
          </div>
        )}

        {/* ✅ 2. O FORMULÁRIO ANTIGO FOI SUBSTITUÍDO POR ESTE COMPONENTE */}
        <LoginForm
          handleSubmit={handleSubmit}
          username={email}
          setUsername={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          errorMessage={err}
        />
        
        {/* Botão de teste para simular login */}
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>🧪 <strong>Modo Teste:</strong></p>
          <button 
            type="button" 
            className="btn-secondary"
            style={{ marginRight: '0.5rem' }}
            onClick={() => {
               // Simula seu token JWT exato com scope como string única
               const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbGJlcnRvdmlsYXIxQGdtYWlsLmNvbSIsInNjb3BlIjoiUk9MRV9PUEVSQVRPUiBST0xFX0FETUlOIiwiaXNzIjoiZ29hdGZhcm0tYXBpIiwibmFtZSI6IkFsYmVydG8gVmlsYXIiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTc1NzU3NjI5MywidXNlcklkIjoxLCJlbWFpbCI6ImFsYmVydG92aWxhcjFAZ21haWwuY29tIiwidXNlcl9uYW1lIjoiQWxiZXJ0byBWaWxhciJ9.mockSignature';
               login(mockToken);
               navigate('/fazendas');
             }}
          >
             🔑 Login como Alberto (ADMIN+OPERATOR)
           </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              // Simula um token JWT com role OPERATOR e userId=1
              const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJvcGVyYXRvciIsImF1dGhvcml0aWVzIjpbIlJPTEVfT1BFUkFUT1IiXSwidXNlcklkIjoxLCJ1c2VyRW1haWwiOiJvcGVyYXRvckB0ZXN0LmNvbSIsImV4cCI6OTk5OTk5OTk5OX0.mockSignature';
              login(mockToken);
              navigate('/fazendas');
            }}
          >
            👤 Login como OPERATOR
          </button>
        </div>

        <div className="login-footer">
          <span>Não tem uma conta? </span>
          <a href="/fazendas/novo">Cadastre-se</a>
        </div>
      </div>
    </div>
  );
}