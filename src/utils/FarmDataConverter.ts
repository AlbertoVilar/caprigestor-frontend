// 🔄 Conversor de dados para fazenda

import { FarmFormState, GoatFarmFullRequest } from '../types/farmTypes';

/**
 * Classe responsável pela conversão de dados entre formulário e API
 */
export class FarmDataConverter {
  
  /**
   * Converte dados do formulário para o formato da API
   * @param formData - Dados do formulário
   * @returns Dados no formato da API
   */
  static formToApiRequest(formData: FarmFormState): GoatFarmFullRequest {
    const farmData = {
      name: formData.farmName.trim(),
      tod: formData.farmTod.trim()
    };
    
    return {
      farm: farmData,
      user: {
        name: formData.userName.trim(),
        email: formData.userEmail.trim().toLowerCase(),
        cpf: this.cleanCPF(formData.userCpf),
        password: formData.userPassword,
        confirmPassword: formData.userConfirmPassword,
        roles: [formData.userRoles]
      },
      address: {
        street: formData.addressStreet.trim(),
        complement: formData.addressComplement?.trim() || undefined,
        neighborhood: formData.addressNeighborhood.trim(),
        city: formData.addressCity.trim(),
        state: formData.addressState.trim().toUpperCase(),
        zipCode: this.cleanCEP(formData.addressPostalCode),
        country: formData.addressCountry.trim()
      },
      phones: formData.phones.map(phone => ({
        ddd: phone.ddd.trim(),
        number: this.cleanPhone(phone.number)
      }))
    };
  }
  
    /**
   * Formata CPF para exibição (XXX.XXX.XXX-XX)
   * @param cpf - CPF sem formatação
   * @returns CPF formatado
   */
  static formatCPF(cpf: string | null | undefined): string {
    if (!cpf) {
      return '';
    }
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
   * Formata CEP para exibição (XXXXX-XXX)
   * @param cep - CEP sem formatação
   * @returns CEP formatado
   */
  static formatCEP(cep: string | null | undefined): string {
    if (!cep) {
      return '';
    }
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length <= 5) {
      return cleanCEP;
    } else {
      return `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5, 8)}`;
    }
  }
  
  /**
   * Formata telefone para exibição ((XX) XXXXX-XXXX ou (XX) XXXX-XXXX)
   * @param phone - Telefone sem formatação
   * @returns Telefone formatado
   */
  static formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length <= 2) {
      return cleanPhone;
    } else if (cleanPhone.length <= 6) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
    } else if (cleanPhone.length <= 10) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
    } else {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
    }
  }
  
  /**
   * Formata valor monetário para exibição
   * @param value - Valor numérico
   * @returns Valor formatado em reais
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  /**
   * Formata área para entrada no formulário (aceita string)
   * @param area - Área como string
   * @returns Área formatada para exibição
   */
  static formatArea(area: string): string {
    const cleanArea = area.replace(/[^0-9,.,]/g, '');
    const normalizedArea = cleanArea.replace(',', '.');
    
    if (!normalizedArea || normalizedArea === '.') {
      return '';
    }
    
    // Limita a 2 casas decimais
    const parts = normalizedArea.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return normalizedArea;
  }
  
  /**
   * Remove formatação do CPF
   * @param cpf - CPF formatado
   * @returns CPF apenas com números
   */
  static cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
  
  /**
   * Remove formatação do CEP
   * @param cep - CEP formatado
   * @returns CEP apenas com números
   */
  static cleanCEP(cep: string): string {
    return cep.replace(/\D/g, '');
  }
  
  /**
   * Remove formatação do telefone e código do país se presente
   * @param phone - Telefone formatado
   * @returns Telefone apenas com números (sem código do país)
   */
  static cleanPhone(phone: string): string {
    let cleanNumber = phone.replace(/\D/g, '');
    
    // Remove código do país (55) se presente no início
    if (cleanNumber.startsWith('55') && cleanNumber.length > 10) {
      cleanNumber = cleanNumber.substring(2);
    }
    
    return cleanNumber;
  }
  
  /**
   * Converte string para número com tratamento de erro
   * @param value - String a ser convertida
   * @param defaultValue - Valor padrão em caso de erro
   * @returns Número convertido
   */
  static parseNumber(value: string, defaultValue: number = 0): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  /**
   * Capitaliza primeira letra de cada palavra
   * @param text - Texto a ser capitalizado
   * @returns Texto capitalizado
   */
  static capitalizeWords(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Valida e limita o comprimento de um texto
   * @param text - Texto a ser validado
   * @param maxLength - Comprimento máximo
   * @returns Texto limitado
   */
  static limitText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }
  
  /**
   * Gera um ID único para telefones
   * @returns ID único
   */
  static generatePhoneId(): string {
    return `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Cria um novo telefone vazio/**
   * Cria um objeto de telefone vazio
   */
  static createEmptyPhone() {
    return {
      id: this.generatePhoneId(),
      ddd: '',
      number: '',
      type: 'MOBILE' as const
    };
  }
  
  /**
   * Converte string de área para número
   * @param areaString - String da área
   * @returns Número da área ou undefined se inválido
   */
  static parseAreaFromString(areaString: string): number | undefined {
    if (!areaString || areaString.trim() === '') {
      return undefined;
    }
    
  const cleanArea = areaString.replace(/[^0-9,.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanArea);
    
    return !isNaN(parsed) && isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  /**
   * Valida se um valor é um número válido
   * @param value - Valor a ser validado
   * @returns true se for um número válido
   */
  static isValidNumber(value: string): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num > 0;
  }
  
  /**
   * Converte data para formato brasileiro
   * @param date - Data em formato ISO
   * @returns Data formatada (DD/MM/AAAA)
   */
  static formatDate(date: string): string {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  }
  
  /**
   * Converte data e hora para formato brasileiro
   * @param datetime - Data e hora em formato ISO
   * @returns Data e hora formatadas (DD/MM/AAAA HH:mm)
   */
  static formatDateTime(datetime: string): string {
    try {
      const dateObj = new Date(datetime);
      return dateObj.toLocaleString('pt-BR');
    } catch {
      return datetime;
    }
  }
}

export default FarmDataConverter;