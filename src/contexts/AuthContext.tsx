// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AccessTokenPayloadDTO } from "../Models/auth";
import {
  getAccessTokenPayload,
  saveAccessToken,
  logOut,
} from "../services/auth-service";

type AuthContextType = {
  tokenPayload?: AccessTokenPayloadDTO;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokenPayload: (payload: AccessTokenPayloadDTO | undefined) => void;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  tokenPayload: undefined,
  isAuthenticated: false,
  isLoading: true,
  setTokenPayload: () => {},
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenPayload, setTokenPayload] = useState<
    AccessTokenPayloadDTO | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Timer para deslogar automaticamente quando o exp do token chegar
  const expTimer = useRef<number | undefined>(undefined);

  function clearExpiryTimer() {
    if (expTimer.current) {
      window.clearTimeout(expTimer.current);
      expTimer.current = undefined;
    }
  }

  function scheduleExpiryCheck(payload?: AccessTokenPayloadDTO) {
    clearExpiryTimer();
    if (!payload?.exp) return; // se não tiver exp, não agenda (válido enquanto houver token)
    const ms = payload.exp * 1000 - Date.now();
    if (ms <= 0) {
      // já expirou
      setTokenPayload(undefined);
      return;
    }
    // pequeno buffer de 500ms para evitar race conditions
    expTimer.current = window.setTimeout(() => {
      setTokenPayload(undefined);
    }, ms + 500);
  }

  // Inicializa a partir do localStorage e escuta mudanças entre abas
  useEffect(() => {
    const initial = getAccessTokenPayload();
    setTokenPayload(initial);
    scheduleExpiryCheck(initial);
    setIsLoading(false); // Marca como carregado após inicialização

    const onStorage = () => {
      const updated = getAccessTokenPayload();
      setTokenPayload(updated);
      scheduleExpiryCheck(updated);
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearExpiryTimer();
    };
  }, []);

  // Se o exp mudar (novo login/refresh), reagenda o timer
  useEffect(() => {
    scheduleExpiryCheck(tokenPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenPayload?.exp]);

  const isAuthenticated = useMemo(() => {
    if (!tokenPayload) return false;
    if (!tokenPayload.exp) return true;
    return tokenPayload.exp * 1000 > Date.now();
  }, [tokenPayload]);

  const login = (token: string) => {
    saveAccessToken(token);
    const payload = getAccessTokenPayload();
    setTokenPayload(payload);
  };

  const logout = () => {
    logOut();
    setTokenPayload(undefined);
  };

  const value = useMemo(
    () => ({ tokenPayload, isAuthenticated, isLoading, setTokenPayload, login, logout }),
    [tokenPayload, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
