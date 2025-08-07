export interface CredentialsDTO {
  username: string;
  password: string;
}

export interface AccessTokenPayloadDTO {
  user_name: string;
  authorities: string[];
  exp: number;
}

export enum RoleEnum {
  ROLE_ADMIN = "ROLE_ADMIN",
  ROLE_OWNER = "ROLE_OWNER",
}
