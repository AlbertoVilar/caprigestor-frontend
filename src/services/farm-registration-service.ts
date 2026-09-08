import { createUser } from './user-service';
import { createAddress } from './address-service';
import { createPhone } from './phone-service';
import { createGoatFarm } from './goat-farm-service';
import { UserRequestDTO, UserResponseDTO } from '../types/user.types';
import { AddressRequestDTO, AddressResponseDTO } from '../types/address.types';
import { PhoneRequestDTO, PhoneResponseDTO } from '../types/phone.types';
import { GoatFarmRequestDTO, GoatFarmResponse } from '../types/goat-farm.types';
import { ApiError, ErrorCodes } from './goat-farm-service';

// Interface para os dados completos do formulário
export interface FarmRegistrationFormData {
  // Dados do usuário
  userName: string;
  userEmail: string;
  userPassword: string;
  userCpf: string;
  
  // Dados do endereço
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Dados do telefone
  phoneNumber: string;
  phoneType: 'MOBILE' | 'HOME' | 'WORK';
  
  // Dados da fazenda
  farmName: string;
  farmTod: string;
}

// Interface para o resultado do cadastro
export interface FarmRegistrationResult {
  user: UserResponseDTO;
  address: AddressResponseDTO;
  phone: PhoneResponseDTO;
  farm: GoatFarmResponse;
}

// Interface para erros de validação do formulário completo
export interface FarmRegistrationValidationErrors {
  userName?: string;
  userEmail?: string;
  userPassword?: string;
  userCpf?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phoneNumber?: string;
  phoneType?: string;
  farmName?: string;
  farmTod?: string;
}

/**
 * Registra uma fazenda completa seguindo o fluxo sequencial:
 * 1. Cadastrar usuário
 * 2. Cadastrar endereço
 * 3. Cadastrar telefone
 * 4. Cadastrar fazenda
 */
export const registerFarmComplete = async (formData: FarmRegistrationFormData): Promise<FarmRegistrationResult> => {
  try {
    // Validar todos os dados antes de iniciar o processo
    const validationErrors = validateFarmRegistrationData(formData);
    if (Object.keys(validationErrors).length > 0) {
      throw createApiError('Dados do formulário inválidos', 400, ErrorCodes.VALIDATION_ERROR, validationErrors);
    }
    
    // Passo 1: Cadastrar usuário
    const userData: UserRequestDTO = {
      name: formData.userName,
      email: formData.userEmail,
      password: formData.userPassword,
      cpf: formData.userCpf
    };
    const user = await createUser(userData);
    
    // Passo 2: Cadastrar endereço
    const addressData: AddressRequestDTO = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country
    };
    const address = await createAddress(addressData);
    
    // Passo 3: Cadastrar telefone
    const phoneData: PhoneRequestDTO = {
      number: formData.phoneNumber,
      type: formData.phoneType
    };
    const phone = await createPhone(phoneData);
    
    // Passo 4: Cadastrar fazenda
    const farmData: GoatFarmRequestDTO = {
      name: formData.farmName,
      tod: formData.farmTod,
      addressId: address.id,
      userId: user.id,
      phoneIds: [phone.id]
    };
    const farmResponse = await createGoatFarm(farmData);
    
    const result: FarmRegistrationResult = {
      user,
      address,
      phone,
      farm: farmResponse.data
    };
    
    return result;
    
  } catch (error: unknown) {
    const maybeApiError = typeof error === "object" && error !== null
      ? (error as Partial<ApiError>)
      : undefined;

    // Se o erro já é um ApiError, apenas repassa
    if (maybeApiError?.code && maybeApiError.status !== undefined) {
      throw maybeApiError;
    }

    const message = error instanceof Error
      ? error.message
      : 'Erro desconhecido no cadastro da fazenda';
    const status = typeof maybeApiError?.status === "number"
      ? maybeApiError.status
      : 500;

    // Caso contrário, cria um novo ApiError
    throw createApiError(
      message,
      status,
      ErrorCodes.SERVER_ERROR
    );
  }
};

/**
 * Valida todos os dados do formulário de cadastro
 */
export const validateFarmRegistrationData = (data: FarmRegistrationFormData): FarmRegistrationValidationErrors => {
  const errors: FarmRegistrationValidationErrors = {};
  
  // Validar dados do usuário
  if (!data.userName || data.userName.trim().length < 2) {
    errors.userName = 'Nome deve ter pelo menos 2 caracteres';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.userEmail || !emailRegex.test(data.userEmail)) {
    errors.userEmail = 'Email deve ter um formato válido';
  }
  
  if (!data.userPassword || data.userPassword.length < 6) {
    errors.userPassword = 'Senha deve ter pelo menos 6 caracteres';
  }
  
  if (!data.userCpf || data.userCpf.replace(/\D/g, '').length !== 11) {
    errors.userCpf = 'CPF deve ter 11 dígitos';
  }
  
  // Validar dados do endereço
  if (!data.street || data.street.trim().length < 5) {
    errors.street = 'Rua deve ter pelo menos 5 caracteres';
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'Cidade deve ter pelo menos 2 caracteres';
  }
  
  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'Estado deve ter pelo menos 2 caracteres';
  }
  
  const zipCodeRegex = /^\d{5}-?\d{3}$/;
  if (!data.zipCode || !zipCodeRegex.test(data.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'))) {
    errors.zipCode = 'CEP deve ter o formato 12345-678';
  }
  
  if (!data.country || data.country.trim().length < 2) {
    errors.country = 'País deve ter pelo menos 2 caracteres';
  }
  
  // Validar dados do telefone
  const cleanNumber = data.phoneNumber?.replace(/\D/g, '') || '';
  if (!data.phoneNumber || cleanNumber.length < 10 || cleanNumber.length > 11) {
    errors.phoneNumber = 'Número deve ter 10 ou 11 dígitos (com DDD)';
  }
  
  const validTypes = ['MOBILE', 'HOME', 'WORK'];
  if (!data.phoneType || !validTypes.includes(data.phoneType)) {
    errors.phoneType = 'Tipo deve ser MOBILE, HOME ou WORK';
  }
  
  // Validar dados da fazenda
  if (!data.farmName || data.farmName.trim().length < 2) {
    errors.farmName = 'Nome da fazenda deve ter pelo menos 2 caracteres';
  }
  
  if (!data.farmTod || data.farmTod.trim().length < 2) {
    errors.farmTod = 'Código da fazenda deve ter pelo menos 2 caracteres';
  }
  
  return errors;
};

/**
 * Cria um objeto de erro padronizado
 */
const createApiError = (
  message: string,
  status: number,
  code: ErrorCodes,
  details?: FarmRegistrationValidationErrors | Record<string, unknown>
): ApiError => {
  return {
    message,
    status,
    code,
    details,
  };
};
