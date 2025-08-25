// src/components/rbac/guards.tsx
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";

/** Mostra conteúdo apenas se estiver autenticado */
export function IfAuthenticated({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : null;
}

/** ADMIN sempre pode gerenciar; OPERADOR só se for dono do recurso */
export function IfCanManage({
  resourceOwnerId,
  children,
}: PropsWithChildren<{ resourceOwnerId?: number }>) {
  const { tokenPayload } = useAuth();
  if (!tokenPayload) return null;

  const roles = tokenPayload.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOwnerOperator =
    roles.includes(RoleEnum.ROLE_OPERATOR) &&
    resourceOwnerId === tokenPayload.userId;

  return isAdmin || isOwnerOperator ? <>{children}</> : null;
}

/** Mostra conteúdo apenas se tiver alguma dessas roles */
export function IfAnyRole({
  roles,
  children,
}: PropsWithChildren<{ roles: RoleEnum[] }>) {
  const { tokenPayload } = useAuth();
  const ok = !!tokenPayload?.authorities?.some((r) => roles.includes(r as RoleEnum));
  return ok ? <>{children}</> : null;
}
