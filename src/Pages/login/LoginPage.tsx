// src/Pages/login/LoginPage.tsx

import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAccessTokenPayload, loginRequest } from '../../services/auth-service';
import { useAuth } from '../../contexts/AuthContext';
import { getManagedFarmsPaginated } from '../../api/GoatFarmAPI/goatFarm';
import {
  buildFarmDashboardPath,
  buildManagedFarmsPath,
  resolveExplicitLoginDestination,
} from '../../utils/appRoutes';

import './login.css';
import { LoginForm } from '../../Components/login/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, tokenPayload, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await loginRequest({ email, password });
      const token = res?.data?.accessToken;
      if (!token) throw new Error('Token não encontrado na resposta');

      login(token);

      const locationState = location.state as { from?: unknown } | null;
      const explicitDestination = resolveExplicitLoginDestination(locationState?.from);
      if (explicitDestination) {
        navigate(explicitDestination, { replace: true });
        return;
      }

      const payload = getAccessTokenPayload();
      const authorities = payload?.authorities ?? [];
      if (authorities.includes('ROLE_ADMIN')) {
        navigate(buildManagedFarmsPath(), { replace: true });
        return;
      }

      if (authorities.includes('ROLE_FARM_OWNER') || authorities.includes('ROLE_OPERATOR')) {
        try {
          const managedPage = await getManagedFarmsPaginated(0, 2);
          if (managedPage.page.totalElements === 1 && managedPage.content[0]) {
            navigate(buildFarmDashboardPath(managedPage.content[0].id), { replace: true });
          } else {
            navigate(buildManagedFarmsPath(), { replace: true });
          }
        } catch {
          // Credentials succeeded; discovery failure belongs to the selector page.
          navigate(buildManagedFarmsPath(), { replace: true });
        }
        return;
      }

      navigate('/fazendas', { replace: true });
    } catch {
      setErr('Falha no login. Verifique usuario e senha.');
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
              Voce ja esta logado como{' '}
              <strong>{tokenPayload?.userName ?? tokenPayload?.user_name}</strong>.
            </p>
            <button type="button" className="btn-secondary" onClick={logout}>
              Sair para trocar de usuario
            </button>
          </div>
        )}

        <LoginForm
          handleSubmit={handleSubmit}
          username={email}
          setUsername={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          errorMessage={err}
        />

        <div className="login-footer">
          <a href="/forgot-password">Esqueci minha senha</a>
        </div>

        <div className="login-footer">
          <span>Não tem uma conta? </span>
          <a href="/fazendas/novo">Cadastre-se</a>
        </div>
      </div>
    </div>
  );
}
