// src/Components/goat-farm-form/GoatFarmForm.tsx

import React from 'react';
import { GoatFarmFormData, UserRole, PhoneData } from '../../types/goat-farm.types';

// Props que o formulário recebe da página pai
type GoatFarmFormProps = {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  formData: GoatFarmFormData;
  setFormData: (data: GoatFarmFormData) => void;
  loading: boolean;
  errorMessage: string | null;
  validationErrors: string[];
};

// Componente de formulário para cadastro completo de fazenda de cabras
export function GoatFarmForm({
  handleSubmit,
  formData,
  setFormData,
  loading,
  errorMessage,
  validationErrors,
}: GoatFarmFormProps) {
  
  // Função para atualizar campos do formulário
  const updateField = (field: keyof GoatFarmFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };
  
  // Função para adicionar novo telefone
  const addPhone = () => {
    const newPhone: PhoneData = { ddd: '', number: '' };
    updateField('phones', [...formData.phones, newPhone]);
  };
  
  // Função para remover telefone
  const removePhone = (index: number) => {
    const updatedPhones = formData.phones.filter((_, i) => i !== index);
    updateField('phones', updatedPhones);
  };
  
  // Função para atualizar telefone específico
  const updatePhone = (index: number, field: keyof PhoneData, value: string) => {
    const updatedPhones = formData.phones.map((phone, i) => 
      i === index ? { ...phone, [field]: value } : phone
    );
    updateField('phones', updatedPhones);
  };
  
  // Função para adicionar/remover role
  const toggleRole = (role: UserRole) => {
    const currentRoles = formData.userRoles;
    const hasRole = currentRoles.includes(role);
    
    if (hasRole) {
      updateField('userRoles', currentRoles.filter(r => r !== role));
    } else {
      updateField('userRoles', [...currentRoles, role]);
    }
  };
  
  return (
    <div className="goat-farm-form-container">
      <form className="goat-farm-form" onSubmit={handleSubmit}>
        
        {/* Seção: Dados da Fazenda */}
        <div className="form-section">
          <h3 className="section-title">📍 Dados da Fazenda</h3>
          
          <div className="form-group">
            <label htmlFor="farmName" className="form-label">
              Nome da Fazenda *
            </label>
            <input
              id="farmName"
              className="form-input"
              type="text"
              value={formData.farmName}
              onChange={(e) => updateField('farmName', e.target.value)}
              placeholder="Ex: Fazenda São João"
              required
              maxLength={255}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="farmTod" className="form-label">
              TOD (Opcional)
            </label>
            <input
              id="farmTod"
              className="form-input"
              type="text"
              value={formData.farmTod}
              onChange={(e) => updateField('farmTod', e.target.value)}
              placeholder="12345"
              maxLength={5}
              pattern="[0-9A-Za-z]{5}"
              title="TOD deve ter exatamente 5 caracteres"
            />
            <small className="form-help">TOD deve ter exatamente 5 caracteres (opcional)</small>
          </div>
        </div>
        
        {/* Seção: Dados do Usuário */}
        <div className="form-section">
          <h3 className="section-title">👤 Dados do Usuário</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userName" className="form-label">
                Nome Completo *
              </label>
              <input
                id="userName"
                className="form-input"
                type="text"
                value={formData.userName}
                onChange={(e) => updateField('userName', e.target.value)}
                placeholder="Nome completo do usuário"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="userEmail" className="form-label">
                Email *
              </label>
              <input
                id="userEmail"
                className="form-input"
                type="email"
                value={formData.userEmail}
                onChange={(e) => updateField('userEmail', e.target.value)}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="userCpf" className="form-label">
              CPF *
            </label>
            <input
              id="userCpf"
              className="form-input"
              type="text"
              value={formData.userCpf}
              onChange={(e) => updateField('userCpf', e.target.value.replace(/\D/g, ''))}
              placeholder="12345678901"
              required
              pattern="[0-9]{11}"
              maxLength={11}
              title="CPF deve ter exatamente 11 dígitos numéricos"
            />
            <small className="form-help">Apenas números, 11 dígitos</small>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="userPassword" className="form-label">
                Senha *
              </label>
              <input
                id="userPassword"
                className="form-input"
                type="password"
                value={formData.userPassword}
                onChange={(e) => updateField('userPassword', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="userConfirmPassword" className="form-label">
                Confirmar Senha *
              </label>
              <input
                id="userConfirmPassword"
                className="form-input"
                type="password"
                value={formData.userConfirmPassword}
                onChange={(e) => updateField('userConfirmPassword', e.target.value)}
                placeholder="Confirme a senha"
                required
                minLength={6}
              />
            </div>
          </div>
          
          {/* Roles do usuário */}
          <div className="form-group">
            <label className="form-label">Permissões do Usuário *</label>
            <div className="roles-container">
              {(['ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_USER'] as UserRole[]).map((role) => (
                <label key={role} className="role-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.userRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span className="role-label">
                    {role === 'ROLE_ADMIN' && '🔧 Administrador'}
                    {role === 'ROLE_OPERATOR' && '👨‍🌾 Operador'}
                    {role === 'ROLE_USER' && '👤 Usuário'}
                  </span>
                </label>
              ))}
            </div>
            <small className="form-help">Selecione pelo menos uma permissão</small>
          </div>
        </div>
        
        {/* Seção: Endereço */}
        <div className="form-section">
          <h3 className="section-title">🏠 Endereço</h3>
          
          <div className="form-group">
            <label htmlFor="addressStreet" className="form-label">
              Rua/Logradouro *
            </label>
            <input
              id="addressStreet"
              className="form-input"
              type="text"
              value={formData.addressStreet}
              onChange={(e) => updateField('addressStreet', e.target.value)}
              placeholder="Rua, Avenida, etc."
              required
              maxLength={255}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="addressNeighborhood" className="form-label">
                Bairro *
              </label>
              <input
                id="addressNeighborhood"
                className="form-input"
                type="text"
                value={formData.addressNeighborhood}
                onChange={(e) => updateField('addressNeighborhood', e.target.value)}
                placeholder="Nome do bairro"
                required
                maxLength={100}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="addressCity" className="form-label">
                Cidade *
              </label>
              <input
                id="addressCity"
                className="form-input"
                type="text"
                value={formData.addressCity}
                onChange={(e) => updateField('addressCity', e.target.value)}
                placeholder="Nome da cidade"
                required
                maxLength={100}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="addressState" className="form-label">
                Estado *
              </label>
              <input
                id="addressState"
                className="form-input"
                type="text"
                value={formData.addressState}
                onChange={(e) => updateField('addressState', e.target.value)}
                placeholder="Ex: São Paulo"
                required
                maxLength={50}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="addressPostalCode" className="form-label">
                CEP *
              </label>
              <input
                id="addressPostalCode"
                className="form-input"
                type="text"
                value={formData.addressPostalCode}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 5) {
                    value = value.slice(0, 5) + '-' + value.slice(5, 8);
                  }
                  updateField('addressPostalCode', value);
                }}
                placeholder="12345-678"
                required
                pattern="\d{5}-\d{3}"
                maxLength={9}
                title="CEP deve estar no formato XXXXX-XXX"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="addressCountry" className="form-label">
              País *
            </label>
            <input
              id="addressCountry"
              className="form-input"
              type="text"
              value={formData.addressCountry}
              onChange={(e) => updateField('addressCountry', e.target.value)}
              placeholder="Brasil"
              required
              maxLength={100}
            />
          </div>
        </div>
        
        {/* Seção: Telefones */}
        <div className="form-section">
          <h3 className="section-title">📞 Telefones</h3>
          
          {formData.phones.map((phone, index) => (
            <div key={index} className="phone-group">
              <div className="form-row">
                <div className="form-group form-group-small">
                  <label htmlFor={`phoneDdd${index}`} className="form-label">
                    DDD *
                  </label>
                  <input
                    id={`phoneDdd${index}`}
                    className="form-input"
                    type="text"
                    value={phone.ddd}
                    onChange={(e) => updatePhone(index, 'ddd', e.target.value.replace(/\D/g, ''))}
                    placeholder="11"
                    required
                    pattern="[0-9]{2}"
                    maxLength={2}
                    title="DDD deve ter exatamente 2 dígitos"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`phoneNumber${index}`} className="form-label">
                    Número *
                  </label>
                  <input
                    id={`phoneNumber${index}`}
                    className="form-input"
                    type="text"
                    value={phone.number}
                    onChange={(e) => updatePhone(index, 'number', e.target.value.replace(/\D/g, ''))}
                    placeholder="987654321"
                    required
                    pattern="[0-9]{8,9}"
                    minLength={8}
                    maxLength={9}
                    title="Número deve ter 8 ou 9 dígitos"
                  />
                </div>
                
                {formData.phones.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-phone"
                    onClick={() => removePhone(index)}
                    title="Remover telefone"
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="btn-add-phone"
            onClick={addPhone}
          >
            ➕ Adicionar Telefone
          </button>
          
          <small className="form-help">Pelo menos um telefone é obrigatório</small>
        </div>
        
        {/* Mensagens de erro */}
        {errorMessage && (
          <div className="error-message">
            <strong>❌ Erro:</strong> {errorMessage}
          </div>
        )}
        
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <strong>⚠️ Erros de validação:</strong>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Botão de submit */}
        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
        >
          {loading ? '⏳ Cadastrando...' : '🐐 Cadastrar Fazenda'}
        </button>
      </form>
    </div>
  );
}