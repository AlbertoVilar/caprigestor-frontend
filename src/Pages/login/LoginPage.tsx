import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CloseButton from "../../Components/buttons/CloseButton";
import ButtonPrimary from "../../Components/buttons/ButtonPrimary";

import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui futuramente: chamada para login
    console.log("Login com:", email, password);
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
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
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
