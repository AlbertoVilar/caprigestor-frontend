import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { AxiosError } from "axios";

import { useAuth } from "../../contexts/AuthContext";
import { registerUser } from "../../services/auth-service";

// Reutilizando o mesmo CSS da página de login para manter a consistência visual
import "../login/login.css";
import { SignupForm } from "@/Components/sigUp/SignupForm";

export default function SignupPage() {
  // --- Hooks ---
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- State Management ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Logic ---
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    // Validação simples no frontend
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      // Chama a função do nosso serviço de API com o payload completo
      const response = await registerUser({
        name,
        username: email, // Usando o email como username
        email,
        password,
        confirmPassword,
      });

      // Acessando o token dentro de `response.data` (padrão do Axios)
      const token = response.data?.token;

      if (token) {
        toast.success(`Bem-vindo(a), ${name}! Conta criada com sucesso.`);
        login(token); // Faz o auto-login
        navigate("/fazendas/novo", { replace: true }); // Redireciona para o onboarding (criar fazenda)
      } else {
        // Fallback caso a API não retorne um token
        toast.info("Conta criada! Por favor, faça o login para continuar.");
        navigate("/login");
      }
      // ... dentro da função handleSubmit
    } catch (error) {
      let message = "Falha ao criar conta. Tente novamente."; // Mensagem padrão

      // Verificamos se o erro é um erro do Axios e se ele tem uma resposta do servidor
      if (error instanceof AxiosError && error.response?.data) {
        // Se for, pegamos a mensagem específica que o backend enviou
        message =
          error.response.data.message ||
          "Falha ao criar conta. O e-mail já pode estar em uso.";
      } else if (error instanceof Error) {
        // Se for um erro genérico do JavaScript, usamos a mensagem dele
        message = error.message;
      }

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // --- Rendering ---
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Criar Nova Conta</h1>

        {/* Renderiza o formulário visual, passando todo o estado e funções */}
        <SignupForm
          handleSubmit={handleSubmit}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
          errorMessage={errorMessage}
        />

        <div className="login-footer">
          <span>Já tem uma conta? </span>
          <a href="/login">Entre aqui</a>
        </div>
      </div>
    </div>
  );
}
