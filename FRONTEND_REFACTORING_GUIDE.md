# 📋 Guia Completo de Refatoração Frontend

## 🎯 Objetivo
Este guia detalha a refatoração necessária para alinhar o frontend com as mudanças realizadas no backend, especificamente a migração do modelo `Owner` para `User` expandido.

## 🚨 Mudanças Críticas Identificadas

### 1. **Endpoints Removidos/Alterados**
```diff
- DELETE /owners/*
+ POST   /users
+ GET    /users/{id}
+ PUT    /users/{id}
+ GET    /users/profile (dados do usuário logado)
```

### 2. **Modelo de Dados - Owner → User**
```typescript
// ❌ ANTES (Owner)
interface OwnerRequest {
  id?: number;
  name: string;     // ← Campo 'name'
  cpf: string;
  email: string;
}

// ✅ DEPOIS (User expandido)
interface UserProfile {
  id: number;
  name: string;     // ← Mantém 'name'
  email: string;
  cpf?: string;     // ← Opcional
  password?: string; // ← Novo (apenas criação)
  roles: string[];  // ← Novo obrigatório
  createdAt: string;
  updatedAt: string;
}
```

### 3. **Token JWT Atualizado**
```typescript
// ✅ NOVO payload do token
interface AccessTokenPayloadDTO {
  userId: number;        // ← ID único do usuário
  user_name: string;
  authorities: string[]; // ["ROLE_ADMIN", "ROLE_OPERATOR"]
  exp: number;
  userEmail?: string;
  // Removido: campos duplicados de Owner
}
```

## 📋 Checklist de Refatoração

### 📋 **Fase 1: Preparação**
- [ ] Criar backup do código atual
- [ ] Criar branch `refactor/owner-to-user`
- [ ] Documentar endpoints atuais em uso
- [ ] Identificar todos os arquivos que referenciam `Owner`

### 🔧 **Fase 2: Atualização de Modelos**

#### 2.1 Remover Modelos Obsoletos
```bash
# Arquivos para remover/refatorar:
- src/Models/OwnerRequestDTO.ts
- src/api/OwnerAPI/owners.ts
```

#### 2.2 Criar Novos Modelos
```typescript
// src/Models/UserProfileDTO.ts
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  roles: string[]; // ["ROLE_OPERATOR"] por padrão
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  cpf?: string;
  roles?: string[];
}
```

- [ ] Criar `src/Models/UserProfileDTO.ts`
- [ ] Atualizar `src/Models/auth.ts` se necessário
- [ ] Remover referências a `OwnerRequestDTO`

### 🌐 **Fase 3: Atualização de Serviços**

#### 3.1 Criar UserService
```typescript
// src/api/UserAPI/users.ts
import { UserProfile, UserCreateRequest, UserUpdateRequest } from "../../Models/UserProfileDTO";
import { requestBackEnd } from "../../utils/request";

// ✅ Buscar perfil do usuário logado
export async function getCurrentUserProfile(): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.get("/users/profile");
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Erro ao buscar perfil do usuário";
    throw new Error(errorMessage);
  }
}

// ✅ Criar novo usuário (registro)
export async function createUser(data: UserCreateRequest): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.post("/users", data);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Erro ao criar usuário";
    throw new Error(errorMessage);
  }
}

// ✅ Atualizar usuário
export async function updateUser(userId: number, data: UserUpdateRequest): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.put(`/users/${userId}`, data);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Erro ao atualizar usuário";
    throw new Error(errorMessage);
  }
}

// ✅ Buscar usuário por ID (admin only)
export async function getUserById(userId: number): Promise<UserProfile> {
  try {
    const response = await requestBackEnd.get(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Erro ao buscar usuário";
    throw new Error(errorMessage);
  }
}
```

- [ ] Criar `src/api/UserAPI/users.ts`
- [ ] Remover `src/api/OwnerAPI/owners.ts`
- [ ] Atualizar imports em todos os arquivos

