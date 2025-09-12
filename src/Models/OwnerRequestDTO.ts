export interface OwnerRequest {
  id?: number;
  name: string;
  cpf: string;
  email: string;
  password: string;
  confirmPassword: string;
  roles: string[];
}

