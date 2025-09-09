import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../contexts/AuthContext";
import { registerUser } from "../../services/auth-service";

// Reutilizando o mesmo CSS da página de login para manter a consistência visual
import "../login/login.css";
import { SignupForm } from "../../Components/sigUp/SignupForm";

export default function SignupPage() {
  // --- Hooks ---
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- State Management ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Manipula o envio do formulário de cadastro
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // 🛡️ Proteção contra envio duplo
    if (loading) {
      console.log('⚠️ Tentativa de envio duplo bloqueada - formulário já está sendo processado');
      return;
    }
    
    setErrorMessage(null);
    setLoading(true);

    try {
      // Validações frontend
      if (!name.trim() || name.trim().length < 2 || name.trim().length > 100) {
        throw new Error('Nome deve ter entre 2 e 100 caracteres');
      }

      if (!email.trim() || !email.includes('@')) {
        throw new Error('Email é obrigatório e deve ter formato válido');
      }

      const cpfLimpo = cpf.replace(/\D/g, '');
      if (!cpfLimpo || cpfLimpo.length !== 11) {
        throw new Error('CPF é obrigatório e deve ter exatamente 11 dígitos');
      }

      if (!password || password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      if (password !== confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      // Prepara dados do formulário
      const formData = {
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        cpf: cpfLimpo,
        roles: ['ROLE_OPERATOR']
      };

      console.log('🔍 PAYLOAD COMPLETO ANTES DO ENVIO:');
      console.log('📋 Dados do formulário:', JSON.stringify(formData, null, 2));
      console.log('📧 Email específico:', formData.email);
      console.log('📄 CPF específico:', formData.cpf);
      console.log('👤 Nome específico:', formData.name);
      console.log('🔑 ConfirmPassword específico:', formData.confirmPassword);

      // Chama o serviço de registro
      const response = await registerUser(formData);
      
      console.log('✅ RESPOSTA DO SERVIDOR:', response);

      // Verifica se há token na resposta
      const token = response.data?.token;
      if (token) {
        toast.success(`Bem-vindo(a), ${name}! Conta criada com sucesso.`);
        login(token);
        navigate('/fazendas/novo', { replace: true });
      } else {
        toast.info('Conta criada! Por favor, faça o login para continuar.');
        navigate('/login');
      }

    } catch (error: any) {
       // Usa a mensagem de erro já tratada pelo serviço
       const mensagemErro = error.message || 'Falha ao criar conta. Tente novamente.';
       
       setErrorMessage(mensagemErro);
       toast.error(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

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
          cpf={cpf}
          setCpf={setCpf}
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
