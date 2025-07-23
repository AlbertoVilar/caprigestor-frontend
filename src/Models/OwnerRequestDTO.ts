export interface OwnerRequest {
  id?: number;
  name: string;
  cpf: string; // ← tornamos opcional
  email: string;
}

