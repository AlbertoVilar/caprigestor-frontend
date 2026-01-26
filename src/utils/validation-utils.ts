// src/utils/validation-utils.ts

/**
 * Utilitários para validação de dados brasileiros
 * Inclui validações para CPF, CEP, telefone e outros campos
 */

/**
 * Valida CPF brasileiro
 * @param cpf - CPF a ser validado (apenas números)
 * @returns true se o CPF for válido
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return false;
  }
  
  return true;
}

/**
 * Formata CPF para exibição
 * @param cpf - CPF a ser formatado
 * @returns CPF formatado (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length <= 3) {
    return cleanCPF;
  } else if (cleanCPF.length <= 6) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  } else if (cleanCPF.length <= 9) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  } else {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
  }
}

/**
 * Valida CEP brasileiro
 * @param cep - CEP a ser validado
 * @returns true se o CEP for válido
 */
export function isValidCEP(cep: string): boolean {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, '');
  
  // Verifica se tem 8 dígitos
  if (cleanCEP.length !== 8) {
    return false;
  }
  
  // Verifica se não são todos zeros
  if (cleanCEP === '00000000') {
    return false;
  }
  
  return true;
}

/**
 * Formata CEP para exibição
 * @param cep - CEP a ser formatado
 * @returns CEP formatado (XXXXX-XXX)
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length <= 5) {
    return cleanCEP;
  } else {
    return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
  }
}

/**
 * Valida DDD brasileiro
 * @param ddd - DDD a ser validado
 * @returns true se o DDD for válido
 */
export function isValidDDD(ddd: string): boolean {
  const cleanDDD = ddd.replace(/\D/g, '');
  
  // Verifica se tem 2 dígitos
  if (cleanDDD.length !== 2) {
    return false;
  }
  
  // Lista de DDDs válidos no Brasil
  const validDDDs = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
    '21', '22', '24', // Rio de Janeiro
    '27', '28', // Espírito Santo
    '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
    '41', '42', '43', '44', '45', '46', // Paraná
    '47', '48', '49', // Santa Catarina
    '51', '53', '54', '55', // Rio Grande do Sul
    '61', // Distrito Federal
    '62', '64', // Goiás
    '63', // Tocantins
    '65', '66', // Mato Grosso
    '67', // Mato Grosso do Sul
    '68', // Acre
    '69', // Rondônia
    '71', '73', '74', '75', '77', // Bahia
    '79', // Sergipe
    '81', '87', // Pernambuco
    '82', // Alagoas
    '83', // Paraíba
    '84', // Rio Grande do Norte
    '85', '88', // Ceará
    '86', '89', // Piauí
    '91', '93', '94', // Pará
    '92', '97', // Amazonas
    '95', // Roraima
    '96', // Amapá
    '98', '99' // Maranhão
  ];
  
  return validDDDs.includes(cleanDDD);
}

/**
 * Valida número de telefone brasileiro
 * @param number - Número de telefone a ser validado
 * @returns true se o número for válido
 */
export function isValidPhoneNumber(number: string): boolean {
  const cleanNumber = number.replace(/\D/g, '');
  
  // Verifica se tem 8 ou 9 dígitos
  if (cleanNumber.length !== 8 && cleanNumber.length !== 9) {
    return false;
  }
  
  // Se tem 9 dígitos, deve começar com 9 (celular)
  if (cleanNumber.length === 9 && !cleanNumber.startsWith('9')) {
    return false;
  }
  
  // Se tem 8 dígitos, não pode começar com 0 ou 1
  if (cleanNumber.length === 8 && (cleanNumber.startsWith('0') || cleanNumber.startsWith('1'))) {
    return false;
  }
  
  return true;
}

/**
 * Formata número de telefone para exibição
 * @param ddd - DDD do telefone
 * @param number - Número do telefone
 * @returns Telefone formatado
 */
