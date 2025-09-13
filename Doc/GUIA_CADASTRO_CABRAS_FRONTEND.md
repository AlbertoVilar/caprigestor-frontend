# 🐐 Guia de Cadastro de Cabras - Frontend

## 📋 Visão Geral

Este guia explica como usar o sistema de cadastro de cabras no frontend React/TypeScript, incluindo os componentes, interfaces e melhores práticas implementadas.

## 🏗️ Arquitetura dos Componentes

### Componentes Principais

1. **GoatCreateForm.tsx** - Formulário principal de cadastro
2. **GoatCreateModal.tsx** - Modal que encapsula o formulário
3. **TestGoatRegistration.tsx** - Página de teste e demonstração

### Localização dos Arquivos
```
src/
├── Components/
│   └── goat-create-form/
│       ├── GoatCreateForm.tsx
│       ├── GoatCreateModal.tsx
│       ├── goatCreateForm.css
│       └── goatCreateModal.css
├── Models/
│   ├── goatRequestDTO.ts
│   └── goatResponseDTO.ts
├── types/
│   └── goatEnums.tsx
├── api/
│   └── GoatAPI/
│       └── goat.ts
└── Pages/
    ├── goat-list-page/
    │   └── GoatListPage.tsx
    └── test-goat-registration/
        ├── TestGoatRegistration.tsx
        └── TestGoatRegistration.css
```

## 🔧 Interfaces e Tipos

### GoatRequestDTO
```typescript
export interface GoatRequestDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: GoatGenderEnum;
  birthDate: string; // formato: YYYY-MM-DD
  status: GoatStatusEnum;
  category: GoatCategoryEnum;
  toe: string;
  tod: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  farmId: number;
  userId: number;
}
```

### Enums Disponíveis

#### GoatCategoryEnum
```typescript
export enum GoatCategoryEnum {
  PO = "PO", // Puro de Origem
  PA = "PA", // Puro por Avaliação
  PC = "PC", // Puro por Cruza
}
```

#### GoatStatusEnum
```typescript
export enum GoatStatusEnum {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO",
  MORTO = "MORTO",
  VENDIDO = "VENDIDO",
}
```

#### GoatGenderEnum
```typescript
export enum GoatGenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}
```

## 🎯 Como Usar os Componentes

### 1. Usando o GoatCreateModal

```tsx
import GoatCreateModal from '../../Components/goat-create-form/GoatCreateModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  const handleGoatCreated = () => {
    // Lógica após criar a cabra
    console.log('Cabra criada com sucesso!');
    setShowModal(false);
  };
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Cadastrar Nova Cabra
      </button>
      
      {showModal && (
        <GoatCreateModal
          onClose={() => setShowModal(false)}
          onGoatCreated={handleGoatCreated}
          defaultFarmId={1}
          defaultUserId={1}
          defaultTod="001"
        />
      )}
    </>
  );
}
```

### 2. Usando o GoatCreateForm Diretamente

```tsx
import GoatCreateForm from '../../Components/goat-create-form/GoatCreateForm';

function MyPage() {
  const handleGoatCreated = () => {
    // Lógica após criar a cabra
  };
  
  return (
    <div>
      <h1>Cadastro de Cabra</h1>
      <GoatCreateForm
        onGoatCreated={handleGoatCreated}
        defaultFarmId={1}
        defaultUserId={1}
        defaultTod="001"
      />
    </div>
  );
}
```

### 3. Modo de Edição

```tsx
<GoatCreateModal
  mode="edit"
  initialData={existingGoatData}
  onClose={() => setEditModal(false)}
  onGoatCreated={handleGoatUpdated}
/>
```

## 🔌 API Integration

### Serviço de API

```typescript
// src/api/GoatAPI/goat.ts
export async function createGoat(goatData: GoatRequestDTO): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.post('/goatfarms/goats', goatData);
  return data;
}

export async function updateGoat(
  registrationNumber: string,
  goat: GoatRequestDTO
): Promise<void> {
  await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, goat);
}
```

## ✅ Validações Implementadas

### Validações do Frontend

1. **Campos Obrigatórios:**
   - Nome da cabra
   - Gênero
   - Raça
   - Status
   - TOD (Orelha Direita)
   - TOE (Orelha Esquerda)
   - ID da Fazenda
   - ID do Usuário

