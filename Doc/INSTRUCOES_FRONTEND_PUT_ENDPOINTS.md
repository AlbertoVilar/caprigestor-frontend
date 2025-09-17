# Instruções para Frontend - Endpoints PUT

## 🐐 Edição de Cabras - Implementação Completa

### 1. Endpoint GET para buscar dados da cabra
**URL:** `GET /api/goatfarms/goats/{registrationNumber}`
**Headers:** `Authorization: Bearer {token}`

**Exemplo de resposta:**
```json
{
  "id": 1,
  "registrationNumber": "1615324101",
  "name": "ACRICOSA MAGESTADE",
  "gender": "FEMALE",
  "breed": "SAANEN",
  "color": "Branca",
  "birthDate": "2016-05-15",
  "status": "Ativo",
  "tod": "16153",
  "toe": "24101",
  "category": "Puro de Origem",
  "farmId": 1,
  "farmName": "Capril Alto Paraíso",
  "userId": 3,
  "userName": "Leonardo Oliveira",
  "fatherRegistrationNumber": null,
  "motherRegistrationNumber": null
}
```

### 2. Endpoint PUT para atualizar cabra
**URL:** `PUT /api/goatfarms/goats/{registrationNumber}`
**Headers:** `Authorization: Bearer {token}`, `Content-Type: application/json`

**Payload obrigatório (aceita valores em português):**
```json
{
  "registrationNumber": "1615324101",
  "name": "ACRICOSA MAGESTADE EDITADA",
  "gender": "Fêmea",
  "breed": "SAANEN",
  "color": "Branca",
  "birthDate": "2016-05-15",
  "status": "Ativo",
  "tod": "16153",
  "toe": "24101",
  "category": "Puro de Origem",
  "farmId": 1,
  "userId": 3
}
```

### 3. Valores válidos para enums

**IMPORTANTE:** O backend aceita valores em português ou inglês graças aos conversores JSON!

#### Status (GoatStatus):
- `"Ativo"` ou `"ATIVO"` - Cabra ativa
- `"Inativo"` ou `"INACTIVE"` - Cabra inativa
- `"Falecido"` ou `"DECEASED"` - Cabra falecida
- `"Vendido"` ou `"SOLD"` - Cabra vendida

#### Categoria (Category):
- `"Puro de Origem"` ou `"PO"` - Puro de Origem
- `"Puro por Avaliação"` ou `"PA"` - Puro por Avaliação
- `"Puro por Cruza"` ou `"PC"` - Puro por Cruza

#### Gênero (Gender):
- `"Macho"` ou `"MALE"` - Macho
- `"Fêmea"` ou `"FEMALE"` - Fêmea

### 4. Implementação no Frontend

