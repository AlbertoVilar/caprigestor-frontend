// src/components/forms/LoginForm.tsx

import React from 'react';

// Definimos as "props" que este componente receberá da página de Login
type LoginFormProps = {
  handleSubmit: (e: React.FormEvent) => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  errorMessage: string | null;
};

export function LoginForm({
  handleSubmit,
  username,
  setUsername,
  password,
  setPassword,
  loading,
  errorMessage,
}: LoginFormProps) {
  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <input
        className="login-input"
        type="text"
        value={username}
        autoComplete="username"
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Seu usuário"
        required
      />
      <input
        className="login-input"
        type="password"
        value={password}
        autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Sua senha"
        required
      />

      {errorMessage && <div className="error">{errorMessage}</div>}

      <button
        type="submit"
        className="btn-primary" // Certifique-se que esta classe está estilizada globalmente ou no seu login.css
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}