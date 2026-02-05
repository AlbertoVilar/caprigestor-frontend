import { GoatFarmFullRequest } from "../Models/FarmCreateRequestDTO";

export interface ValidationError {
  field: string;
  message: string;
}

export class FarmValidation {
  static validateFarmData(data: GoatFarmFullRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validações da fazenda
    errors.push(...this.validateFarm(data.farm));

    // Validações do usuário
    errors.push(...this.validateUser(data.user));

    // Validações do endereço
    errors.push(...this.validateAddress(data.address));

    // Validações dos telefones
    errors.push(...this.validatePhones(data.phones));

    return errors;
  }

  private static validateFarm(farm: { name: string; tod: string }): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!farm.name || farm.name.trim().length < 2) {
      errors.push({ field: 'farm.name', message: 'Nome da fazenda deve ter pelo menos 2 caracteres' });
    }

    if (farm.name && farm.name.length > 100) {
      errors.push({ field: 'farm.name', message: 'Nome da fazenda deve ter no máximo 100 caracteres' });
    }

    if (farm.tod && farm.tod.length > 50) {
      errors.push({ field: 'farm.tod', message: 'TOD deve ter no máximo 50 caracteres' });
    }

    return errors;
  }

  private static validateUser(user: GoatFarmFullRequest["user"]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!user.name || user.name.trim().length < 2) {
      errors.push({ field: 'user.name', message: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (user.name && user.name.length > 100) {
      errors.push({ field: 'user.name', message: 'Nome deve ter no máximo 100 caracteres' });
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push({ field: 'user.email', message: 'Email deve ter um formato válido' });
    }

    if (!user.cpf || !this.isValidCPF(user.cpf)) {
      errors.push({ field: 'user.cpf', message: 'CPF deve ter um formato válido' });
    }

    if (!user.password || user.password.length < 6) {
      errors.push({ field: 'user.password', message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    if ("confirmPassword" in user) {
      const confirmPassword = (user as { confirmPassword?: string }).confirmPassword;
      if (user.password !== confirmPassword) {
        errors.push({ field: 'user.confirmPassword', message: 'Senhas não coincidem' });
      }
    }

    return errors;
  }

  private static validateAddress(address: GoatFarmFullRequest["address"]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!address.street || address.street.trim().length < 5) {
      errors.push({ field: 'address.street', message: 'Rua deve ter pelo menos 5 caracteres' });
    }

    if (!address.city || address.city.trim().length < 2) {
      errors.push({ field: 'address.city', message: 'Cidade deve ter pelo menos 2 caracteres' });
    }

    if (!address.state || address.state.trim().length < 2) {
      errors.push({ field: 'address.state', message: 'Estado deve ter pelo menos 2 caracteres' });
    }

    if (!address.zipCode || !this.isValidCEP(address.zipCode)) {
      errors.push({ field: 'address.zipCode', message: 'CEP deve ter formato válido (12345678 ou 12345-678)' });
    }

    if (!address.country || address.country.trim().length < 2) {
      errors.push({ field: 'address.country', message: 'País deve ter pelo menos 2 caracteres' });
    }

    return errors;
  }

  private static validatePhones(phones: GoatFarmFullRequest["phones"]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!phones || phones.length === 0) {
      errors.push({ field: 'phones', message: 'Pelo menos um telefone deve ser informado' });
      return errors;
    }

    phones.forEach((phone, index) => {
      if (!phone.ddd || !this.isValidDDD(phone.ddd)) {
        errors.push({ field: `phones[${index}].ddd`, message: 'DDD deve ter 2 dígitos válidos' });
      }

      if (!phone.number || !this.isValidPhoneNumber(phone.number)) {
        errors.push({ field: `phones[${index}].number`, message: 'Número de telefone deve ter 8 ou 9 dígitos' });
      }
    });

    return errors;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF.charAt(9)) && digit2 === parseInt(cleanCPF.charAt(10));
  }

  private static isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(cleanCEP);
  }

  private static isValidDDD(ddd: string): boolean {
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    return validDDDs.includes(ddd);
  }

  private static isValidPhoneNumber(number: string): boolean {
    const cleanNumber = number.replace(/\D/g, '');
    return /^\d{8,9}$/.test(cleanNumber);
  }
}
