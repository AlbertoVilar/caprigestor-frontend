# Exemplos para Teste no Postman - Cadastro de Cabras

## 1. Login (Obter Token)

**URL:** `POST http://localhost:8080/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@test.com",
  "password": "123456"
}
```

**Resposta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": 4,
    "email": "joao@test.com",
    "role": "ROLE_OPERATOR"
  }
}
```

## 2. Listar Fazendas (Verificar farmId)

**URL:** `GET http://localhost:8080/api/goatfarms`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 3. Cadastrar Cabra - Exemplo Básico

**URL:** `POST http://localhost:8080/api/goatfarms/goats`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body:**
```json
{
  "registrationNumber": "TEST001",
  "name": "Cabra Teste",
  "breed": "SAANEN",
  "color": "Branca",
  "gender": "FEMALE",
  "birthDate": "2024-01-15",
  "status": "ATIVO",
  "category": "PO",
  "farmId": 4,
  "userId": 4
}
```

## 4. Cadastrar Cabra - Exemplo Completo

**Body:**
```json
{
  "registrationNumber": "BR2024001",
  "name": "Estrela da Manhã",
  "breed": "Saanen",
  "color": "Branca",
  "gender": "FEMALE",
  "birthDate": "2024-01-15",
  "status": "ATIVO",
  "category": "Reprodutora",
  "toe": "001",
  "tod": "16425",
  "fatherRegistrationNumber": "BR2023001",
  "motherRegistrationNumber": "BR2023002",
  "farmId": 4,
  "userId": 4
}
```

## 5. Cadastrar Cabra Macho

**Body:**
```json
{
  "registrationNumber": "MACHO001",
  "name": "Touro Forte",
  "breed": "Boer",
  "color": "Marrom",
  "gender": "MALE",
  "birthDate": "2023-12-01",
  "status": "ATIVO",
  "category": "Reprodutor",
  "farmId": 4,
  "userId": 4
}
```

## Possíveis Erros e Soluções

### Erro 401 (Unauthorized)
- Verificar se o token está correto
- Verificar se o token não expirou
- Refazer o login

### Erro 403 (Forbidden)
- Verificar se o usuário tem permissão para criar cabras
- Verificar se o farmId pertence ao usuário
- Verificar configurações de role no backend

### Erro 400 (Bad Request)
- Verificar se todos os campos obrigatórios estão preenchidos
- Verificar formato da data (YYYY-MM-DD)
- Verificar se o registrationNumber é único
- Verificar se gender é "MALE" ou "FEMALE"

### Erro 500 (Internal Server Error)
- Verificar logs do backend
- Verificar conexão com banco de dados

## Campos Obrigatórios
- `registrationNumber` (string, único)
- `name` (string)
- `breed` (string)
- `color` (string)
- `gender` ("MALE" ou "FEMALE")
- `birthDate` (string, formato YYYY-MM-DD)
- `status` (string)
- `farmId` (number)
- `userId` (number)

## Campos Opcionais
- `category` (string - enum)
- `toe` (string)
- `tod` (string)
- `fatherRegistrationNumber` (string)
- `motherRegistrationNumber` (string)

## Valores Válidos dos Enums

### Status (obrigatório)
- `"ATIVO"` - Animal ativo
- `"INATIVO"` - Animal inativo
- `"MORTO"` - Animal morto
- `"VENDIDO"` - Animal vendido

### Gender (obrigatório)
- `"MALE"` - Macho
- `"FEMALE"` - Fêmea

### Category (opcional)
- `"PO"` - Puro de Origem (Purebred)
- `"PA"` - Puro por Avaliação (Pure by Evaluation)
- `"PC"` - Puro por Cruza (Crossbred)

### Breed (sugestões)
- `"SAANEN"`
- `"BOER"`
- `"ANGLO_NUBIANA"`
- `"PARDA_ALPINA"`
- `"TOGGENBURG"`