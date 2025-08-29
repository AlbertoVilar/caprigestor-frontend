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
  const { isAuthenticated, tokenPayload } = useAuth();

  // precisa estar autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // se roles foram informadas, precisa bater com pelo menos uma
  if (roles.length > 0) {
    const authorities = tokenPayload?.authorities ?? [];
    const allowed = roles.some((role) => authorities.includes(role));
    if (!allowed) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
