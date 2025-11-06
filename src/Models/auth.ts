// src/Models/auth.ts
export interface CredentialsDTO {
  email: string;
  password: string;
}

export interface AccessTokenPayloadDTO {
  user_name: string;        // pode vir como user_name/userName/sub -> normalizamos no serviço
  authorities: string[];    // ex.: ["ROLE_ADMIN", "ROLE_OPERATOR"]
  exp: number;              // epoch (s)
  userId: number;           // usado pra regra de propriedade

  // opcionais (se o backend enviar):
  userEmail?: string;
  userName?: string;
}

export enum RoleEnum {
  ROLE_ADMIN = "ROLE_ADMIN",
  ROLE_OPERATOR = "ROLE_OPERATOR",
  // (Opcional) use se seu app precisa de público autenticado/minimal
  ROLE_PUBLIC = "ROLE_PUBLIC",
}