#### 4.1 Função para buscar dados da cabra
```typescript
const fetchGoatData = async (registrationNumber: string) => {
  try {
    const response = await fetch(`/api/goatfarms/goats/${registrationNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados da cabra');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

#### 4.2 Função para atualizar cabra
```typescript
const updateGoat = async (registrationNumber: string, goatData: GoatRequestDTO) => {
  try {
    const response = await fetch(`/api/goatfarms/goats/${registrationNumber}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goatData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao atualizar cabra');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};
```

#### 4.3 Implementação do botão "Editar"
```typescript
const handleEditClick = async (registrationNumber: string) => {
  try {
    // 1. Buscar dados atuais da cabra
    const goatData = await fetchGoatData(registrationNumber);
    
    // 2. Os dados já vêm no formato correto do backend!
     const formData = {
       registrationNumber: goatData.registrationNumber,
       name: goatData.name,
       gender: goatData.gender, // Já vem como "Fêmea" ou "Macho"
       breed: goatData.breed,
       color: goatData.color,
       birthDate: goatData.birthDate,
       status: goatData.status, // Já vem como "Ativo", "Inativo", etc.
       tod: goatData.tod,
       toe: goatData.toe,
       category: goatData.category, // Já vem como "Puro de Origem", etc.
       farmId: goatData.farmId,
       userId: goatData.userId,
       fatherRegistrationNumber: goatData.fatherRegistrationNumber || '',
       motherRegistrationNumber: goatData.motherRegistrationNumber || ''
     };
    
    // 3. Abrir modal/formulário com dados pré-preenchidos
    openEditModal(formData);
    
  } catch (error) {
    alert('Erro ao carregar dados da cabra para edição');
  }
};
```

#### 4.4 Uso do conversor existente
**IMPORTANTE:** O projeto já possui um conversor completo em `goatConverter.ts`!

```typescript
// Importar o conversor existente
import { enumConverters, convertFormDataToBackend } from './goatConverter';

// Usar o conversor para envio ao backend
const convertForBackend = (formData: any) => {
  // O conversor já trata todos os enums automaticamente
  return convertFormDataToBackend(formData);
};

// Conversões individuais (se necessário)
const convertIndividualValues = {
  // Status: aceita "Ativo" ou "ATIVO"
  status: enumConverters.statusToBackend,
  
  // Categoria: aceita "Puro de Origem" ou "PO"
  category: enumConverters.categoryToBackend,
  
  // Gênero: aceita "Fêmea" ou "FEMALE"
  gender: enumConverters.genderToBackend,
  
  // Raça: aceita "Alpina" ou "ALPINA"
  breed: enumConverters.breedToBackend
};

// Para formulários, usar as opções pré-definidas
import { formOptions } from './goatConverter';

// Exemplo de uso em select
const StatusSelect = () => (
  <select>
    {formOptions.status.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);
```

#### 4.5 Implementação do formulário de edição
```typescript
const EditGoatForm = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
       // Usar o conversor existente do projeto
       const payload = convertFormDataToBackend(formData);
       
       // Enviar atualização
       await updateGoat(formData.registrationNumber, payload);
      
      alert('Cabra atualizada com sucesso!');
      onSave();
      
    } catch (error) {
      alert('Erro ao atualizar cabra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário pré-preenchidos com initialData */}
      <input 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required 
      />
      {/* ... outros campos ... */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
    </form>
  );
};
```

### 5. Fluxo completo de edição

1. **Usuário clica em "Editar"** → `handleEditClick(registrationNumber)`
2. **Sistema busca dados atuais** → `GET /api/goatfarms/goats/{registrationNumber}`
3. **Dados são convertidos** → `convertStatusFromBackend()`, `convertCategoryFromBackend()`
4. **Modal/formulário abre** → Campos pré-preenchidos com dados atuais
5. **Usuário edita e salva** → `handleSubmit()`
6. **Dados são convertidos** → `convertForBackend()`
7. **Sistema envia atualização** → `PUT /api/goatfarms/goats/{registrationNumber}`
8. **Sucesso** → Modal fecha, lista é atualizada

### 6. Validações importantes

- ✅ **Campos obrigatórios:** Todos os campos do payload são obrigatórios
- ✅ **Genealogia:** `fatherRegistrationNumber` e `motherRegistrationNumber` devem ter 10-12 caracteres OU ser omitidos
- ✅ **Enums:** Aceita valores em português ("Ativo", "Fêmea", "Puro de Origem") ou inglês ("ATIVO", "FEMALE", "PO")
- ✅ **Encoding:** Evitar caracteres especiais ou garantir UTF-8 correto
- ✅ **Token:** Sempre incluir Authorization header
- ✅ **Permissão:** Usuário deve ser dono do capril ou admin
- ✅ **Conversor:** Usar `goatConverter.ts` existente no projeto

### 7. Tratamento de erros

- **400:** Dados inválidos → Mostrar mensagens de validação
- **401:** Token inválido → Redirecionar para login
- **403:** Sem permissão → Mostrar mensagem de acesso negado
- **404:** Cabra não encontrada → Mostrar mensagem de erro
- **500:** Erro interno → Mostrar mensagem genérica de erro

## 📋 Resumo das Mudanças Identificadas

Durante os testes dos endpoints PUT, foram identificadas algumas mudanças importantes que o frontend precisa implementar para garantir o funcionamento correto.

---

## 🏠 PUT Endereço - `/api/addresses/{id}`

### ✅ Estrutura Correta do Payload
```json
{
  "street": "Rua Exemplo 123",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",  // ⚠️ MUDANÇA: era "postalCode", agora é "zipCode"
  "country": "Brasil"
}
```

### 🔧 Mudanças Necessárias no Frontend:
1. **Campo `postalCode` → `zipCode`**: Alterar o nome do campo no formulário e na requisição
2. **Codificação UTF-8**: Garantir que caracteres especiais sejam enviados corretamente
3. **Todos os campos são obrigatórios**

### 📝 Exemplo de Implementação (JavaScript):
```javascript
const updateAddress = async (addressId, addressData) => {
  const payload = {
    street: addressData.street,
    neighborhood: addressData.neighborhood,
    city: addressData.city,
    state: addressData.state,
    zipCode: addressData.zipCode, // ⚠️ MUDANÇA: era postalCode
    country: addressData.country
  };

  const response = await fetch(`/api/addresses/${addressId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};
```

---

## 📱 PUT Telefone - `/api/phones/{id}`

### ✅ Estrutura Correta do Payload
```json
{
  "ddd": "11",
  "number": "987654321",  // ⚠️ IMPORTANTE: Apenas números, sem hífen ou parênteses
  "goatFarmId": 1
}
```

### 🔧 Mudanças Necessárias no Frontend:
1. **Validação do número**: Remover todos os caracteres não numéricos antes de enviar
2. **Campo `goatFarmId` obrigatório**: Sempre incluir o ID da fazenda

### 📝 Exemplo de Implementação (JavaScript):
```javascript
const updatePhone = async (phoneId, phoneData) => {
  const payload = {
    ddd: phoneData.ddd,
    number: phoneData.number.replace(/\D/g, ''), // Remove caracteres não numéricos
    goatFarmId: phoneData.goatFarmId
  };

  const response = await fetch(`/api/phones/${phoneId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};
```

---

## 🐐 PUT Fazenda - `/api/goatfarms/{id}`

### ✅ Estrutura Correta do Payload (GoatFarmUpdateRequestDTO)
```json
{
  "farm": {
    "id": 1,                    // ⚠️ OBRIGATÓRIO: ID da fazenda
    "name": "Nome da Fazenda",
    "tod": "12345",             // ⚠️ IMPORTANTE: Exatamente 5 caracteres
    "addressId": 1,
    "userId": 1,
    "phoneIds": [1, 2]
  },
  "user": {
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "cpf": "12345678901",       // ⚠️ IMPORTANTE: Apenas números, 11 dígitos
    "password": "senha123",
    "confirmPassword": "senha123",
    "roles": ["ROLE_OPERATOR"]   // ⚠️ MUDANÇA: Usar "ROLE_OPERATOR" ou "ROLE_ADMIN"
  },
  "address": {
    "street": "Rua Exemplo",
    "neighborhood": "Bairro",
    "city": "Cidade",
    "state": "SP",
    "zipCode": "12345-678",     // ⚠️ MUDANÇA: era "postalCode"
    "country": "Brasil"
  },
  "phones": [
    {
      "id": 1,                 // ⚠️ OBRIGATÓRIO: ID do telefone para atualização
      "ddd": "11",
      "number": "987654321",   // ⚠️ IMPORTANTE: Apenas números
      "goatFarmId": 1
    },
    {
      "id": 2,                 // ⚠️ OBRIGATÓRIO: ID do telefone para atualização
      "ddd": "83",
      "number": "998761234",
      "goatFarmId": 1
    }
  ]
}
```

### 🔧 Mudanças Críticas no Frontend:

1. **IDs Obrigatórios**: 
   - `farm.id`: ID da fazenda sendo atualizada
   - `phones[].id`: ID de cada telefone sendo atualizado

2. **Roles do Sistema**:
   - ❌ Não usar: `"USER"`
   - ✅ Usar: `"ROLE_OPERATOR"` ou `"ROLE_ADMIN"`

3. **Campo `zipCode`**:
   - ❌ Não usar: `"postalCode"`
   - ✅ Usar: `"zipCode"`

4. **Validações Específicas**:
   - `tod`: Exatamente 5 caracteres
   - `cpf`: Apenas números, 11 dígitos
   - `phones[].number`: Apenas números, sem formatação

### 📝 Exemplo de Implementação (JavaScript):
```javascript
const updateGoatFarm = async (farmId, farmData) => {
  const payload = {
    farm: {
      id: farmId, // ⚠️ OBRIGATÓRIO
      name: farmData.name,
      tod: farmData.tod, // Garantir 5 caracteres
      addressId: farmData.addressId,
      userId: farmData.userId,
      phoneIds: farmData.phoneIds
    },
    user: {
      name: farmData.user.name,
      email: farmData.user.email,
      cpf: farmData.user.cpf.replace(/\D/g, ''), // Apenas números
      password: farmData.user.password,
      confirmPassword: farmData.user.confirmPassword,
      roles: ["ROLE_OPERATOR"] // ⚠️ MUDANÇA: era ["USER"]
    },
    address: {
      street: farmData.address.street,
      neighborhood: farmData.address.neighborhood,
      city: farmData.address.city,
      state: farmData.address.state,
      zipCode: farmData.address.zipCode, // ⚠️ MUDANÇA: era postalCode
      country: farmData.address.country
    },
    phones: farmData.phones.map(phone => ({
      id: phone.id, // ⚠️ OBRIGATÓRIO para atualização
      ddd: phone.ddd,
      number: phone.number.replace(/\D/g, ''), // Apenas números
      goatFarmId: farmId
    }))
  };

  const response = await fetch(`/api/goatfarms/${farmId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return response.json();
};
```

---

## 🔐 Autenticação

### Headers Obrigatórios:
```javascript
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Authorization': `Bearer ${accessToken}` // ⚠️ MUDANÇA: usar "accessToken" do response de login
};
```

### ⚠️ Mudança no Token:
- O campo do token na resposta de login é `accessToken` (não `token`)

---

## 📋 Checklist para o Frontend

### ✅ Mudanças de Campos:
- [ ] `postalCode` → `zipCode` em endereços
- [ ] `token` → `accessToken` na autenticação
- [ ] `["USER"]` → `["ROLE_OPERATOR"]` nas roles

### ✅ Validações a Implementar:
- [ ] Números de telefone: apenas dígitos
- [ ] CPF: apenas números, 11 dígitos
- [ ] TOD da fazenda: exatamente 5 caracteres
- [ ] IDs obrigatórios nos objetos de atualização

### ✅ Estruturas de Dados:
- [ ] PUT Fazenda: usar estrutura completa com objetos aninhados
- [ ] PUT Telefone: incluir `goatFarmId`
- [ ] PUT Endereço: todos os campos obrigatórios

### ✅ Headers HTTP:
- [ ] `Content-Type: application/json; charset=utf-8`
- [ ] `Authorization: Bearer {accessToken}`

---

## 🚨 Erros Comuns a Evitar

1. **ID nulo**: Sempre incluir IDs nos objetos sendo atualizados
2. **Role inválida**: Usar apenas `ROLE_OPERATOR` ou `ROLE_ADMIN`
3. **Formatação de números**: Remover máscaras antes de enviar
4. **Campo zipCode**: Não usar o nome antigo `postalCode`
5. **Codificação**: Garantir UTF-8 para caracteres especiais

---

## 📞 Suporte

Em caso de dúvidas sobre a implementação, consulte:
- Documentação da API: `DOCUMENTACAO_COMPLETA_SISTEMA_GOATFARM.md`
- Logs do servidor para debugging
- Testes realizados neste documento

**Data da última atualização**: 15/09/2025
**Versão da API**: 1.0
**Status**: ✅ Todos os endpoints PUT testados e funcionando