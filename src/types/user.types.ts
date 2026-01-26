// Interfaces para o serviço de usuários

export interface UserRequestDTO {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  cpf: string;
  roles?: string[];
}

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  cpf: string;
  createdAt: string;
}

export interface UserValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  cpf?: string;
}