2. **Geração Automática:**
   - Número de registro = TOD + TOE

3. **Valores Padrão:**
   - Gênero: MALE
   - Status: ATIVO
   - Categoria: PA

### Validações do Backend

O backend valida:
- Formato dos enums
- Unicidade do número de registro
- Existência da fazenda e usuário
- Formato da data de nascimento

## 🎨 Estilos e CSS

### Variáveis CSS Utilizadas

```css
:root {
  --gf-color-darkgreen: #2e7d32;
  --gf-color-white: #ffffff;
  --gf-radius: 8px;
  --gf-font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

### Classes Principais

- `.form-cadastro` - Container principal do formulário
- `.row` - Layout em linha para campos
- `.col` - Colunas do formulário
- `.form-group` - Grupo de campo (label + input)
- `.submit-button-wrapper` - Container do botão de submit

## 🧪 Página de Teste

### TestGoatRegistration.tsx

Criamos uma página de teste completa que demonstra:

1. **Informações do Sistema:**
   - Lista de categorias disponíveis
   - Lista de status disponíveis
   - Lista de gêneros
   - Lista de raças

2. **Formulário Interativo:**
   - Botão para abrir/fechar o formulário
   - Feedback visual após cadastro
   - Dados de exemplo pré-configurados

3. **Notas Importantes:**
   - Explicações sobre campos obrigatórios
   - Formato de dados esperado
   - Regras de negócio

### Como Acessar a Página de Teste

1. Navegue até: `http://localhost:5174/test-goat-registration`
2. Ou importe o componente em sua aplicação:

```tsx
import TestGoatRegistration from './Pages/test-goat-registration/TestGoatRegistration';
```

## 🔐 Autenticação e Autorização

### Permissões Necessárias

- **ADMIN:** Pode cadastrar cabras em qualquer fazenda
- **OPERATOR:** Pode cadastrar cabras apenas em fazendas próprias
- **FARM_OWNER:** Pode cadastrar cabras em suas fazendas

### Verificação de Permissões

```tsx
const canCreate = 
  !!farmData &&
  isAuthenticated &&
  (isAdmin || (isOperator && tokenPayload?.userId === farmData.userId));
```

## 🚨 Tratamento de Erros

### Erros Comuns e Soluções

1. **Erro 400 - Dados Inválidos:**
   - Verificar se os enums estão corretos
   - Validar formato da data (YYYY-MM-DD)
   - Confirmar campos obrigatórios

2. **Erro 403 - Sem Permissão:**
   - Verificar se o usuário tem permissão na fazenda
   - Confirmar autenticação

3. **Erro 409 - Número de Registro Duplicado:**
   - Alterar TOD ou TOE para gerar novo número

### Exemplo de Tratamento

```tsx
try {
  await createGoat(formData);
  toast.success("🐐 Cabra cadastrada com sucesso!");
} catch (error: unknown) {
  console.error("Erro ao salvar cabra:", error);
  toast.error("❌ Erro ao salvar cabra. Verifique os dados.");
}
```

## 📱 Responsividade

O formulário é totalmente responsivo:

- **Desktop:** Layout em duas colunas
- **Tablet:** Layout adaptativo
- **Mobile:** Layout em coluna única

## 🔄 Integração com Lista de Cabras

O formulário se integra perfeitamente com a `GoatListPage`:

```tsx
// Em GoatListPage.tsx
{showCreateModal && farmData && (
  <GoatCreateModal
    onClose={() => setShowCreateModal(false)}
    onGoatCreated={handleGoatCreated} // Recarrega a lista
    defaultFarmId={farmData.id}
    defaultUserId={tokenPayload?.userId || 0}
    defaultTod={farmData.tod}
  />
)}
```

## 🎯 Próximos Passos

1. **Melhorias Sugeridas:**
   - Adicionar validação de CPF/CNPJ
   - Implementar upload de fotos
   - Adicionar campos customizados
   - Melhorar UX com loading states

2. **Testes:**
   - Adicionar testes unitários
   - Testes de integração com API
   - Testes E2E

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se o backend está rodando
3. Valide as permissões do usuário
4. Consulte a documentação da API

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0