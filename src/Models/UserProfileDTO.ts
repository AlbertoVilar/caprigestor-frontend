// Modelo de dados para o usuário expandido (substitui OwnerRequestDTO)
// Alinhado com a refatoração Owner → User do backend

export interface UserProfile {
  id: number;
  name: string;          // Mantém 'name' (não 'nome')
  email: string;
  cpf?: string;          // Opcional
  roles: string[];       // Obrigatório - ["ROLE_ADMIN", "ROLE_OPERATOR"]
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  name: string;          // Obrigatório
  email: string;         // Obrigatório
  password: string;      // Obrigatório na criação
  cpf?: string;          // Opcional
  roles: string[];       // Obrigatório - padrão: ["ROLE_OPERATOR"]
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  cpf?: string;
  roles?: string[];
  // password não é atualizado por este endpoint
}

// Interface para compatibilidade com FarmCreateRequest
// Mantém a estrutura 'owner' mas usa dados do User
export interface OwnerCompatibility {
  id?: number;
  name: string;
  cpf: string;
  email: string;
}

// Função utilitária para converter UserProfile em OwnerCompatibility
export function userToOwnerCompatibility(user: UserProfile): OwnerCompatibility {
  return {
    id: user.id,
    name: user.name,
    cpf: user.cpf || "",
    email: user.email,
  };
}