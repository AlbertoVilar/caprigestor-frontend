import { FormEvent, useState } from 'react';
import { requestPasswordReset } from '../../services/auth-service';
import '../login/login.css';

const NEUTRAL_MESSAGE = 'Se existir uma conta com esse email, enviaremos um link de redefinicao.';
const GENERIC_ERROR = 'Nao foi possivel processar sua solicitacao agora. Tente novamente em instantes.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response?.data?.message || NEUTRAL_MESSAGE);
    } catch (requestError) {
      console.error(requestError);
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Esqueci minha senha</h1>
        <p className="login-footer">
          Informe seu email. Se ele existir no sistema, enviaremos um link de redefinicao.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Seu email"
            required
          />

          {message && <div className="already-logged"><p>{message}</p></div>}
          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/login">Voltar para o login</a>
        </div>
      </div>
    </div>
  );
}
