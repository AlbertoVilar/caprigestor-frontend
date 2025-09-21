import { Navigate } from "react-router-dom";
import { JSX } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";

export type PrivateRouteProps = {
  children: JSX.Element;
  /** optional roles that are allowed to access this route */
  roles?: RoleEnum[];
};

export default function PrivateRoute({ children, roles = [] }: PrivateRouteProps) {
  const { isAuthenticated, tokenPayload, isLoading } = useAuth();

  // Aguarda o carregamento inicial do contexto
  if (isLoading) {
    console.log('⏳ AGUARDANDO CARREGAMENTO DO CONTEXTO...');
    return <div>Carregando...</div>;
  }

  // precisa estar autenticado
  if (!isAuthenticated) {
    console.log('❌ REDIRECIONANDO PARA LOGIN - Usuário não autenticado');
    return <Navigate to="/login" replace />;
  }

  // se roles foram informadas, precisa bater com pelo menos uma
  if (roles.length > 0) {
    const authorities = tokenPayload?.authorities ?? [];
    const allowed = roles.some((role) => authorities.includes(role));
    console.log('Verificando roles:', { roles, authorities, allowed });
    if (!allowed) {
      console.log('❌ REDIRECIONANDO PARA 403 - Usuário sem permissão');
      return <Navigate to="/403" replace />;
    }
  }

  console.log('✅ ACESSO PERMITIDO - Usuário autenticado e autorizado');

  return children;
}
