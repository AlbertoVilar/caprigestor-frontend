import { useAuth } from "../contexts/AuthContext";
import { getAccessTokenPayload } from "../services/auth-service";

export default function AuthDebugger() {
  const { tokenPayload, isAuthenticated } = useAuth();
  const rawPayload = getAccessTokenPayload();

  if (!isAuthenticated) {
    return (
      <div style={{ 
        position: "fixed", 
        top: "10px", 
        right: "10px", 
        background: "#f0f0f0", 
        padding: "10px", 
        border: "1px solid #ccc",
        fontSize: "12px",
        maxWidth: "300px",
        zIndex: 9999
      }}>
        <h4>Auth Debug - Não autenticado</h4>
      </div>
    );
  }

  return (
    <div style={{ 
      position: "fixed", 
      top: "10px", 
      right: "10px", 
      background: "#f0f0f0", 
      padding: "10px", 
      border: "1px solid #ccc",
      fontSize: "12px",
      maxWidth: "300px",
      zIndex: 9999
    }}>
      <h4>Auth Debug</h4>
      <p><strong>Usuário:</strong> {tokenPayload?.user_name}</p>
      <p><strong>Authorities:</strong></p>
      <ul>
        {tokenPayload?.authorities?.map((auth, index) => (
          <li key={index}>{auth}</li>
        ))}
      </ul>
      <p><strong>UserId:</strong> {tokenPayload?.userId}</p>
      <p><strong>Exp:</strong> {new Date((tokenPayload?.exp || 0) * 1000).toLocaleString()}</p>
      
      <details>
        <summary>Raw Token Data</summary>
        <pre style={{ fontSize: "10px", overflow: "auto", maxHeight: "200px" }}>
          {JSON.stringify(rawPayload, null, 2)}
        </pre>
      </details>
    </div>
  );
}