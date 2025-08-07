import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { RoleEnum } from "../Models/auth";
import { JSX } from "react";

interface Props {
  children: JSX.Element;
  roles?: RoleEnum[]; // Roles permitidas
}

export default function PrivateRoute({ children, roles = [] }: Props) {
  const { isAuthenticated, tokenPayload } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    roles.length > 0 &&
    (!tokenPayload || !roles.some(role => tokenPayload.authorities.includes(role)))
  ) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