#### 3.2 Atualizar auth-service.ts
```typescript
// src/services/auth-service.ts

// ✅ ATUALIZAR: Interface de registro
interface UserRegistrationCredentials {
  name: string;          // ← Mantém 'name'
  username: string;      // ← Email como username
  email: string;
  password: string;
  confirmPassword: string;
  cpf?: string;          // ← Opcional
  roles?: string[];      // ← Padrão: ["ROLE_OPERATOR"]
}

// ✅ ATUALIZAR: Função de registro
export async function registerUser(credentials: UserRegistrationCredentials) {
  const payload = {
    ...credentials,
    roles: credentials.roles || ["ROLE_OPERATOR"], // Padrão
  };
  
  const config: AxiosRequestConfig = {
    method: "POST",
    url: "/users", // ← Mudança de endpoint
    data: payload,
  };

  return requestBackEnd(config);
}
```

- [ ] Atualizar `registerUser()` para usar `/users`
- [ ] Adicionar campo `roles` com padrão `["ROLE_OPERATOR"]`
- [ ] Manter campo `name` (não `nome`)

### 🎨 **Fase 4: Atualização de Componentes**

#### 4.1 Atualizar FarmCreateForm
```typescript
// src/Components/farm/FarmCreateForm.tsx

// ❌ REMOVER:
import { getOwnerByUserId } from "../../api/OwnerAPI/owners";
import { OwnerRequest } from "../../Models/OwnerRequestDTO";

// ✅ ADICIONAR:
import { getCurrentUserProfile } from "../../api/UserAPI/users";
import { UserProfile } from "../../Models/UserProfileDTO";

// ❌ REMOVER:
const [owner, setOwner] = useState<OwnerRequest>({
  name: "",
  cpf: "",
  email: "",
});
const [existingOwnerId, setExistingOwnerId] = useState<number | null>(null);

// ✅ SUBSTITUIR POR:
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

// ✅ ATUALIZAR: useEffect
useEffect(() => {
  async function loadUserProfile() {
    if (!tokenPayload?.userId) return;

    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
      toast.info("Dados do usuário carregados automaticamente.");
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      // Fallback com dados do token
      setUserProfile({
        id: tokenPayload.userId,
        name: tokenPayload.userName || tokenPayload.user_name || "",
        email: tokenPayload.userEmail || "",
        roles: tokenPayload.authorities || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  loadUserProfile();
}, [tokenPayload]);

// ✅ ATUALIZAR: Payload da fazenda
const farmPayload: FarmCreateRequest = {
  farm: {
    name: farm.name,
    tod: farm.tod,
  },
  owner: {
    id: userProfile?.id, // ← Usar ID do usuário logado
    name: userProfile?.name || "",
    cpf: userProfile?.cpf || "",
    email: userProfile?.email || "",
  },
  address,
  phones,
};
```

- [ ] Atualizar `FarmCreateForm.tsx`
- [ ] Remover lógica de `existingOwnerId`
- [ ] Usar `getCurrentUserProfile()` em vez de `getOwnerByUserId()`

#### 4.2 Atualizar Componentes de Cards
```typescript
// src/Components/goatfarms-cards/GoatfarmCard.tsx
// src/Components/GoatCard-to-list/goatCard.tsx

// ❌ REMOVER:
import { getOwnerByUserId } from "@/api/OwnerAPI/owners";

// ✅ SIMPLIFICAR: Lógica de permissões
const { tokenPayload, isAuthenticated } = useAuth();
const roles = tokenPayload?.authorities ?? [];
const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
const isOwner = tokenPayload?.userId === farmOwnerId; // ← Comparação direta
const canManage = isAuthenticated && (isAdmin || isOwner);

// ❌ REMOVER: useEffect complexo de verificação
// ✅ MANTER: Apenas a lógica simples acima
```

- [ ] Simplificar lógica de permissões em `GoatfarmCard.tsx`
- [ ] Simplificar lógica de permissões em `goatCard.tsx`
- [ ] Remover chamadas para `getOwnerByUserId()`