export function formatPhone(ddd: string, number: string): string {
  const cleanDDD = ddd.replace(/\D/g, '');
  const cleanNumber = number.replace(/\D/g, '');
  
  if (cleanNumber.length === 8) {
    return `(${cleanDDD}) ${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
  } else if (cleanNumber.length === 9) {
    return `(${cleanDDD}) ${cleanNumber.slice(0, 5)}-${cleanNumber.slice(5)}`;
  }
  
  return `(${cleanDDD}) ${cleanNumber}`;
}

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns true se o email for válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida senha
 * @param password - Senha a ser validada
 * @param minLength - Comprimento mínimo (padrão: 6)
 * @returns objeto com resultado da validação e mensagens
 */
export function validatePassword(password: string, minLength: number = 6): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < minLength) {
    errors.push(`Senha deve ter pelo menos ${minLength} caracteres`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida se duas senhas coincidem
 * @param password - Senha original
 * @param confirmPassword - Confirmação da senha
 * @returns true se as senhas coincidirem
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Valida nome (entre 2 e 100 caracteres, apenas letras e espaços)
 * @param name - Nome a ser validado
 * @returns true se o nome for válido
 */
export function isValidName(name: string): boolean {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return false;
  }
  
  // Permite apenas letras, espaços, acentos e alguns caracteres especiais
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'.-]+$/;
  return nameRegex.test(trimmedName);
}

/**
 * Valida TOD (5 caracteres alfanuméricos)
 * @param tod - TOD a ser validado
 * @returns true se o TOD for válido
 */
export function isValidTOD(tod: string): boolean {
  if (!tod) return true; // TOD é opcional
  
  const cleanTOD = tod.trim();
  
  if (cleanTOD.length !== 5) {
    return false;
  }
  
  // Permite apenas letras e números
  const todRegex = /^[a-zA-Z0-9]{5}$/;
  return todRegex.test(cleanTOD);
}

/**
 * Valida endereço completo
 * @param address - Objeto com dados do endereço
 * @returns objeto com resultado da validação e erros
 */
export function validateAddress(address: {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!address.street || address.street.trim().length === 0) {
    errors.push('Rua é obrigatória');
  } else if (address.street.length > 255) {
    errors.push('Rua deve ter no máximo 255 caracteres');
  }
  
  if (!address.neighborhood || address.neighborhood.trim().length === 0) {
    errors.push('Bairro é obrigatório');
  } else if (address.neighborhood.length > 100) {
    errors.push('Bairro deve ter no máximo 100 caracteres');
  }
  
  if (!address.city || address.city.trim().length === 0) {
    errors.push('Cidade é obrigatória');
  } else if (address.city.length > 100) {
    errors.push('Cidade deve ter no máximo 100 caracteres');
  }
  
  if (!address.state || address.state.trim().length === 0) {
    errors.push('Estado é obrigatório');
  } else if (address.state.length > 50) {
    errors.push('Estado deve ter no máximo 50 caracteres');
  }
  
  if (!address.zipCode || !isValidCEP(address.zipCode)) {
    errors.push('CEP deve estar no formato XXXXX-XXX');
  }
  
  if (!address.country || address.country.trim().length === 0) {
    errors.push('País é obrigatório');
  } else if (address.country.length > 100) {
    errors.push('País deve ter no máximo 100 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida lista de telefones
 * @param phones - Array de telefones
 * @returns objeto com resultado da validação e erros
 */
export function validatePhones(phones: Array<{ ddd: string; number: string }>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!phones || phones.length === 0) {
    errors.push('Pelo menos um telefone deve ser informado');
    return { isValid: false, errors };
  }
  
  phones.forEach((phone, index) => {
    if (!isValidDDD(phone.ddd)) {
      errors.push(`Telefone ${index + 1}: DDD inválido`);
    }
    
    if (!isValidPhoneNumber(phone.number)) {
      errors.push(`Telefone ${index + 1}: Número inválido`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
