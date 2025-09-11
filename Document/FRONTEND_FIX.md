# 🚨 CORREÇÃO DO ERRO 500 NO FRONTEND

## Problema Identificado
O frontend está fazendo requisições para `localhost:5173` (sua própria porta) em vez de `localhost:8080` (porta do backend Spring Boot).

## Erro Atual
```
POST http://localhost:5173/api/auth/login 500 (Internal Server Error)
```

## Solução

### 1. Configurar URL Base da API

No seu arquivo `auth-service.ts`, certifique-se de que a URL base está correta:

```typescript
// ❌ ERRADO - usando porta do frontend
const API_BASE_URL = 'http://localhost:5173/api';

// ✅ CORRETO - usando porta do backend
const API_BASE_URL = 'http://localhost:8080/api';

// Ou melhor ainda, usando variável de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### 2. Exemplo de Configuração Correta

```typescript
// auth-service.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginRequest = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### 3. Configuração com Variáveis de Ambiente

Crie um arquivo `.env` no seu projeto frontend:

```env
VITE_API_URL=http://localhost:8080/api
```

E use no código:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

### 4. Verificação

Após a correção, a requisição deve ser:
```
POST http://localhost:8080/api/auth/login
```

## Backend Já Configurado

O backend Spring Boot já está:
- ✅ Rodando na porta 8080
- ✅ Configurado para aceitar CORS do localhost:5173
- ✅ Endpoint `/api/auth/login` funcionando
- ✅ Credenciais de teste disponíveis:
  - Email: albertovilar1@gmail.com
  - Senha: 132747

## Teste Rápido

Para testar se o backend está funcionando, execute:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"albertovilar1@gmail.com","password":"132747"}'
```

Deve retornar um token JWT válido.