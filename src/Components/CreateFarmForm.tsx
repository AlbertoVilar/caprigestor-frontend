// 🏡 Componente de Cadastro de Fazenda

import React from 'react';
import { useCreateFarm } from '../Hooks/useCreateFarm';
import { FarmDataConverter } from '../utils/FarmDataConverter';
import { BRAZILIAN_STATES } from '../types/farmTypes';

/**
 * Componente principal para cadastro de fazenda
 */
export const CreateFarmForm: React.FC = () => {
  const {
    formData,
    errors,
    isLoading,
    isSuccess,
    hasErrors,
    updateField,
    addPhone,
    removePhone,
    updatePhone,
    submitForm,
    resetForm
  } = useCreateFarm();

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitForm();
    
    if (success) {
      alert('🎉 Fazenda criada com sucesso!');
    }
  };

  // Handler para reset do formulário
  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      resetForm();
    }
  };

  // Renderiza campo de input com erro
  const renderInput = (
    label: string,
    field: keyof typeof formData,
    type: string = 'text',
    placeholder?: string,
    required: boolean = true
  ) => {
    const value = formData[field] as string;
    const error = errors[field];
    
    return (
      <div className="form-group">
        <label htmlFor={field}>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <input
          id={field}
          type={type}
          value={value}
          onChange={(e) => {
            let newValue = e.target.value;
            
            // Aplicar formatação automática
            if (field === 'userCpf') {
              newValue = FarmDataConverter.formatCPF(newValue);
            } else if (field === 'addressPostalCode') {
              newValue = FarmDataConverter.formatCEP(newValue);
            }
            
            updateField(field, newValue);
          }}
          placeholder={placeholder}
          className={error ? 'error' : ''}
          disabled={isLoading}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  // Renderiza campo de textarea
  const renderTextarea = (
    label: string,
    field: keyof typeof formData,
    placeholder?: string,
    required: boolean = false
  ) => {
    const value = formData[field] as string;
    const error = errors[field];
    
    return (
      <div className="form-group">
        <label htmlFor={field}>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <textarea
          id={field}
          value={value}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className={error ? 'error' : ''}
          disabled={isLoading}
          rows={3}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  // Renderiza campo de select
  const renderSelect = (
    label: string,
    field: keyof typeof formData,
    options: Array<{ value: string; label: string }>,
    required: boolean = true
  ) => {
    const value = formData[field] as string;
    const error = errors[field];
    
    return (
      <div className="form-group">
        <label htmlFor={field}>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <select
          id={field}
          value={value}
          onChange={(e) => updateField(field, e.target.value)}
          className={error ? 'error' : ''}
          disabled={isLoading}
        >
          <option value="">Selecione...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="success-container">
        <div className="success-message">
          <h2>🎉 Capril Criado com Sucesso!</h2>
          <p>Seu capril foi cadastrado no sistema.</p>
          <button 
            type="button" 
            onClick={resetForm}
            className="btn btn-primary"
          >
            Cadastrar Novo Capril
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-farm-container">
      <div className="form-header">
        <h1>🏡 Cadastro de Capril</h1>
        <p>Preencha os dados abaixo para cadastrar um novo capril no sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="create-farm-form">
        {/* Seção: Dados do Capril */}
        <section className="form-section">
          <h2>📋 Dados do Capril</h2>
          <div className="form-row">
            {renderInput('Nome do Capril', 'farmName', 'text', 'Ex: Capril São João')}
            {renderInput('Código TOD', 'farmTod', 'text', 'Ex: 12345', true)}
          </div>
        </section>

        {/* Seção: Dados do Usuário */}
        <section className="form-section">
          <h2>👤 Dados do Usuário</h2>
          <div className="form-row">
            {renderInput('Nome Completo', 'userName', 'text', 'Ex: João Silva')}
            {renderInput('Email', 'userEmail', 'email', 'Ex: joao@email.com')}
          </div>
          <div className="form-row">
            {renderInput('CPF', 'userCpf', 'text', 'Ex: 123.456.789-00')}
            {renderSelect('Função', 'userRoles', [
              { value: 'ROLE_ADMIN', label: 'Administrador' },
              { value: 'ROLE_MANAGER', label: 'Gerente' },
              { value: 'ROLE_OPERATOR', label: 'Operador' }
            ])}
          </div>
          <div className="form-row">
            {renderInput('Senha', 'userPassword', 'password', 'Mínimo 6 caracteres')}
            {renderInput('Confirmar Senha', 'userConfirmPassword', 'password', 'Repita a senha')}
          </div>
        </section>

        {/* Seção: Endereço */}
        <section className="form-section">
          <h2>📍 Endereço</h2>
          <div className="form-row">
            {renderInput('CEP', 'addressPostalCode', 'text', 'Ex: 12345-678')}
            {renderSelect('Estado', 'addressState', BRAZILIAN_STATES)}
          </div>
          <div className="form-row">
            {renderInput('Cidade', 'addressCity', 'text', 'Ex: São Paulo')}
            {renderInput('Bairro', 'addressNeighborhood', 'text', 'Ex: Centro')}
          </div>
          <div className="form-row">
            {renderInput('Rua', 'addressStreet', 'text', 'Ex: Rua das Flores, 123')}
            {renderInput('País', 'addressCountry', 'text', 'Ex: Brasil')}
          </div>
          {renderInput('Complemento', 'addressComplement', 'text', 'Ex: Apto 45 (opcional)', false)}
        </section>

        {/* Seção: Telefones */}
        <section className="form-section">
          <h2>📞 Telefones</h2>
          {formData.phones.map((phone, index) => {
            const phoneError = errors[`phone_${phone.id}_number`] || errors[`phone_${phone.id}_ddd`];
            
            return (
              <div key={phone.id} className="phone-group">
                <div className="phone-header">
                  <h4>Telefone {index + 1}</h4>
                  {formData.phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(phone.id)}
                      className="btn btn-danger btn-small"
                      disabled={isLoading}
                    >
                      ❌ Remover
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`phone_${phone.id}_ddd`}>
                      DDD <span className="required">*</span>
                    </label>
                    <input
                      id={`phone_${phone.id}_ddd`}
                      type="text"
                      value={phone.ddd}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                        updatePhone(phone.id, 'ddd', value);
                      }}
                      placeholder="11"
                      maxLength={2}
                      className={phoneError ? 'error' : ''}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`phone_${phone.id}_number`}>
                      Número <span className="required">*</span>
                    </label>
                    <input
                      id={`phone_${phone.id}_number`}
                      type="text"
                      value={phone.number}
                      onChange={(e) => {
                        // Remove caracteres não numéricos e limita a 9 dígitos
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        updatePhone(phone.id, 'number', value);
                      }}
                      placeholder="987659943"
                      className={phoneError ? 'error' : ''}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                {phoneError && (
                  <span className="error-message">{phoneError}</span>
                )}
              </div>
            );
          })}
          
          <button
            type="button"
            onClick={addPhone}
            className="btn btn-secondary"
            disabled={isLoading || formData.phones.length >= 3}
          >
            ➕ Adicionar Telefone
          </button>
        </section>

        {/* Mensagens de Erro Gerais */}
        {hasErrors && (
          <div className="error-summary">
            <h3>⚠️ Corrija os erros abaixo:</h3>
            <ul>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>⏳ Cadastrando fazenda... Por favor, aguarde.</p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            🔄 Limpar Formulário
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Cadastrando...' : '✅ Cadastrar Fazenda'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFarmForm;