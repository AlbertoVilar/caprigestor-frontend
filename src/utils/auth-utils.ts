
import { RoleEnum } from "@/Models/auth";
import { getAccessTokenPayload } from "@/services/auth-service";

export function isAdmin() {
  const payload = getAccessTokenPayload();
  return payload?.authorities?.includes(RoleEnum.ROLE_ADMIN);
}

export function isOperator() {
  const payload = getAccessTokenPayload();
  return payload?.authorities?.includes(RoleEnum.ROLE_OPERATOR);
}

export function isAuthenticated() {
  const payload = getAccessTokenPayload();
  return payload !== undefined && payload.exp * 1000 > Date.now();
}
