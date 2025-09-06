// src/components/forms/SignupForm.tsx

import React from 'react';

// 1. Definimos todas as props que o formulário precisa receber de sua página "mãe".
type SignupFormProps = {
  handleSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  errorMessage: string | null;
};

// 2. Este componente é "burro": ele apenas exibe a UI e chama as funções que recebe via props.
export function SignupForm({
  handleSubmit,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  errorMessage,
}: SignupFormProps) {
  return (
    // O formulário em si, usando as classes do seu CSS de login como base.
    <form className="login-form" onSubmit={handleSubmit}>
      <input
        className="login-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome completo"
        autoComplete="name"
        required
      />
      <input
        className="login-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu melhor e-mail"
        autoComplete="email"
        required
      />
      <input
        className="login-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Crie uma senha"
        autoComplete="new-password"
        required
      />
      <input
        className="login-input"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirme sua senha"
        autoComplete="new-password"
        required
      />

      {errorMessage && <div className="error">{errorMessage}</div>}

      <button
        type="submit"
        className="btn-primary" // Reutilizando a classe do seu botão de login
        disabled={loading}
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>
  );
}