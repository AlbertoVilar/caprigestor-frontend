import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth-utils";
import { ReactElement } from "react";

interface PrivateRouteProps {
  children: ReactElement;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}
