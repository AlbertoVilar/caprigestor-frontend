# Análise do AuthService Atual vs Documentação

## 🔍 Diferenças Identificadas

### 1. **Método de Autenticação**

**Código Atual:**
- Usa OAuth2 com `grant_type: "password"`
- Client credentials (CLIENT_ID + CLIENT_SECRET)
- Endpoint: `/oauth2/token`
- Formato: `application/x-www-form-urlencoded`

**Documentação:**
- JWT simples
- Endpoint: `/api/auth/login`
- Formato: `application/json`

### 2. **Estrutura de Token**

**Código Atual:**
- Decodifica JWT manualmente
- Suporte a múltiplos formatos de claims (`user_name`, `userName`, `sub`)
- Normalização de authorities
- Campos: `userId`, `userEmail`, `userName`

**Documentação:**
- Estrutura mais simples
- Apenas `accessToken` e `refreshToken`

### 3. **Endpoints Públicos**

**Código Atual:**
- ❌ Não implementa verificação de endpoints públicos
- ❌ Não tem método `isPublicEndpoint`
- ❌ Não tem método `getAuthHeaders`

**Documentação:**
- ✅ Lista de endpoints públicos
- ✅ Método `isPublicEndpoint`
- ✅ Método `getAuthHeaders`
- ✅ GETs são públicos por padrão

## 🔧 Ajustes Necessários

### 1. **Adicionar Verificação de Endpoints Públicos**

```typescript
// Adicionar ao auth-service.ts
private readonly PUBLIC_ENDPOINTS = [
  '/oauth2/token',
  '/oauth/token', 
  '/api/auth/register-farm',
];

// Verifica se endpoint é público
isPublicEndpoint(url: string, method: string): boolean {
  // Todos os endpoints GET são públicos (visualização do catálogo)
  if (method === 'GET') {
    return true;
  }
  
  // Endpoints específicos de auth são públicos
  return this.PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

// Retorna headers de auth apenas para endpoints protegidos
getAuthHeaders(url: string = '', method: string = 'GET'): Record<string, string> {
  if (this.isPublicEndpoint(url, method)) {
    return {}; // Sem token para endpoints públicos
  }
  
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

### 2. **Melhorar Método getCurrentUser**

```typescript
// Adicionar método para obter usuário atual
export function getCurrentUser(): CurrentUser | null {
  const payload = getAccessTokenPayload();
  if (!payload) return null;

  return {
    id: payload.userId,
    username: payload.user_name,
    email: payload.userEmail,
    roles: payload.authorities,
  };
}

interface CurrentUser {
  id: number;
  username: string;
  email?: string;
  roles: string[];
}
```

### 3. **Adicionar Método de Refresh Token**

```typescript
// Se o backend suportar refresh token OAuth2
export async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('Refresh token não encontrado');
  }

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Basic " + window.btoa(CLIENT_ID + ":" + CLIENT_SECRET),
  };

  const data = qs.stringify({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/oauth2/token",
    data,
    headers,
  };

  try {
    const response = await requestBackEnd(config);
    saveAccessToken(response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
  } catch (error) {
    logOut();
    throw new Error('Falha ao renovar token');
  }
}
```

## 🎯 Recomendações

### **Opção 1: Manter OAuth2 (Recomendado)**

Se o backend já está configurado com OAuth2:

1. ✅ **Manter** o código atual do `loginRequest`
2. ➕ **Adicionar** métodos de endpoints públicos
3. ➕ **Adicionar** método `getCurrentUser`
4. ➕ **Adicionar** método `refreshToken` se suportado
5. 🔄 **Atualizar** documentação para refletir OAuth2

### **Opção 2: Migrar para JWT Simples**

Se quiser seguir a documentação:

1. 🔄 **Alterar** backend para JWT simples
2. 🔄 **Alterar** `loginRequest` para usar `/api/auth/login`
3. 🔄 **Simplificar** estrutura de token
4. ➕ **Adicionar** métodos de endpoints públicos

## 🚀 Próximos Passos

1. **Decidir** qual abordagem seguir (OAuth2 vs JWT simples)
2. **Implementar** métodos de endpoints públicos
3. **Testar** integração com o backend
4. **Atualizar** documentação conforme necessário
5. **Implementar** no `requestBackEnd` utility

## ⚠️ Pontos de Atenção

- **Segurança**: CLIENT_SECRET não deve estar no frontend em produção
- **CORS**: Verificar configuração para endpoints OAuth2
- **Refresh Token**: Implementar se o backend suportar
- **Error Handling**: Melhorar tratamento de erros OAuth2