#### 4.3 Atualizar SignupForm e SignupPage
```typescript
// src/Pages/signup-page/SignupPage.tsx

// ✅ ADICIONAR: Campo CPF opcional
const [cpf, setCpf] = useState("");

// ✅ ATUALIZAR: handleSubmit
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setErrorMessage(null);

  if (password !== confirmPassword) {
    setErrorMessage("As senhas não coincidem.");
    return;
  }

  setLoading(true);
  try {
    const response = await registerUser({
      name,                    // ← Mantém 'name'
      username: email,
      email,
      password,
      confirmPassword,
      cpf: cpf || undefined,   // ← Opcional
      roles: ["ROLE_OPERATOR"], // ← Padrão
    });

    const token = response.data?.token;
    if (token) {
      toast.success(`Bem-vindo(a), ${name}! Conta criada com sucesso.`);
      login(token);
      navigate("/fazendas/novo", { replace: true });
    }
  } catch (error) {
    // ... tratamento de erro
  } finally {
    setLoading(false);
  }
}
```

- [ ] Adicionar campo CPF opcional no `SignupForm`
- [ ] Atualizar `handleSubmit` com novos campos
- [ ] Manter campo `name` (não alterar para `nome`)

### 🧠 **Fase 5: Lógica de Negócio**

#### 5.1 Corrigir Verificações de Permissão
```typescript
// src/utils/auth-utils.ts

// ✅ ADICIONAR: Hook customizado para permissões
export function usePermissions(resourceOwnerId?: number) {
  const { tokenPayload, isAuthenticated } = useAuth();
  
  return useMemo(() => {
    if (!isAuthenticated || !tokenPayload) {
      return {
        isAdmin: false,
        isOwner: false,
        canManage: false,
        canView: false,
      };
    }

    const roles = tokenPayload.authorities ?? [];
    const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
    const isOwner = tokenPayload.userId === resourceOwnerId;

    return {
      isAdmin,
      isOwner,
      canManage: isAdmin || isOwner,
      canView: isAuthenticated,
    };
  }, [tokenPayload, resourceOwnerId, isAuthenticated]);
}
```

- [ ] Criar hook `usePermissions()`
- [ ] Substituir lógica repetitiva nos componentes
- [ ] Garantir comparação correta: `tokenPayload.userId === resourceOwnerId`

#### 5.2 Atualizar Guards RBAC
```typescript
// src/Components/rbac/guards.tsx

// ✅ ATUALIZAR: IfCanManage
export function IfCanManage({
  resourceOwnerId,
  children,
}: PropsWithChildren<{ resourceOwnerId?: number }>) {
  const { tokenPayload } = useAuth();
  if (!tokenPayload) return null;

  const roles = tokenPayload.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOwner = tokenPayload.userId === resourceOwnerId; // ← Correção

  return isAdmin || isOwner ? <>{children}</> : null;
}
```

- [ ] Corrigir comparação em `IfCanManage`
- [ ] Usar `tokenPayload.userId` diretamente
- [ ] Remover lógica de `ROLE_OPERATOR` específica

### 📊 **Fase 6: Estados/Store (se aplicável)**

#### 6.1 Atualizar Context de Autenticação
```typescript
// src/contexts/AuthContext.tsx

// ✅ ADICIONAR: Método para buscar perfil
type AuthContextType = {
  tokenPayload?: AccessTokenPayloadDTO;
  userProfile?: UserProfile;     // ← Novo
  isAuthenticated: boolean;
  setTokenPayload: (payload: AccessTokenPayloadDTO | undefined) => void;
  refreshUserProfile: () => Promise<void>; // ← Novo
  login: (token: string) => void;
  logout: () => void;
};

// ✅ IMPLEMENTAR: refreshUserProfile
const refreshUserProfile = async () => {
  if (!tokenPayload?.userId) return;
  
  try {
    const profile = await getCurrentUserProfile();
    setUserProfile(profile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
  }
};
```

