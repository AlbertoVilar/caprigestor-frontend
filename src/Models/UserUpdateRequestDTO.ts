export interface UserUpdateRequest {
  name: string;
  email: string;
  cpf: string;
  password?: string;
  confirmPassword?: string;
  roles?: string[];
}