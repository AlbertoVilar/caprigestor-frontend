// 🏡 Componente de Cadastro de Fazenda

import React from 'react';
import { useCreateFarm } from '../Hooks/useCreateFarm';
import { FarmDataConverter } from '../utils/FarmDataConverter';
import { BRAZILIAN_STATES } from '../types/farmTypes';
import '../styles/forms.css';

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

  // renderTextarea foi removido (não utilizado)

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
    <div className="form-container">
      <div className="form-header">
        <h1>🏡 Cadastro de Capril</h1>
        <p>Preencha os dados abaixo para cadastrar um novo capril no sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-body">
        {/* Seção: Dados do Capril */}
        <div className="form-section">
          <div className="section-header">
            <h2>📋 Dados do Capril</h2>
          </div>
          <div className="form-row">
            {renderInput('Nome do Capril', 'farmName', 'text', 'Ex: Capril São João')}
            {renderInput('Código TOD', 'farmTod', 'text', 'Ex: 12345', true)}
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="farmLogoUrl">Logo (URL)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  id="farmLogoUrl"
                  type="url"
                  value={formData.farmLogoUrl || ''}
                  onChange={(e) => updateField('farmLogoUrl', e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  disabled={isLoading}
                  style={{ flex: 1 }}
                />
                {formData.farmLogoUrl && (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #ccc',
                    flexShrink: 0
                  }}>
                    <img 
                      src={formData.farmLogoUrl} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                Link direto da imagem (opcional)
              </small>
            </div>
          </div>
        </div>

        {/* Seção: Dados do Usuário */}
        <div className="form-section">
          <div className="section-header">
            <h2>👤 Dados do Usuário</h2>
          </div>
          <div className="form-row">
            {renderInput('Nome Completo', 'userName', 'text', 'Ex: João Silva')}
            {renderInput('Email', 'userEmail', 'email', 'Ex: joao@email.com')}
          </div>
          <div className="form-row">
            {renderInput('CPF', 'userCpf', 'text', 'Ex: 123.456.789-00')}
          </div>
          <div className="form-row">
            {renderInput('Senha', 'userPassword', 'password', 'Mínimo 6 caracteres')}
            {renderInput('Confirmar Senha', 'userConfirmPassword', 'password', 'Repita a senha')}
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="form-section">
          <div className="section-header">
            <h2>📍 Endereço</h2>
          </div>
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
        </div>

        {/* Seção: Telefones */}
        <div className="form-section">
          <div className="section-header">
            <h2>📞 Telefones</h2>
          </div>
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
        </div>

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

        {/* Ações do Formulário */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || hasErrors}
          >
            {isLoading ? 'Salvando...' : 'Salvar Capril'}
          </button>
          <button 
            type="button" 
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Limpar Formulário
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFarmForm;