- [ ] Adicionar `userProfile` ao contexto
- [ ] Implementar `refreshUserProfile()`
- [ ] Atualizar componentes que precisam do perfil completo

### 🛣️ **Fase 7: Rotas**

#### 7.1 Verificar Rotas Protegidas
```typescript
// src/main.tsx

// ✅ VERIFICAR: Todas as rotas que usam dados de Owner
const router = createBrowserRouter([
  // ... rotas públicas
  {
    path: "/fazendas/novo",
    element: (
      <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
        <FarmCreatePage />
      </PrivateRoute>
    ),
  },
  // ... outras rotas
]);
```

- [ ] Verificar todas as rotas protegidas
- [ ] Garantir que roles estão corretas
- [ ] Testar navegação após login

### ✅ **Fase 8: Validação**

#### 8.1 Validações de Formulário
```typescript
// Validações para UserCreateRequest
const validateUserForm = (data: UserCreateRequest) => {
  const errors: string[] = [];

  if (!data.name?.trim()) errors.push("Nome é obrigatório");
  if (!data.email?.trim()) errors.push("Email é obrigatório");
  if (!data.password?.trim()) errors.push("Senha é obrigatória");
  if (!data.roles?.length) errors.push("Pelo menos uma role é obrigatória");
  
  // CPF opcional, mas se fornecido deve ser válido
  if (data.cpf && !isValidCPF(data.cpf)) {
    errors.push("CPF inválido");
  }

  return errors;
};
```

- [ ] Implementar validações para `UserCreateRequest`
- [ ] Validar roles obrigatórias
- [ ] Validar CPF quando fornecido
- [ ] Manter validação de senha

### 🧪 **Fase 9: Testes de Integração**

#### 9.1 Cenários de Teste
```typescript
// Cenários críticos para testar:

// ✅ 1. Cadastro de usuário
// - Criar usuário com role ROLE_OPERATOR
// - Verificar token JWT retornado
// - Verificar login automático

// ✅ 2. Criação de fazenda
// - Usuário logado cria fazenda
// - Verificar associação userId correto
// - Verificar permissões de acesso

// ✅ 3. Permissões de cabras
// - Proprietário vê botões de ação
// - Admin vê todos os botões
// - Usuário sem permissão não vê botões

// ✅ 4. Fluxo completo
// - Cadastro → Login → Criar Fazenda → Ver Cabras → Ações
```

- [ ] Testar cadastro de usuário completo
- [ ] Testar criação de fazenda com novo usuário
- [ ] Testar permissões de cabras
- [ ] Testar fluxo admin vs operator

### 🏁 **Fase 10: Finalização**

- [ ] Remover arquivos obsoletos
- [ ] Atualizar documentação técnica
- [ ] Fazer commit das mudanças
- [ ] Testar em ambiente de produção
- [ ] Monitorar logs de erro

## 🚨 **Pontos Críticos de Atenção**

### 1. **Campo 'name' vs 'nome'**
```diff
# ✅ CORRETO - Manter 'name'
interface UserProfile {
  name: string; // ← Não alterar para 'nome'
}

# ❌ INCORRETO
interface UserProfile {
  nome: string; // ← Não fazer isso
}
```

### 2. **Autenticação Obrigatória**
```typescript
// ✅ Todos os endpoints /users/* requerem autenticação
const config = {
  headers: {
    Authorization: `Bearer ${token}`, // ← Obrigatório
  },
};
```

### 3. **Roles Obrigatórias**
```typescript
// ✅ Todo usuário deve ter pelo menos uma role
const defaultUser = {
  roles: ["ROLE_OPERATOR"], // ← Nunca vazio
};
```

### 4. **Comparação de IDs Correta**
```typescript
// ✅ CORRETO
const isOwner = tokenPayload.userId === resourceOwnerId;

// ❌ INCORRETO (bug anterior)
const isOwner = ownerIdFromAPI === resourceOwnerId; // ownerIdFromAPI pode ser undefined
```

