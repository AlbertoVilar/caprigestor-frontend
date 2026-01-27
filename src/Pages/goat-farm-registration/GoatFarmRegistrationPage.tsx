// src/pages/goat-farm-registration/GoatFarmRegistrationPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmService } from '../../services/FarmService';
import { 
  GoatFarmFullRequestDTO
} from '../../types/goat-farm.types';
import {
  isValidCPF,
  isValidCEP,
  isValidDDD,
  isValidPhoneNumber,
  isValidEmail,
  isValidName,
  passwordsMatch
} from '../../utils/validation-utils';

// Importando CSS
import './GoatFarmRegistrationPage.css';
import './WizardStyles.css';

// Tipos para as etapas do wizard
interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Dados do Usuário', description: 'Nome, email, CPF e senha', icon: '👤' },
  { id: 2, title: 'Endereço', description: 'CEP, rua, bairro, cidade', icon: '🏠' },
  { id: 3, title: 'Telefone', description: 'DDD e número', icon: '📱' },
  { id: 4, title: 'Fazenda', description: 'Nome da fazenda', icon: '🐐' }
];

export default function GoatFarmRegistrationPage() {
  // --- Hooks ---
  const navigate = useNavigate();

  // --- Wizard State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- Form Data State ---
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: ''
  });

  const [addressData, setAddressData] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil'
  });

  const [phoneData, setPhoneData] = useState({
    ddd: '',
    number: ''
  });

  const [farmData, setFarmData] = useState({
    name: '',
    tod: ''
  });

  // --- Funções de Validação por Etapa ---
  const validateUserData = (): string[] => {
    const errors: string[] = [];

    if (!userData.name.trim()) {
      errors.push('Nome é obrigatório');
    } else if (!isValidName(userData.name)) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!userData.email.trim()) {
      errors.push('Email é obrigatório');
    } else if (!isValidEmail(userData.email)) {
      errors.push('Email deve ter um formato válido');
    }

    if (!userData.cpf.trim()) {
      errors.push('CPF é obrigatório');
    } else if (!isValidCPF(userData.cpf)) {
      errors.push('CPF deve ter 11 dígitos numéricos válidos');
    }

    if (!userData.password.trim()) {
      errors.push('Senha é obrigatória');
    } else if (userData.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (!passwordsMatch(userData.password, userData.confirmPassword)) {
      errors.push('Senhas não coincidem');
    }

    return errors;
  };

  const validateAddressData = (): string[] => {
    const errors: string[] = [];

    if (!addressData.street.trim()) {
      errors.push('Rua é obrigatória');
    }

    if (!addressData.neighborhood.trim()) {
      errors.push('Bairro é obrigatório');
    }

    if (!addressData.city.trim()) {
      errors.push('Cidade é obrigatória');
    }

    if (!addressData.state.trim()) {
      errors.push('Estado é obrigatório');
    }

    if (!addressData.zipCode.trim()) {
      errors.push('CEP é obrigatório');
    } else if (!isValidCEP(addressData.zipCode)) {
      errors.push('CEP deve estar no formato XXXXX-XXX');
    }

    return errors;
  };

  const validatePhoneData = (): string[] => {
    const errors: string[] = [];

    if (!phoneData.ddd.trim()) {
      errors.push('DDD é obrigatório');
    } else if (!isValidDDD(phoneData.ddd)) {
      errors.push('DDD deve ter 2 dígitos válidos');
    }

    if (!phoneData.number.trim()) {
      errors.push('Número é obrigatório');
    } else if (!isValidPhoneNumber(phoneData.number)) {
      errors.push('Número deve ter 8 ou 9 dígitos');
    }

    return errors;
  };

  const validateFarmData = (): string[] => {
    const errors: string[] = [];

    if (!farmData.name.trim()) {
      errors.push('Nome da fazenda é obrigatório');
    } else if (!isValidName(farmData.name)) {
      errors.push('Nome da fazenda deve ter pelo menos 2 caracteres');
    }

    return errors;
  };

  // --- Funções de Navegação do Wizard ---
  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return validateUserData().length === 0;
      case 2: return validateAddressData().length === 0;
      case 3: return validatePhoneData().length === 0;
      case 4: return validateFarmData().length === 0;
      default: return false;
    }
  };

  // --- Submissão Sequencial ---
  const handleStepSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      switch (currentStep) {
        case 1: // Validar usuário
          const userErrors = validateUserData();
          if (userErrors.length > 0) {
            setErrorMessage(userErrors.join(', '));
            return;
          }
          nextStep();
          break;

        case 2: // Validar endereço
          const addressErrors = validateAddressData();
          if (addressErrors.length > 0) {
            setErrorMessage(addressErrors.join(', '));
            return;
          }
          nextStep();
          break;

        case 3: // Validar telefone
          const phoneErrors = validatePhoneData();
          if (phoneErrors.length > 0) {
            setErrorMessage(phoneErrors.join(', '));
            return;
          }
          nextStep();
          break;

        case 4: // Criar fazenda (cadastro completo)
          const farmErrors = validateFarmData();
          if (farmErrors.length > 0) {
            setErrorMessage(farmErrors.join(', '));
            return;
          }

          const payload: GoatFarmFullRequestDTO = {
            farm: {
              name: farmData.name.trim(),
              tod: farmData.tod?.trim()
            },
            user: {
              name: userData.name.trim(),
              email: userData.email.trim(),
              cpf: userData.cpf.replace(/\D/g, ''),
              password: userData.password,
              confirmPassword: userData.confirmPassword
            },
            address: {
              street: addressData.street.trim(),
              neighborhood: addressData.neighborhood.trim(),
              city: addressData.city.trim(),
              state: addressData.state.trim().toUpperCase(),
              zipCode: addressData.zipCode.replace(/\D/g, ''),
              country: addressData.country.trim()
            },
            phones: [
              {
                ddd: phoneData.ddd.replace(/\D/g, ''),
                number: phoneData.number.replace(/\D/g, '')
              }
            ]
          };

          const farmResponse = await FarmService.createFullFarm(payload);
          
          console.log('✅ Fazenda criada:', farmResponse);
          setSuccessMessage('🎉 Fazenda cadastrada com sucesso! Redirecionando...');
          
          // Redirecionar após sucesso
          setTimeout(() => {
            navigate('/fazendas');
          }, 3000);
          break;
      }
    } catch (error: any) {
      console.error('❌ Erro na etapa:', error);
      setErrorMessage(error?.message || 'Erro interno do servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // --- Reset do Wizard ---
  const resetWizard = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setUserData({
      name: '',
      email: '',
      cpf: '',
      password: '',
      confirmPassword: ''
    });
    setAddressData({
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil'
    });
    setPhoneData({
      ddd: '',
      number: ''
    });
    setFarmData({
      name: '',
      tod: ''
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // --- Renderização do Wizard ---
  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
           <div className="wizard-step">
             <div className="d-flex align-items-center mb-4">
               <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '24px'}}>
                 👤
               </div>
               <div>
                 <h3 className="mb-1 text-primary fw-bold">Dados do Usuário</h3>
                 <p className="text-muted mb-0">Informações pessoais e credenciais de acesso</p>
               </div>
             </div>
             
             <div className="row g-4">
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="userName"
                     value={userData.name}
                     onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                     placeholder="Digite o nome completo"
                     required
                   />
                   <label htmlFor="userName"><i className="fas fa-user me-2"></i>Nome Completo *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="email"
                     className="form-control form-control-lg"
                     id="userEmail"
                     value={userData.email}
                     onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                     placeholder="Digite o email"
                     required
                   />
                   <label htmlFor="userEmail"><i className="fas fa-envelope me-2"></i>Email *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="userCpf"
                     value={userData.cpf}
                     onChange={(e) => setUserData(prev => ({ ...prev, cpf: e.target.value }))}
                     placeholder="000.000.000-00"
                     maxLength={14}
                     required
                   />
                   <label htmlFor="userCpf"><i className="fas fa-id-card me-2"></i>CPF *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="password"
                     className="form-control form-control-lg"
                     id="userPassword"
                     value={userData.password}
                     onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                     placeholder="Mínimo 6 caracteres"
                     minLength={6}
                     required
                   />
                   <label htmlFor="userPassword"><i className="fas fa-lock me-2"></i>Senha *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="password"
                     className="form-control form-control-lg"
                     id="userConfirmPassword"
                     value={userData.confirmPassword}
                     onChange={(e) => setUserData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                     placeholder="Repita a senha"
                     required
                   />
                   <label htmlFor="userConfirmPassword"><i className="fas fa-lock me-2"></i>Confirmar Senha *</label>
                 </div>
               </div>
             </div>
           </div>
         );
        
      case 2:
         return (
           <div className="wizard-step">
             <div className="d-flex align-items-center mb-4">
               <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '24px'}}>
                 🏠
               </div>
               <div>
                 <h3 className="mb-1 text-success fw-bold">Endereço</h3>
                 <p className="text-muted mb-0">Localização completa para entrega e contato</p>
               </div>
             </div>
             
             <div className="row g-4">
               <div className="col-md-4">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressPostalCode"
                     value={addressData.zipCode}
                     onChange={(e) => setAddressData(prev => ({ ...prev, zipCode: e.target.value }))}
                     placeholder="00000-000"
                     maxLength={9}
                     required
                   />
                   <label htmlFor="addressPostalCode"><i className="fas fa-map-pin me-2"></i>CEP *</label>
                 </div>
               </div>
               
               <div className="col-md-8">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressStreet"
                     value={addressData.street}
                     onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                     placeholder="Nome da rua, número"
                     required
                   />
                   <label htmlFor="addressStreet"><i className="fas fa-road me-2"></i>Rua *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressNeighborhood"
                     value={addressData.neighborhood}
                     onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                     placeholder="Nome do bairro"
                     required
                   />
                   <label htmlFor="addressNeighborhood"><i className="fas fa-building me-2"></i>Bairro *</label>
                 </div>
               </div>
               
               <div className="col-md-4">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressCity"
                     value={addressData.city}
                     onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                     placeholder="Nome da cidade"
                     required
                   />
                   <label htmlFor="addressCity"><i className="fas fa-city me-2"></i>Cidade *</label>
                 </div>
               </div>
               
               <div className="col-md-2">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressState"
                     value={addressData.state}
                     onChange={(e) => setAddressData(prev => ({ ...prev, state: e.target.value }))}
                     placeholder="UF"
                     maxLength={2}
                     required
                   />
                   <label htmlFor="addressState"><i className="fas fa-flag me-2"></i>UF *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="addressCountry"
                     value={addressData.country}
                     onChange={(e) => setAddressData(prev => ({ ...prev, country: e.target.value }))}
                     placeholder="País"
                   />
                   <label htmlFor="addressCountry"><i className="fas fa-globe me-2"></i>País</label>
                 </div>
               </div>
             </div>
           </div>
         );
        
      case 3:
         return (
           <div className="wizard-step">
             <div className="d-flex align-items-center mb-4">
               <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '24px'}}>
                 📱
               </div>
               <div>
                 <h3 className="mb-1 text-info fw-bold">Telefone</h3>
                 <p className="text-muted mb-0">Contato direto para comunicação</p>
               </div>
             </div>
             
             <div className="row g-4 justify-content-center">
               <div className="col-md-4">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg text-center"
                     id="phoneDdd"
                     value={phoneData.ddd}
                     onChange={(e) => setPhoneData(prev => ({ ...prev, ddd: e.target.value }))}
                     placeholder="11"
                     maxLength={2}
                     required
                   />
                   <label htmlFor="phoneDdd"><i className="fas fa-phone-alt me-2"></i>DDD *</label>
                 </div>
               </div>
               
               <div className="col-md-6">
                 <div className="form-floating">
                   <input
                     type="text"
                     className="form-control form-control-lg"
                     id="phoneNumber"
                     value={phoneData.number}
                     onChange={(e) => setPhoneData(prev => ({ ...prev, number: e.target.value }))}
                     placeholder="999999999"
                     maxLength={9}
                     required
                   />
                   <label htmlFor="phoneNumber"><i className="fas fa-mobile-alt me-2"></i>Número *</label>
                 </div>
               </div>
             </div>
             
             <div className="alert alert-info mt-4" role="alert">
               <i className="fas fa-info-circle me-2"></i>
               <strong>Dica:</strong> Use o formato brasileiro com DDD (ex: 11 para São Paulo, 21 para Rio de Janeiro)
             </div>
           </div>
         );
        
      case 4:
        return (
          <div className="wizard-step">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '24px'}}>
                🐐
              </div>
              <div>
                <h3 className="mb-1 text-warning fw-bold">Fazenda</h3>
                <p className="text-muted mb-0">Informações sobre sua propriedade rural</p>
              </div>
            </div>
            
            <div className="row g-4 justify-content-center">
              <div className="col-md-8">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="farmName"
                    value={farmData.name}
                    onChange={(e) => setFarmData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da sua fazenda"
                    required
                  />
                  <label htmlFor="farmName"><i className="fas fa-seedling me-2"></i>Nome da Fazenda *</label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="farmTod"
                    value={farmData.tod}
                    onChange={(e) => setFarmData(prev => ({ ...prev, tod: e.target.value }))}
                    placeholder="5 caracteres"
                    maxLength={5}
                  />
                  <label htmlFor="farmTod"><i className="fas fa-tag me-2"></i>TOD (Opcional)</label>
                </div>
              </div>
            </div>
            
            <div className="alert alert-success mt-4" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              <strong>Quase pronto!</strong> Após cadastrar sua fazenda, você terá acesso completo ao sistema de gestão.
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="goat-farm-registration-page">
      {/* Header da página */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            🐐 Cadastro Completo de Fazenda
          </h1>
          <p className="page-description">
            Cadastre uma nova fazenda de cabras com usuário, endereço e telefones em uma única operação.
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/fazendas')}
            disabled={loading}
          >
            ← Voltar para Fazendas
          </button>
          
          <button 
            type="button" 
            className="btn-outline"
            onClick={resetWizard}
            disabled={loading}
          >
            🔄 Reiniciar Wizard
          </button>
        </div>
      </div>

      {/* Wizard */}
      <div className="wizard-container">
        {/* Progress Bar */}
        <div className="wizard-progress">
          {WIZARD_STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${
                currentStep === step.id ? 'active' : 
                completedSteps.includes(step.id) ? 'completed' : ''
              }`}
            >
              <div className="step-icon">{step.icon}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {renderWizardStep()}
          
          {/* Success Message */}
           {successMessage && (
             <div className="success-message">
               {successMessage}
             </div>
           )}
           
           {/* Error Message */}
           {errorMessage && (
             <div className="error-message">
               ⚠️ {errorMessage}
             </div>
           )}
          
          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-5">
            {currentStep > 1 ? (
              <button 
                type="button" 
                onClick={prevStep}
                className="btn btn-outline-secondary btn-lg px-4"
                disabled={loading}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Anterior
              </button>
            ) : (
              <div></div>
            )}
            
            <button 
              type="button" 
              className="btn btn-outline-warning btn-lg px-4"
              onClick={resetWizard}
              disabled={loading}
            >
              <i className="fas fa-redo me-2"></i>
              Reiniciar
            </button>
            
            <button 
              type="button" 
              className={currentStep === 4 ? "btn btn-success btn-lg px-4" : "btn btn-primary btn-lg px-4"}
              onClick={handleStepSubmit}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Processando...
                </>
              ) : currentStep === 4 ? (
                <>
                  <i className="fas fa-check me-2"></i>
                  Finalizar Cadastro
                </>
              ) : (
                <>
                  Próximo
                  <i className="fas fa-arrow-right ms-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Informações sobre o wizard */}
      <div className="info-section">
        <div className="info-card">
          <h3>🎯 Wizard de Cadastro em 4 Etapas</h3>
          <p>Processo guiado para cadastro completo:</p>
          <ul>
            <li>👤 <strong>Etapa 1:</strong> Dados pessoais do usuário</li>
            <li>🏠 <strong>Etapa 2:</strong> Endereço completo</li>
            <li>📱 <strong>Etapa 3:</strong> Telefone de contato</li>
            <li>🐐 <strong>Etapa 4:</strong> Informações da fazenda</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>🛡️ Validações por Etapa</h3>
          <ul>
            <li>📧 Email válido e único</li>
            <li>🆔 CPF brasileiro válido</li>
            <li>🔒 Confirmação de senha</li>
            <li>📍 CEP no formato correto</li>
            <li>📱 DDD e número válidos</li>
            <li>🏷️ Nome da fazenda obrigatório</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h3>✨ Interface Moderna</h3>
          <p>Design intuitivo com indicador de progresso visual e navegação simplificada entre as etapas.</p>
          <p><strong>Tempo estimado:</strong> 3-5 minutos para cadastro completo</p>
        </div>
      </div>
    </div>
  );
}
