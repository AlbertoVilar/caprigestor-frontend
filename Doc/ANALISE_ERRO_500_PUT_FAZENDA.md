# Análise do Erro 500 - PUT /goatfarms/1

## 🚨 Erro Detectado

**Frontend Console:**
```
PUT http://localhost:8080/api/goatfarms/1 500 (Internal Server Error)
```

**Payload enviado pelo frontend:**
```
{user: {…}, address: {…}, phones: Array(1), farm: {…}}
```

## 🔍 Análise do Problema

Baseado no erro 500 e na estrutura do payload, o problema está na **estrutura incorreta** enviada pelo frontend:

### ❌ Estrutura Atual (Frontend)
```json
{
  "user": { ... },
  "address": { ... },
  "phones": [ ... ],
  "farm": { ... }
}
```

### ✅ Estrutura Esperada (Backend)
```json
{
  "farm": {
    "id": 1,
    "nome": "...",
    "tod": "..."
  },
  "user": {
    "id": 1,
    "name": "...",
    "email": "...",
    "cpf": "...",
    "roles": ["ROLE_OPERATOR", "ROLE_ADMIN"]
  },
  "address": {
    "rua": "...",
    "cidade": "...",
    "estado": "...",
    "zipCode": "...",
    "pais": "...",
    "bairro": "..."
  },
  "phones": [
    {
      "id": 1,
      "ddd": "11",
      "number": "999999999"
    }
  ]
}
```

## 🛠️ Problemas Identificados

1. **Campo `zipCode` vs `postalCode`**: Backend espera `zipCode`
2. **Campo `number` vs `numero`**: Backend espera `number` nos telefones
3. **IDs obrigatórios**: Faltam IDs em `farm`, `user` e `phones`
4. **Campo `roles`**: Obrigatório no objeto `user`
5. **Validações**: Campos como `cpf`, `tod`, `zipCode` têm validações específicas

## 🔧 Correções Necessárias no Frontend

### 1. Atualizar Interface TypeScript
```typescript
interface UpdateGoatFarmRequest {
  farm: {
    id: number;
    nome: string;
    tod: string; // máximo 10 caracteres
  };
  user: {
    id: number;
    name: string;
    email: string;
    cpf: string; // formato: XXX.XXX.XXX-XX
    roles: string[];
  };
  address: {
    rua: string;
    cidade: string;
    estado: string;
    zipCode: string; // formato: XXXXX-XXX
    pais: string;
    bairro: string;
  };
  phones: Array<{
    id: number;
    ddd: string;
    number: string; // 9 dígitos
  }>;
}
```

### 2. Corrigir Função `updateGoatFarmFull`
```typescript
export const updateGoatFarmFull = async (farmId: number, data: UpdateGoatFarmRequest): Promise<GoatFarmResponse> => {
  console.log('Enviando atualização completa:', data);
  console.log(`Enviando PUT para /goatfarms/${farmId}`, data);
  
  // Validar estrutura antes de enviar
  if (!data.farm?.id || !data.user?.id) {
    throw new Error('IDs de farm e user são obrigatórios');
  }
  
  if (!data.user.roles || data.user.roles.length === 0) {
    throw new Error('Roles do usuário são obrigatórias');
  }
  
  const response = await requestBackend({
    url: `/goatfarms/${farmId}`,
    method: 'PUT',
    data
  });
  
  return response.data;
};
```

### 3. Exemplo de Payload Correto
```json
{
  "farm": {
    "id": 1,
    "nome": "Fazenda Atualizada",
    "tod": "MANHA"
  },
  "user": {
    "id": 1,
    "name": "Alberto Vilar",
    "email": "albertovilar1@gmail.com",
    "cpf": "123.456.789-00",
    "roles": ["ROLE_OPERATOR", "ROLE_ADMIN"]
  },
  "address": {
    "rua": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "zipCode": "01234-567",
    "pais": "Brasil",
    "bairro": "Centro"
  },
  "phones": [
    {
      "id": 1,
      "ddd": "11",
      "number": "999999999"
    }
  ]
}
```

## ✅ Próximos Passos

1. **Corrigir a estrutura do payload** no frontend
2. **Atualizar as interfaces TypeScript**
3. **Adicionar validações** antes de enviar
4. **Testar novamente** o PUT

## 📋 Checklist de Validação

- [ ] `farm.id` presente e válido
- [ ] `user.id` presente e válido
- [ ] `user.roles` array não vazio
- [ ] `address.zipCode` (não `postalCode`)
- [ ] `phones[].number` (não `numero`)
- [ ] `phones[].id` presente
- [ ] `cpf` no formato XXX.XXX.XXX-XX
- [ ] `zipCode` no formato XXXXX-XXX
- [ ] `tod` máximo 10 caracteres
- [ ] `phones[].number` com 9 dígitos