// Interfaces para cadastro de fazenda de cabras

// Interface para dados básicos da fazenda
export interface GoatFarmData {
  name: string; // obrigatório
  tod?: string; // opcional, mas deve ter exatamente 5 caracteres se informado
}

// Interface para cadastro simples de fazenda
export interface GoatFarmRequestDTO {
  name: string; // obrigatório
  tod?: string; // 5 caracteres exatos, opcional
  addressId: number; // obrigatório
  userId: number; // obrigatório
  phoneIds: number[]; // array de números (mín. 1 item)
}

// Interface para dados do usuário no cadastro completo
export interface UserData {
  name: string; // 2-100 chars, obrigatório
  email: string; // formato email, obrigatório
  cpf: string; // 11 dígitos, obrigatório
  password: string; // mín. 6 chars, obrigatório
  confirmPassword: string; // obrigatório
  roles: string[]; // array (mín. 1 role, ex: ROLE_OPERATOR)
}

// Interface para dados do endereço
export interface AddressData {
  street: string; // máx. 255 chars, obrigatório
  neighborhood: string; // máx. 100 chars, obrigatório
  city: string; // máx. 100 chars, obrigatório
  state: string; // máx. 50 chars, obrigatório
  postalCode: string; // formato XXXXX-XXX, obrigatório
  country: string; // máx. 100 chars, obrigatório
}

// Interface para dados do telefone
export interface PhoneData {
  ddd: string; // 2 dígitos, obrigatório
  number: string; // 8-9 dígitos, obrigatório
}

// Interface para cadastro completo de fazenda
export interface GoatFarmFullRequestDTO {
  farm: GoatFarmData;
  user: UserData;
  address: AddressData;
  phones: PhoneData[];
}

// Interface para resposta da API
export interface GoatFarmResponse {
  id: number;
  name: string;
  tod?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para erros de validação
export interface GoatFarmValidationError {
  field: string;
  message: string;
}

// Interface para resposta de erro da API
export interface GoatFarmApiError {
  status: number;
  message: string;
  errors?: GoatFarmValidationError[];
}

// Tipos para roles disponíveis
export type UserRole = 'ROLE_ADMIN' | 'ROLE_OPERATOR' | 'ROLE_USER';

// Interface para dados do formulário (frontend)
export interface GoatFarmFormData {
  // Dados da fazenda
  farmName: string;
  farmTod: string;
  
  // Dados do usuário
  userName: string;
  userEmail: string;
  userCpf: string;
  userPassword: string;
  userConfirmPassword: string;
  userRoles: UserRole[];
  
  // Dados do endereço
  addressStreet: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressPostalCode: string;
  addressCountry: string;
  
  // Dados dos telefones
  phones: PhoneData[];
}