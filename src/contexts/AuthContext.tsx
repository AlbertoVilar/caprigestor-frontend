import { createContext, useContext, useEffect, useState } from "react";
import { AccessTokenPayloadDTO } from "../Models/auth";
import { getAccessTokenPayload, isAuthenticated } from "../services/auth-service";

interface AuthContextType {
  tokenPayload: AccessTokenPayloadDTO | undefined;
  setTokenPayload: (payload: AccessTokenPayloadDTO | undefined) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  tokenPayload: undefined,
  setTokenPayload: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenPayload, setTokenPayload] = useState<AccessTokenPayloadDTO | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated()) {
      const payload = getAccessTokenPayload();
      setTokenPayload(payload);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        tokenPayload,
        setTokenPayload,
        isAuthenticated: tokenPayload !== undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
