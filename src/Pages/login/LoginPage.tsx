import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CloseButton from "../../Components/buttons/CloseButton";
import ButtonPrimary from "../../Components/buttons/ButtonPrimary";

import { loginRequest, saveAccessToken, getAccessTokenPayload } from "../../services/auth-service";
import { useAuth } from "../../contexts/AuthContext";

import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { setTokenPayload } = useAuth();

  const handleClose = () => {
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await loginRequest({ username: email, password });

      // 1. Salva o token
      saveAccessToken(response.data.access_token);

      // 2. Atualiza o contexto
      const payload = getAccessTokenPayload();
      setTokenPayload(payload);

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("E-mail ou senha inválidos!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <CloseButton onClick={handleClose} />

        <h1 className="login-title">CapriGestor</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <ButtonPrimary type="submit" label="Entrar" icon="fa-solid fa-sign-in-alt" />
        </form>

        <p className="login-footer">
          Ainda não tem uma conta? <a href="/fazendas/novo">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}
