// src/components/rbac/guards.tsx
import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmPermissions } from "@/Hooks/useFarmPermissions";
import { RoleEnum } from "@/Models/auth";

/** Mostra conteúdo apenas se estiver autenticado */
export function IfAuthenticated({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : null;
}

/**
 * Shows farm operations only after the backend resolves the capability for
 * the concrete farm. Role and owner ids are deliberately not used here.
 */
export function IfCanManage({
  farmId,
  children,
}: PropsWithChildren<{ farmId?: number }>) {
  const { isAuthenticated } = useAuth();
  const { canOperateFarm, loading } = useFarmPermissions(
    isAuthenticated ? farmId : undefined
  );

  return isAuthenticated && !loading && canOperateFarm ? <>{children}</> : null;
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
