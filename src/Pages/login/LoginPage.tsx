import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "@/services/auth-service"; // ou "@/api/AuthAPI/auth" se seu path for esse
import { useAuth } from "@/contexts/AuthContext";
import "./login.css"; // opcional

export default function LoginPage() {
  const { isAuthenticated, tokenPayload, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await loginRequest({ username, password });
      const token =
        res?.data?.access_token || res?.data?.accessToken || res?.data?.token;
      if (!token) throw new Error("Token não encontrado na resposta");

      login(token); // salva no localStorage e atualiza contexto

      // redireciona para o destino que o guard salvou ou para uma rota padrão
      const dest = localStorage.getItem("caprigestor_redirect_to") || "/fazendas";
      localStorage.removeItem("caprigestor_redirect_to");
      navigate(dest, { replace: true });
    } catch (error) {
      console.error(error);
      setErr("Falha no login. Verifique usuário e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Entrar</h1>

      {/* Se já estiver logado, mostra banner e opção de sair para trocar usuário */}
      {isAuthenticated && (
        <div className="already-logged">
          <p>
            Você já está logado como{" "}
            <strong>{tokenPayload?.userName ?? tokenPayload?.user_name}</strong>.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              logout();
            }}
          >
            Sair para trocar de usuário
          </button>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Usuário
          <input
            type="text"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="seu usuário"
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="sua senha"
          />
        </label>

        {err && <div className="error">{err}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
