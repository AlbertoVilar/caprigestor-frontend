// 🏗️ Interfaces para o Sistema de Cadastro de Fazenda

// ===== INTERFACES DE REQUEST =====

/**
 * Interface para dados da fazenda no request (GoatFarmRequestDTO)
 */
export interface FarmData {
  name: string;
  tod?: string; // Código TOD (opcional, exatamente 5 caracteres)
}

/**
 * Interface para dados do usuário no request (UserRequestDTO)
 */
export interface UserData {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface para dados do endereço no request (AddressRequestDTO)
 */
export interface AddressData {
  street: string;
  complement?: string;
  neighborhood: string; // era 'district', mas backend usa 'neighborhood'
  city: string;
  state: string;
  zipCode: string; // backend espera 'zipCode' (CEP)
  country: string;
}

/**
 * Interface para dados do telefone no request (PhoneRequestDTO)
 */
export interface PhoneData {
  ddd: string; // código de área
  number: string;
  type?: 'MOBILE' | 'LANDLINE' | 'WHATSAPP'; // opcional no backend
}

/**
 * Interface principal para o request completo de criação de fazenda
 */
export interface GoatFarmFullRequest {
  farm: FarmData;
  user: UserData;
  address: AddressData;
  phones: PhoneData[];
}

// ===== INTERFACES DE RESPONSE =====

/**
 * Interface para fazenda na response
 */
export interface FarmResponse {
  id: number;
  name: string;
  description: string;
  totalArea: number;
  usableArea: number;
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para usuário na response
 */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  cpf: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para endereço na response
 */
export interface AddressResponse {
  id: number;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para telefone na response
 */
export interface PhoneResponse {
  id: number;
  ddd: string;
  number: string;
  type?: 'MOBILE' | 'LANDLINE' | 'WHATSAPP';
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface principal para a response completa de criação de fazenda
 */
export interface GoatFarmFullResponse {
  farm: FarmResponse;
  user: UserResponse;
  address: AddressResponse;
  phones: PhoneResponse[];
}

// ===== INTERFACES PARA FORMULÁRIO =====

/**
 * Interface para estado do formulário de criação de capril
 */
export interface FarmFormState {
  // Dados do capril
  farmName: string;
  farmTod: string; // Código TOD do capril
  
  // Usuário
  userName: string;
  userEmail: string;
  userCpf: string;
  userPassword: string;
  userConfirmPassword: string;
  
  // Endereço
  addressStreet: string;
  addressComplement: string;
  addressNeighborhood: string; // mudou de addressDistrict
  addressCity: string;
  addressState: string;
  addressPostalCode: string; // mudou de addressCep
  addressCountry: string;
  
  // Telefones
  phones: PhoneFormData[];
}

/**
 * Interface para dados de telefone no formulário
 */
export interface PhoneFormData {
  id: string;
  ddd: string; // código de área
  number: string;
  type?: 'MOBILE' | 'LANDLINE' | 'WHATSAPP';
}

/**
 * Etapas do formulário multi-step (quando usado)
 */
export type FormStep = 'farm' | 'user' | 'address' | 'phones';

// ===== INTERFACES PARA VALIDAÇÃO =====

/**
 * Interface para erros de validação
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

// ===== TIPOS AUXILIARES =====

/**
 * Tipos de telefone disponíveis
 */
export type PhoneType = 'MOBILE' | 'LANDLINE' | 'WHATSAPP';

/**
 * Estados brasileiros
 */
export type BrazilianState = 
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' 
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' 
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

/**
 * Interface para opções de select
 */
export interface SelectOption {
  value: string;
  label: string;
}

// ===== CONSTANTES =====

/**
 * Opções de tipo de telefone para o formulário
 */
export const PHONE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'MOBILE', label: 'Celular' },
  { value: 'LANDLINE', label: 'Fixo' },
  { value: 'WHATSAPP', label: 'WhatsApp' }
];

/**
 * Opções de estados brasileiros
 */
export const BRAZILIAN_STATES: SelectOption[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];
