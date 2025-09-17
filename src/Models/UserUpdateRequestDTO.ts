export interface UserUpdateRequest {
  id: number;
  name: string;
  email: string;
  cpf: string;
  password?: string;
  confirmPassword?: string;
  roles: string[];
}