import React from "react";
import { toast } from "react-toastify";
import { useCreateFarm } from "../../hooks/useCreateFarm";
import { StepIndicator } from "../../components/ui/StepIndicator";
import type { FormStep } from "../../types/farmTypes";
import "./FarmCreateForm.css";

export default function FarmCreateForm() {
  const {
    formData,
    currentStep,
    status,
    errors,
    updateFormData,
    validateCurrentStep,
    nextStep,
    previousStep,
    goToStep,
    submitForm,
    resetForm,
    addPhone,
    removePhone,
    updatePhone,
    isLoading,
    isSuccess,
    hasErrors
  } = useCreateFarm();

  const handleSubmit = async () => {
    const success = await submitForm();
    if (success) {
      // Redirecionar ou mostrar mensagem de sucesso
      setTimeout(() => {
        resetForm();
      }, 2000);
    }
  };

  const handleNextStep = () => {
    if (nextStep()) {
      // Etapa validada com sucesso
    }
  };

  const getCompletedSteps = (): FormStep[] => {
    const steps: FormStep[] = ['farm', 'user', 'address', 'phones'];
    const currentIndex = steps.indexOf(currentStep);
    return steps.slice(0, currentIndex);
  };

  if (isSuccess) {
    return (
      <div className="form-container success-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Fazenda Cadastrada com Sucesso!</h2>
          <p>Sua fazenda foi criada e você já pode começar a utilizá-la.</p>
          <button 
            className="btn btn-primary"
            onClick={resetForm}
          >
            Cadastrar Nova Fazenda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <StepIndicator 
        currentStep={currentStep}
        completedSteps={getCompletedSteps()}
        onStepClick={goToStep}
      />

      {/* Exibir erros gerais */}
      {Object.keys(errors).length > 0 && (
        <div className="error-summary">
          <h4>⚠️ Por favor, corrija os seguintes erros:</h4>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-content">
        {currentStep === 'farm' && (
          <div className="step-content">
            <h3>Informações da Fazenda</h3>
            <div className="form-group">
              <label htmlFor="farmName">Nome da Fazenda *</label>
              <input
                id="farmName"
                type="text"
                placeholder="Digite o nome da fazenda"
                value={formData.farm.name}
                onChange={(e) => updateFormData('farm', { name: e.target.value })}
                className={errors['farm.name'] ? 'error' : ''}
              />
              {errors['farm.name'] && (
                <span className="error-message">{errors['farm.name']}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="farmTod">Código TOD *</label>
              <input
                id="farmTod"
                type="text"
                placeholder="Digite o código TOD único da fazenda"
                value={formData.farm.tod}
                onChange={(e) => updateFormData('farm', { tod: e.target.value })}
                className={errors['farm.tod'] ? 'error' : ''}
              />
              {errors['farm.tod'] && (
                <span className="error-message">{errors['farm.tod']}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="farmDescription">Descrição</label>
              <textarea
                id="farmDescription"
                placeholder="Descreva sua fazenda (opcional)"
                value={formData.farm.description || ''}
                onChange={(e) => updateFormData('farm', { description: e.target.value })}
                rows={3}
              />
              {errors['farm.description'] && (
                <span className="error-message">{errors['farm.description']}</span>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {currentStep === 'user' && (
          <div className="step-content">
            <h3>Dados do Proprietário</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userName">Nome Completo *</label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.user.name}
                  onChange={(e) => updateFormData('user', { name: e.target.value })}
                  className={errors['user.name'] ? 'error' : ''}
                />
                {errors['user.name'] && (
                  <span className="error-message">{errors['user.name']}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="userCpf">CPF *</label>
                <input
                  id="userCpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.user.cpf}
                  onChange={(e) => updateFormData('user', { cpf: e.target.value })}
                  className={errors['user.cpf'] ? 'error' : ''}
                />
                {errors['user.cpf'] && (
                  <span className="error-message">{errors['user.cpf']}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="userEmail">Email *</label>
              <input
                id="userEmail"
                type="email"
                placeholder="seu@email.com"
                value={formData.user.email}
                onChange={(e) => updateFormData('user', { email: e.target.value })}
                className={errors['user.email'] ? 'error' : ''}
              />
              {errors['user.email'] && (
                <span className="error-message">{errors['user.email']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="userPassword">Senha *</label>
                <input
                  id="userPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.user.password}
                  onChange={(e) => updateFormData('user', { password: e.target.value })}
                  className={errors['user.password'] ? 'error' : ''}
                />
                {errors['user.password'] && (
                  <span className="error-message">{errors['user.password']}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="userConfirmPassword">Confirmar Senha *</label>
                <input
                  id="userConfirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={formData.user.confirmPassword}
                  onChange={(e) => updateFormData('user', { confirmPassword: e.target.value })}
                  className={errors['user.confirmPassword'] ? 'error' : ''}
                />
                {errors['user.confirmPassword'] && (
                  <span className="error-message">{errors['user.confirmPassword']}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={previousStep}
              >
                Voltar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {currentStep === 'address' && (
          <div className="step-content">
            <h3>Endereço da Fazenda</h3>
            <div className="form-group">
              <label htmlFor="addressStreet">Endereço Completo *</label>
              <input
                id="addressStreet"
                type="text"
                placeholder="Rua, número, complemento"
                value={formData.address.street}
                onChange={(e) => updateFormData('address', { street: e.target.value })}
                className={errors['address.street'] ? 'error' : ''}
              />
              {errors['address.street'] && (
                <span className="error-message">{errors['address.street']}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="addressDistrict">Bairro *</label>
              <input
                id="addressDistrict"
                type="text"
                placeholder="Nome do bairro"
                value={formData.address.district}
                onChange={(e) => updateFormData('address', { district: e.target.value })}
                className={errors['address.district'] ? 'error' : ''}
              />
              {errors['address.district'] && (
                <span className="error-message">{errors['address.district']}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="addressCity">Cidade *</label>
                <input
                  id="addressCity"
                  type="text"
                  placeholder="Nome da cidade"
                  value={formData.address.city}
                  onChange={(e) => updateFormData('address', { city: e.target.value })}
                  className={errors['address.city'] ? 'error' : ''}
                />
                {errors['address.city'] && (
                  <span className="error-message">{errors['address.city']}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="addressState">Estado *</label>
                <input
                  id="addressState"
                  type="text"
                  placeholder="Estado ou UF"
                  value={formData.address.state}
                  onChange={(e) => updateFormData('address', { state: e.target.value })}
                  className={errors['address.state'] ? 'error' : ''}
                />
                {errors['address.state'] && (
                  <span className="error-message">{errors['address.state']}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
              <label htmlFor="addressCep">CEP *</label>
              <input
                id="addressCep"
                type="text"
                placeholder="00000-000"
                value={formData.address.cep}
                onChange={(e) => updateFormData('address', { cep: e.target.value })}
                className={errors['address.cep'] ? 'error' : ''}
              />
              {errors['address.cep'] && (
                <span className="error-message">{errors['address.cep']}</span>
              )}
            </div>
              
              <div className="form-group">
                <label htmlFor="addressCountry">País *</label>
                <input
                  id="addressCountry"
                  type="text"
                  placeholder="Brasil"
                  value={formData.address.country}
                  onChange={(e) => updateFormData('address', { country: e.target.value })}
                  className={errors['address.country'] ? 'error' : ''}
                />
                {errors['address.country'] && (
                  <span className="error-message">{errors['address.country']}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={previousStep}
              >
                Voltar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {currentStep === 'phones' && (
          <div className="step-content">
            <h3>Telefones de Contato</h3>
            
            {formData.phones.map((phone, index) => (
              <div key={index} className="phone-group">
                <div className="form-row">
                  <div className="form-group ddd-field">
                    <label htmlFor={`phoneDdd${index}`}>DDD *</label>
                    <input
                      id={`phoneDdd${index}`}
                      type="text"
                      placeholder="11"
                      maxLength={2}
                      value={phone.ddd}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                        updatePhone(phone.id, 'ddd', value);
                      }}
                      className={errors[`phone_${phone.id}_ddd`] ? 'error' : ''}
                    />
                    {errors[`phone_${phone.id}_ddd`] && (
                      <span className="error-message">{errors[`phone_${phone.id}_ddd`]}</span>
                    )}
                  </div>
                  
                  <div className="form-group number-field">
                    <label htmlFor={`phoneNumber${index}`}>Número *</label>
                    <input
                      id={`phoneNumber${index}`}
                      type="text"
                      placeholder="987659943"
                      maxLength={9}
                      value={phone.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        updatePhone(phone.id, 'number', value);
                      }}
                      className={errors[`phone_${phone.id}_number`] ? 'error' : ''}
                    />
                    {errors[`phone_${phone.id}_number`] && (
                      <span className="error-message">{errors[`phone_${phone.id}_number`]}</span>
                    )}
                  </div>
                  
                  {formData.phones.length > 1 && (
                    <button 
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removePhone(index)}
                      title="Remover telefone"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}

            {errors['phones'] && (
              <span className="error-message">{errors['phones']}</span>
            )}

            <button 
              type="button"
              className="btn btn-outline add-phone-btn"
              onClick={addPhone}
            >
              + Adicionar Telefone
            </button>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={previousStep}
              >
                Voltar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={isLoading || hasErrors}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Fazenda'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
