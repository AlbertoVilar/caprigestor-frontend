import { FormEvent, useMemo, useState } from 'react';
import { confirmPasswordReset } from '../../services/auth-service';
import '../login/login.css';

const INVALID_TOKEN_MESSAGE = 'Link de redefinicao invalido. Solicite um novo email.';
const GENERIC_ERROR = 'Nao foi possivel redefinir a senha agora. Tente novamente em instantes.';

function extractApiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
      message?: string;
    };

    const responseMessage = candidate.response?.data?.message;
    if (responseMessage) return responseMessage;

    const nestedMessage = candidate.response?.data?.errors?.[0]?.message;
    if (nestedMessage) return nestedMessage;

    if (candidate.message) return candidate.message;
  }

  return GENERIC_ERROR;
}

export default function ResetPasswordPage() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = searchParams.get('token')?.trim() || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(token ? null : INVALID_TOKEN_MESSAGE);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !token) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await confirmPasswordReset({ token, newPassword, confirmPassword });
      setMessage(response?.data?.message || 'Senha redefinida com sucesso.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      console.error(requestError);
      setError(extractApiMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Redefinir senha</h1>
        <p className="login-footer">
          Defina uma nova senha para concluir a recuperacao da sua conta.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nova senha"
            required
            disabled={!token || loading}
          />
          <input
            className="login-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirme a nova senha"
            required
            disabled={!token || loading}
          />

          {message && <div className="already-logged"><p>{message}</p></div>}
          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={!token || loading}>
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/login">Voltar para o login</a>
        </div>
      </div>
    </div>
  );
}
