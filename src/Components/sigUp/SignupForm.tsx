// src/components/forms/SignupForm.tsx

import React from 'react';

// 1. Definimos todas as props que o formulário precisa receber de sua página "mãe".
type SignupFormProps = {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  cpf: string;
  setCpf: (value: string) => void;
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
  cpf,
  setCpf,
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
        type="text"
        value={cpf}
        onChange={(e) => {
          // Aplica máscara de CPF: 000.000.000-00
          let valor = e.target.value.replace(/\D/g, ''); // Remove não numéricos
          if (valor.length <= 11) {
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
            valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            setCpf(valor);
          }
        }}
        placeholder="CPF (obrigatório) - 000.000.000-00"
        autoComplete="off"
        maxLength={14}
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
        className="btn-primary"
        disabled={loading}
      >
        {loading ? 'Criando conta...' : 'Criar Conta'}
      </button>
    </form>
  );
}