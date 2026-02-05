import { useEffect, useState } from "react";
import { getAccessToken, isAuthenticated, getAccessTokenPayload } from "../../services/auth-service";

type TokenPayload = {
  sub?: string;
  authorities?: string[];
};

type TokenInfo = {
  hasToken: boolean;
  tokenLength: number;
  isAuthenticated: boolean;
  payload: TokenPayload | null;
  tokenPreview: string;
};

export default function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const authenticated = isAuthenticated();
    const payload = getAccessTokenPayload() as TokenPayload | null;
    
    setTokenInfo({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isAuthenticated: authenticated,
      payload: payload,
      tokenPreview: token ? token.substring(0, 50) + "..." : "Nenhum token"
    });
  }, []);

  if (!tokenInfo) return null;

  return (
    <div style={{
      position: "fixed",
      top: "10px",
      right: "10px",
      background: "#f0f0f0",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      fontSize: "12px",
      zIndex: 9999,
      maxWidth: "300px"
    }}>
      <h4>🔍 Debug Token</h4>
      <p><strong>Token presente:</strong> {tokenInfo.hasToken ? "✅ SIM" : "❌ NÃO"}</p>
      <p><strong>Tamanho:</strong> {tokenInfo.tokenLength} chars</p>
      <p><strong>Autenticado:</strong> {tokenInfo.isAuthenticated ? "✅ SIM" : "❌ NÃO"}</p>
      <p><strong>Preview:</strong> {tokenInfo.tokenPreview}</p>
      {tokenInfo.payload && (
        <div>
          <p><strong>Usuário:</strong> {tokenInfo.payload.sub}</p>
          <p><strong>Roles:</strong> {tokenInfo.payload.authorities?.join(", ")}</p>
        </div>
      )}
    </div>
  );
}
