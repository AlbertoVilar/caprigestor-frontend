import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";
import { LoadingState } from "../ui";

export type PrivateRouteProps = {
  children: JSX.Element;
  roles?: RoleEnum[];
};

export default function PrivateRoute({ children, roles = [] }: PrivateRouteProps) {
  const { isAuthenticated, tokenPayload, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Verificando permissões..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0) {
    const authorities = tokenPayload?.authorities ?? [];
    const allowed = roles.some((role) => authorities.includes(role));

    if (!allowed) {
      return (
        <Navigate
          to="/403"
          replace
          state={{
            from: location.pathname,
            requiredRoles: roles,
            currentRoles: authorities,
          }}
        />
      );
    }
  }

  return children;
}