### 5. **Senha Obrigatória na Criação**
```typescript
// ✅ Senha sempre obrigatória para novos usuários
interface UserCreateRequest {
  password: string; // ← Não opcional
}
```

## 🔗 **Credenciais de Teste**

### Usuário Admin + Operator
- **Email**: albertovilar1@gmail.com
- **Senha**: password123
- **Roles**: ["ROLE_ADMIN", "ROLE_OPERATOR"]

### Usuário Operator
- **Email**: carlosmedeiros@email.com
- **Senha**: password123
- **Roles**: ["ROLE_OPERATOR"]

## 📝 **Exemplos de Código Completos**

### Exemplo: Componente Atualizado
```typescript
// src/Components/user/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { getCurrentUserProfile, updateUser } from '../../api/UserAPI/users';
import { UserProfile, UserUpdateRequest } from '../../Models/UserProfileDTO';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export default function UserProfileComponent() {
  const { tokenPayload } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: UserUpdateRequest) => {
    if (!profile) return;

    try {
      const updated = await updateUser(profile.id, data);
      setProfile(updated);
      setEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!profile) return <div>Perfil não encontrado</div>;

  return (
    <div className="user-profile">
      <h2>Meu Perfil</h2>
      
      <div className="profile-info">
        <p><strong>Nome:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>CPF:</strong> {profile.cpf || 'Não informado'}</p>
        <p><strong>Roles:</strong> {profile.roles.join(', ')}</p>
      </div>

      {!editing ? (
        <button onClick={() => setEditing(true)}>Editar Perfil</button>
      ) : (
        <UserEditForm 
          profile={profile} 
          onSave={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
```

### Exemplo: Hook de Permissões
```typescript
// src/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RoleEnum } from '../Models/auth';

export function usePermissions(resourceOwnerId?: number) {
  const { tokenPayload, isAuthenticated } = useAuth();
  
  return useMemo(() => {
    if (!isAuthenticated || !tokenPayload) {
      return {
        isAdmin: false,
        isOperator: false,
        isOwner: false,
        canManage: false,
        canView: false,
        canCreate: false,
        canDelete: false,
      };
    }

    const roles = tokenPayload.authorities ?? [];
    const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
    const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);
    const isOwner = resourceOwnerId ? tokenPayload.userId === resourceOwnerId : false;

    return {
      isAdmin,
      isOperator,
      isOwner,
      canManage: isAdmin || isOwner,
      canView: isAuthenticated,
      canCreate: isAdmin || isOperator,
      canDelete: isAdmin || isOwner,
    };
  }, [tokenPayload, resourceOwnerId, isAuthenticated]);
}

// Uso nos componentes:
// const { canManage, canDelete } = usePermissions(farm.ownerId);
```

## 🎯 **Resumo da Refatoração**

### O que muda:
1. **Modelo**: `Owner` → `UserProfile` expandido
2. **Endpoints**: `/owners/*` → `/users/*`
3. **Autenticação**: Obrigatória em todos os endpoints
4. **Campos**: Mantém `name`, adiciona `roles`, `password`
5. **Permissões**: Comparação direta `userId === resourceOwnerId`

### O que NÃO muda:
1. **Campo name**: Continua sendo `name` (não `nome`)
2. **Lógica de negócio**: Mesmas regras de permissão
3. **UI/UX**: Interface permanece igual
4. **Fluxo do usuário**: Mesmo fluxo de cadastro/login

### Benefícios:
1. **Simplicidade**: Elimina duplicação User/Owner
2. **Consistência**: Um modelo único para usuários
3. **Manutenibilidade**: Menos código para manter
4. **Performance**: Menos requisições à API
5. **Segurança**: Autenticação obrigatória

---

**📅 Data de Criação**: Janeiro 2025  
**🔄 Última Atualização**: Janeiro 2025  
**👨‍💻 Responsável**: Sistema Capril Vilar Team