// 🔍 Validador para dados de fazenda

import { ValidationResult, ValidationErrors, FarmFormState } from '../types/farmTypes';

/**
 * Classe responsável pela validação dos dados do formulário de fazenda
 */
export class FarmValidator {
  
  /**
   * Valida todos os dados do formulário
   * @param formData - Dados do formulário
   * @returns Resultado da validação
   */
  static validateAll(formData: FarmFormState): ValidationResult {
    const errors: ValidationErrors = {};
    
    // Validar dados da fazenda
    const farmErrors = this.validateFarm(formData);
    Object.assign(errors, farmErrors);
    
    // Validar dados do usuário
    const userErrors = this.validateUser(formData);
    Object.assign(errors, userErrors);
    
    // Validar dados do endereço
    const addressErrors = this.validateAddress(formData);
    Object.assign(errors, addressErrors);
    
    // Validar telefones
    const phoneErrors = this.validatePhones(formData);
    Object.assign(errors, phoneErrors);
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  /**
   * Valida dados do capril
   */
  static validateFarm(formData: FarmFormState): ValidationErrors {
    const errors: ValidationErrors = {};
    
    // Nome do capril
    if (!formData.farmName.trim()) {
      errors.farmName = 'Nome do capril é obrigatório';
    } else if (formData.farmName.length < 3) {
      errors.farmName = 'Nome do capril deve ter pelo menos 3 caracteres';
    } else if (formData.farmName.length > 100) {
      errors.farmName = 'Nome do capril deve ter no máximo 100 caracteres';
    }
    
    // Código TOD (obrigatório)
    if (!formData.farmTod.trim()) {
      errors.farmTod = 'Código TOD é obrigatório';
    } else if (formData.farmTod.length < 3) {
      errors.farmTod = 'Código TOD deve ter pelo menos 3 caracteres';
    } else if (formData.farmTod.length > 50) {
      errors.farmTod = 'Código TOD deve ter no máximo 50 caracteres';
    }
    
    return errors;
  }
  
  /**
   * Valida dados do usuário
   */
  static validateUser(formData: FarmFormState): ValidationErrors {
    const errors: ValidationErrors = {};
    
    // Nome do usuário
    if (!formData.userName.trim()) {
      errors.userName = 'Nome é obrigatório';
    } else if (formData.userName.length < 2) {
      errors.userName = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.userName.length > 100) {
      errors.userName = 'Nome deve ter no máximo 100 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.userName)) {
      errors.userName = 'Nome deve conter apenas letras e espaços';
    }
    
    // Email
    if (!formData.userEmail.trim()) {
      errors.userEmail = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      errors.userEmail = 'Email deve ter um formato válido';
    } else if (formData.userEmail.length > 255) {
      errors.userEmail = 'Email deve ter no máximo 255 caracteres';
    }
    
    // CPF
    if (!formData.userCpf.trim()) {
      errors.userCpf = 'CPF é obrigatório';
    } else if (!this.isValidCPF(formData.userCpf)) {
      errors.userCpf = 'CPF deve ter um formato válido';
    }
    
    // Senha
    if (!formData.userPassword) {
      errors.userPassword = 'Senha é obrigatória';
    } else if (formData.userPassword.length < 6) {
      errors.userPassword = 'Senha deve ter pelo menos 6 caracteres';
    } else if (formData.userPassword.length > 50) {
      errors.userPassword = 'Senha deve ter no máximo 50 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.userPassword)) {
      errors.userPassword = 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número';
    }
    
    // Confirmação de senha
    if (!formData.userConfirmPassword) {
      errors.userConfirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.userPassword !== formData.userConfirmPassword) {
      errors.userConfirmPassword = 'Senhas não coincidem';
    }
    
    // Função/Papel
    if (!formData.userRoles.trim()) {
      errors.userRoles = 'Função é obrigatória';
    } else if (!['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_OPERATOR'].includes(formData.userRoles)) {
      errors.userRoles = 'Função deve ser Administrador, Gerente ou Operador';
    }
    
    return errors;
  }
  
  /**
   * Valida dados do endereço
   */
  static validateAddress(formData: FarmFormState): ValidationErrors {
    const errors: ValidationErrors = {};
    
    // Rua
    if (!formData.addressStreet.trim()) {
      errors.addressStreet = 'Rua é obrigatória';
    } else if (formData.addressStreet.length < 5) {
      errors.addressStreet = 'Rua deve ter pelo menos 5 caracteres';
    } else if (formData.addressStreet.length > 200) {
      errors.addressStreet = 'Rua deve ter no máximo 200 caracteres';
    }
    
    // Complemento (opcional)
    if (formData.addressComplement && formData.addressComplement.length > 100) {
      errors.addressComplement = 'Complemento deve ter no máximo 100 caracteres';
    }
    
    // Bairro
    if (!formData.addressNeighborhood.trim()) {
      errors.addressNeighborhood = 'Bairro é obrigatório';
    } else if (formData.addressNeighborhood.length < 2) {
      errors.addressNeighborhood = 'Bairro deve ter pelo menos 2 caracteres';
    } else if (formData.addressNeighborhood.length > 100) {
      errors.addressNeighborhood = 'Bairro deve ter no máximo 100 caracteres';
    }
    
    // Cidade
    if (!formData.addressCity.trim()) {
      errors.addressCity = 'Cidade é obrigatória';
    } else if (formData.addressCity.length < 2) {
      errors.addressCity = 'Cidade deve ter pelo menos 2 caracteres';
    } else if (formData.addressCity.length > 100) {
      errors.addressCity = 'Cidade deve ter no máximo 100 caracteres';
    }
    
    // Estado
    if (!formData.addressState.trim()) {
      errors.addressState = 'Estado é obrigatório';
    } else if (formData.addressState.length !== 2) {
      errors.addressState = 'Estado deve ter exatamente 2 caracteres';
    }
    
    // CEP
    if (!formData.addressPostalCode.trim()) {
      errors.addressPostalCode = 'CEP é obrigatório';
    } else if (!this.isValidCEP(formData.addressPostalCode)) {
      errors.addressPostalCode = 'CEP deve ter um formato válido (XXXXX-XXX)';
    }
    
    // País
    if (!formData.addressCountry.trim()) {
      errors.addressCountry = 'País é obrigatório';
    } else if (formData.addressCountry.length < 2) {
      errors.addressCountry = 'País deve ter pelo menos 2 caracteres';
    } else if (formData.addressCountry.length > 50) {
      errors.addressCountry = 'País deve ter no máximo 50 caracteres';
    }
    
    return errors;
  }
  
  /**
   * Valida telefones
   */
  static validatePhones(formData: FarmFormState): ValidationErrors {
    const errors: ValidationErrors = {};
    
    if (!formData.phones || formData.phones.length === 0) {
      errors.phones = 'Pelo menos um telefone é obrigatório';
      return errors;
    }
    
    formData.phones.forEach((phone) => {
      // Validar DDD
      if (!phone.ddd.trim()) {
        errors[`phone_${phone.id}_ddd`] = 'DDD é obrigatório';
      } else if (phone.ddd.length !== 2 || !/^\d{2}$/.test(phone.ddd)) {
        errors[`phone_${phone.id}_ddd`] = 'DDD deve ter exatamente 2 dígitos';
      }
      
      // Validar número
      if (!phone.number.trim()) {
        errors[`phone_${phone.id}_number`] = 'Número do telefone é obrigatório';
      } else if (!this.isValidPhoneNumber(phone.number)) {
        errors[`phone_${phone.id}_number`] = 'Número do telefone deve ter 8 ou 9 dígitos';
      }
      
      // Tipo é opcional no backend, mas pode ser validado se necessário
      // if (!phone.type) {
      //   errors[`phone_${phone.id}_type`] = 'Tipo do telefone é obrigatório';
      // }
    });
    
    return errors;
  }
  
  /**
   * Valida CPF
   */
  static isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }
  
  /**
   * Valida CEP
   */
  static isValidCEP(cep: string): boolean {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    return cleanCEP.length === 8;
  }
  
  /**
   * Valida telefone completo (com DDD)
   */
  static isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 11 dígitos (com DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }
  
  /**
   * Valida apenas o número do telefone (sem DDD)
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Verifica se tem 8 ou 9 dígitos
    return cleanNumber.length >= 8 && cleanNumber.length <= 9;
  }
}

export default FarmValidator;