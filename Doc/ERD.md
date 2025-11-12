# 🧩 ERD — Diagramas em Mermaid

> Visualização do modelo de dados do CapriGestor dividida em três partes para leitura mais clara. Estes blocos são compatíveis com GitHub e extensões de Markdown com suporte a Mermaid.

## 1) RBAC (Usuários, Roles)

```mermaid
%%{init: {'theme': 'default', 'fontSize': 14}}%%
erDiagram
    USER ||--o{ USERROLE : has
    ROLE ||--o{ USERROLE : assigned

    USER {
        long id
        string username
        string email
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }
    ROLE {
        long id
        string name
    }
    USERROLE {
        long id
        long userId
        long roleId
    }
```

## 2) Fazenda e Contato

```mermaid
%%{init: {'theme': 'default', 'fontSize': 14}}%%
erDiagram
    FARM ||--o{ STABLE : contains
    FARM }o--|| ADDRESS : locatedAt
    PERSON ||--o{ PHONE : owns
    PERSON }o--o{ FARM : manages

    FARM {
        long id
        string name
        string tag
        long addressId
        datetime createdAt
        datetime updatedAt
    }
    STABLE {
        long id
        string name
        long farmId
    }
    ADDRESS {
        long id
        string street
        string number
        string neighborhood
        string city
        string state
        string zipcode
        string country
    }
    PERSON {
        long id
        string fullName
        string documentId
        string email
    }
    PHONE {
        long id
        string number
        enum PhoneType
        long personId
    }
```

## 3) Animais e Eventos

```mermaid
%%{init: {'theme': 'default', 'fontSize': 14}}%%
erDiagram
    FARM ||--o{ GOAT : has
    GOAT }o--|| GOAT : father
    GOAT }o--|| GOAT : mother
    GOAT }o--|| FARM : belongs
    GOAT ||--o{ EVENT : registers
    EVENT }o--|| FARM : occursAt

    GOAT {
        long id
        long farmId
        string tag
        string name
        enum Gender
        enum Coat
        long fatherId
        long motherId
        datetime createdAt
        datetime updatedAt
    }
    EVENT {
        long id
        long farmId
        long goatId
        enum EventType
        string payload
        datetime occurredAt
        datetime createdAt
    }
```

---

Para um panorama único, consulte também o diagrama integrado no `README.md`.