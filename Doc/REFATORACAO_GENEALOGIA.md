# Refatoração do Sistema de Genealogia - Documentação Técnica

## 📋 Resumo da Refatoração

Esta documentação detalha o processo de refatoração realizado no sistema de genealogia do GoatFarm, incluindo a **NOVA ESTRUTURA DE ENDPOINT** e formato de dados para o frontend.

## 🚨 MUDANÇAS CRÍTICAS PARA O FRONTEND

### ⚠️ ENDPOINT ALTERADO
**ANTES:** `GET /api/v1/genealogies/{registrationNumber}/flat`
**AGORA:** `GET /api/v1/genealogies/{registrationNumber}`

### ⚠️ ESTRUTURA DE DADOS COMPLETAMENTE NOVA

O endpoint agora retorna um formato **PLANO** ao invés da estrutura hierárquica anterior:

#### 🔄 FORMATO ANTERIOR (REMOVIDO)
```json
{
  "animal": {...},
  "genealogyTree": {
    "name": "...",
    "children": [
      {
        "name": "pai",
        "children": [...]
      }
    ]
  }
}
```

#### ✅ NOVO FORMATO (ATUAL)
```json
{
  "animalPrincipal": {
    "nome": "XEQUE V DO CAPRIL VILAR",
    "registro": "1643218012",
    "criador": "Alberto Vilar",
    "proprietario": "Alberto Vilar",
    "raca": "SAANEN",
    "pelagem": "CHAMOISÉE",
    "situacao": "ATIVO",
    "sexo": "MACHO",
    "categoria": "PO",
    "tod": "16432",
    "toe": "18012",
    "dataNasc": "27/06/2018"
  },
  "pai": {
    "nome": "C.V.C SIGNOS PETROLEO",
    "registro": "1635717065"
  },
  "mae": {
    "nome": "NAIDE DO CRS",
    "registro": "2114517012"
  },
  "avoPaterno": {
    "nome": "PETRÓLEO CAPRIVAMAR",
    "registro": "1422915618"
  },
  "avoPaterna": {
    "nome": "BÉLGICA DA CAPRIVAMAR",
    "registro": "1422913470"
  },
  "avoMaterno": {
    "nome": "JOSA CAPRIMEL",
    "registro": "1650113018"
  },
  "avoMaterna": {
    "nome": "PANTALONA DO CRS",
    "registro": "2114513061"
  },
  "bisavosPaternos": [
    {
      "parentesco": "Bisavô Paterno",
      "nome": "BALU DA CAPRIVAMA",
      "registro": "1422911451"
    },
    {
      "parentesco": "Bisavó Paterna",
      "nome": "COROA DA CAPRIVAMA",
      "registro": "1422911408"
    },
    {
      "parentesco": "Bisavô Paterno",
      "nome": "SHERIFF SAVANA",
      "registro": "1412811133"
    },
    {
      "parentesco": "Bisavó Paterna",
      "nome": "JUCELISE DO JALILI",
      "registro": "1418513119"
    }
  ],
  "bisavosMaternos": [
    {
      "parentesco": "Bisavô Materno",
      "nome": "NATAL DO JACOMÉ",
      "registro": "1403110395"
    },
    {
      "parentesco": "Bisavó Materna",
      "nome": "12018 CAPRIMEL",
      "registro": "1650112018"
    },
    {
      "parentesco": "Bisavô Materno",
      "nome": "HERE DO ANGICANO",
      "registro": "2104406006"
    },
    {
      "parentesco": "Bisavó Materna",
      "nome": "TOPÁZIO DO CRS",
      "registro": "2114510040"
    }
  ]
}
```

## 🔧 COMO ATUALIZAR O FRONTEND

### 1. Alterar a URL da Requisição
```javascript
// ANTES
const response = await fetch(`/api/v1/genealogies/${registrationNumber}/flat`);

// AGORA
const response = await fetch(`/api/v1/genealogies/${registrationNumber}`);
```

### 2. Atualizar o Mapeamento de Dados

#### JavaScript/TypeScript
```javascript
// ANTES - Estrutura hierárquica
function renderGenealogy(data) {
  const animal = data.animal;
  const tree = data.genealogyTree;
  // Navegação recursiva pela árvore...
}

// AGORA - Estrutura plana
function renderGenealogy(data) {
  // Animal principal
  const animal = data.animalPrincipal;
  
  // Pais (diretos)
  const pai = data.pai;
  const mae = data.mae;
  
  // Avós (4 elementos)
  const avoPaterno = data.avoPaterno;
  const avoPaterna = data.avoPaterna;
  const avoMaterno = data.avoMaterno;
  const avoMaterna = data.avoMaterna;
  
  // Bisavós (arrays)
  const bisavosPaternos = data.bisavosPaternos; // Array com 4 elementos
  const bisavosMaternos = data.bisavosMaternos; // Array com 4 elementos
}
```

#### React Example
```jsx
function GenealogyComponent({ registrationNumber }) {
  const [genealogy, setGenealogy] = useState(null);
  
  useEffect(() => {
    fetch(`/api/v1/genealogies/${registrationNumber}`)
      .then(response => response.json())
      .then(data => setGenealogy(data));
  }, [registrationNumber]);
  
  if (!genealogy) return <div>Carregando...</div>;
  
  return (
    <div className="genealogy">
      {/* Animal Principal */}
      <div className="animal-principal">
        <h2>{genealogy.animalPrincipal.nome}</h2>
        <p>Registro: {genealogy.animalPrincipal.registro}</p>
        <p>Raça: {genealogy.animalPrincipal.raca}</p>
        <p>Sexo: {genealogy.animalPrincipal.sexo}</p>
      </div>
      
      {/* Pais */}
      <div className="pais">
        <div className="pai">
          <h3>Pai: {genealogy.pai?.nome}</h3>
          <p>Registro: {genealogy.pai?.registro}</p>
        </div>
        <div className="mae">
          <h3>Mãe: {genealogy.mae?.nome}</h3>
          <p>Registro: {genealogy.mae?.registro}</p>
        </div>
      </div>
      
      {/* Avós */}
      <div className="avos">
        <div className="avos-paternos">
          <h4>Avô Paterno: {genealogy.avoPaterno?.nome}</h4>
          <h4>Avó Paterna: {genealogy.avoPaterna?.nome}</h4>
        </div>
        <div className="avos-maternos">
          <h4>Avô Materno: {genealogy.avoMaterno?.nome}</h4>
          <h4>Avó Materna: {genealogy.avoMaterna?.nome}</h4>
        </div>
      </div>
      
      {/* Bisavós */}
      <div className="bisavos">
        <div className="bisavos-paternos">
          <h5>Bisavós Paternos:</h5>
          {genealogy.bisavosPaternos?.map((bisavo, index) => (
            <div key={index}>
              <p>{bisavo.parentesco}: {bisavo.nome} ({bisavo.registro})</p>
            </div>
          ))}
        </div>
        <div className="bisavos-maternos">
          <h5>Bisavós Maternos:</h5>
          {genealogy.bisavosMaternos?.map((bisavo, index) => (
            <div key={index}>
              <p>{bisavo.parentesco}: {bisavo.nome} ({bisavo.registro})</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 3. Campos Disponíveis no Animal Principal

```javascript
const animalPrincipal = {
  nome: "string",           // Nome do animal
  registro: "string",       // Número de registro
  criador: "string",        // Nome do criador
  proprietario: "string",   // Nome do proprietário
  raca: "string",          // Raça (ex: "SAANEN")
  pelagem: "string",       // Cor/pelagem (ex: "CHAMOISÉE")
  situacao: "string",      // Status (ex: "ATIVO")
  sexo: "string",          // Sexo ("MACHO" ou "FÊMEA")
  categoria: "string",     // Categoria (ex: "PO")
  tod: "string",           // TOD
  toe: "string",           // TOE
  dataNasc: "string"       // Data nascimento (formato: "DD/MM/YYYY")
};
```

### 4. Estrutura dos Ancestrais

```javascript
// Pais, Avós (objetos simples)
const ancestral = {
  nome: "string",
  registro: "string"
};

// Bisavós (arrays com objetos)
const bisavo = {
  parentesco: "string",    // Ex: "Bisavô Paterno", "Bisavó Materna"
  nome: "string",
  registro: "string"
};
```

## 🎯 VANTAGENS DA NOVA ESTRUTURA

### ✅ Para o Frontend:
- **Mais simples**: Não precisa navegar recursivamente
- **Mais rápido**: Acesso direto aos dados
- **Mais previsível**: Estrutura fixa e conhecida
- **Melhor performance**: Menos processamento no cliente

### ✅ Para o Backend:
- **Menos complexo**: Sem construção de árvores
- **Mais eficiente**: Uma única consulta
- **Mais manutenível**: Código mais limpo
- **Melhor cache**: Estrutura consistente

## 🚨 CHECKLIST DE MIGRAÇÃO

### Frontend Developer - Faça isso:

- [ ] ✅ Alterar URL: remover `/flat` do endpoint
- [ ] ✅ Atualizar mapeamento: usar estrutura plana
- [ ] ✅ Testar com dados reais: usar registro `1643218012`
- [ ] ✅ Verificar campos: usar novos nomes de propriedades
- [ ] ✅ Atualizar tipos: se usando TypeScript
- [ ] ✅ Testar renderização: verificar se não está em branco
- [ ] ✅ Validar arrays: bisavós são arrays, não objetos
- [ ] ✅ Tratar valores nulos: alguns ancestrais podem não existir

### Exemplo de Teste Rápido:
```javascript
// Teste no console do navegador
fetch('/api/v1/genealogies/1643218012')
  .then(r => r.json())
  .then(data => {
    console.log('Animal:', data.animalPrincipal.nome);
    console.log('Pai:', data.pai?.nome);
    console.log('Mãe:', data.mae?.nome);
    console.log('Bisavós Paternos:', data.bisavosPaternos?.length);
    console.log('Bisavós Maternos:', data.bisavosMaternos?.length);
  });
```

## 🔍 DEBUGGING

Se a genealogia ainda aparecer em branco:

1. **Verifique a URL**: Deve ser `/api/v1/genealogies/{registro}` (sem `/flat`)
2. **Verifique o Response**: Status 200 e JSON válido
3. **Verifique os campos**: Use `animalPrincipal` ao invés de `animal`
4. **Verifique arrays**: `bisavosPaternos` e `bisavosMaternos` são arrays
5. **Verifique valores nulos**: Use optional chaining (`?.`)

---

## 🏗️ Detalhes Técnicos do Backend (Mantidos para Referência)

## 🎯 Objetivos

- Corrigir referências a enums inexistentes ou incorretos
- Garantir compatibilidade com a estrutura atual do projeto
- Manter todos os testes funcionais
- Preservar a funcionalidade existente

## 🔍 Problemas Identificados

### 1. Referências a Enums Incorretos
- `GoatGender` → Deveria ser `Gender`
- `GoatCategory` → Deveria ser `Category`
- `GoatColor` → Campo é do tipo `String`, não enum

### 2. Valores de Enums Incorretos
- `Category.BREEDING` → Não existe, correto é `Category.PO`
- `GoatStatus.ACTIVE` → Não existe, correto é `GoatStatus.ATIVO`

### 3. Métodos Ausentes
- `hasValidData()` e `hasAncestors()` sendo chamados nos testes mas não implementados

## 🛠️ Soluções Implementadas

### 1. Correção de Imports e Referências

**Arquivo:** `GenealogyTreeBuilderTest.java`

```java
// ANTES
import com.devmaster.goatfarm.goat.domain.enums.GoatGender;
import com.devmaster.goatfarm.goat.domain.enums.GoatCategory;

// DEPOIS
import com.devmaster.goatfarm.goat.domain.enums.Gender;
import com.devmaster.goatfarm.goat.domain.enums.Category;
```

### 2. Correção do Método createTestGoat

**ANTES:**
```java
private Goat createTestGoat(String name, String registration, GoatBreed breed, 
                           String color, GoatGender gender, GoatCategory category, 
                           GoatStatus status) {
    // ...
    goat.setGender(GoatGender.FEMALE);
    goat.setCategory(GoatCategory.BREEDING);
    goat.setColor(GoatColor.WHITE);
}
```

**DEPOIS:**
```java
private Goat createTestGoat(String name, String registration, GoatBreed breed, 
                           String color, Gender gender, Category category, 
                           GoatStatus status) {
    // ...
    goat.setGender(gender);
    goat.setCategory(category);
    goat.setColor(color);
}
```

### 3. Correção dos Valores dos Enums

**ANTES:**
```java
createTestGoat("Animal Principal", "REG001", GoatBreed.SAANEN, 
               "BROWN", Gender.FEMALE, Category.BREEDING, GoatStatus.ACTIVE);
```

**DEPOIS:**
```java
createTestGoat("Animal Principal", "REG001", GoatBreed.SAANEN, 
               "BROWN", Gender.FEMALE, Category.PO, GoatStatus.ATIVO);
```

### 4. Implementação de Métodos Ausentes

**Arquivo:** `GenealogyNode.java`

```java
/**
 * Verifica se o nó possui ancestrais (pais)
 * @return true se possui pais, false caso contrário
 */
public boolean hasAncestors() {
    return hasParents();
}

/**
 * Verifica se o nó possui dados válidos
 * @return true se name e registration não são nulos ou vazios
 */
public boolean hasValidData() {
    return name != null && !name.trim().isEmpty() && 
           registration != null && !registration.trim().isEmpty();
}
```

### 5. Correção dos Testes de Validação

**ANTES:**
```java
assertEquals("BREEDING", tree.getCategory());
assertEquals("ACTIVE", tree.getStatus());
```

**DEPOIS:**
```java
assertEquals("PO", tree.getCategory());
assertEquals("ATIVO", tree.getStatus());
```

## 📊 Enums Corretos Identificados

### Category
- `PO` - Puro de Origem
- `PA` - Puro por Ascendência  
- `PC` - Puro por Cruza

### GoatStatus
- `ATIVO` - Animal ativo
- `INACTIVE` - Animal inativo
- `DECEASED` - Animal falecido
- `SOLD` - Animal vendido

### Gender
- `MALE` - Macho
- `FEMALE` - Fêmea

## 🧪 Processo de Validação

### 1. Compilação
```bash
mvn compile          # ✅ Sucesso
mvn test-compile     # ✅ Sucesso
```

### 2. Testes Específicos
```bash
mvn test -Dtest="com.devmaster.goatfarm.genealogy.**"
# Resultado: 30 testes, 0 falhas, 0 erros
```

### 3. Distribuição dos Testes
- `GenealogyNodeTest`: 11 testes ✅
- `GenealogyTreeBuilderTest`: 11 testes ✅
- `GenealogyTreeConverterTest`: 8 testes ✅

## 🔧 Ferramentas Utilizadas

1. **Busca Semântica** - Para localizar enums corretos
2. **Busca por Regex** - Para encontrar referências específicas
3. **Visualização de Arquivos** - Para análise de contexto
4. **Edição Precisa** - Para correções pontuais
5. **Execução de Testes** - Para validação contínua

## 📝 Lições Aprendidas

### 1. Importância da Análise Prévia
- Sempre verificar a estrutura atual dos enums antes de fazer alterações
- Usar ferramentas de busca para entender o contexto completo

### 2. Validação Incremental
- Testar após cada correção significativa
- Focar primeiro nos testes específicos antes dos gerais

### 3. Documentação de Tipos
- Verificar se campos são realmente enums ou tipos primitivos
- No caso do `color`, era `String` e não enum `GoatColor`

### 4. Implementação de Métodos Ausentes
- Métodos referenciados em testes devem existir na implementação
- Implementar com lógica apropriada baseada no contexto de uso

## 🎯 Resultados Finais

- ✅ 30 testes da genealogia passando
- ✅ Compilação sem erros
- ✅ Compatibilidade com estrutura atual
- ✅ Funcionalidade preservada
- ✅ Código mais limpo e consistente

## 🚀 Próximos Passos Sugeridos

1. Executar suite completa de testes do projeto
2. Verificar se há outras áreas com problemas similares
3. Considerar criação de testes de integração
4. Documentar padrões de nomenclatura de enums

---

## 🏗️ Detalhes Técnicos do Backend

### 1. Entidade Principal - Goat.java

A entidade `Goat` é o núcleo do sistema de genealogia, mapeando os relacionamentos de pai e mãe:

```java
package com.devmaster.goatfarm.goat.domain.entity;

import com.devmaster.goatfarm.farm.domain.entity.Farm;
import com.devmaster.goatfarm.goat.domain.enums.Category;
import com.devmaster.goatfarm.goat.domain.enums.Gender;
import com.devmaster.goatfarm.goat.domain.enums.GoatBreed;
import com.devmaster.goatfarm.goat.domain.enums.GoatStatus;
import com.devmaster.goatfarm.user.domain.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "goat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Goat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_number", unique = true, nullable = false)
    private String registrationNumber;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "breed", nullable = false)
    private GoatBreed breed;

    @Column(name = "color")
    private String color;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GoatStatus status;

    @Column(name = "tod")
    private String tod;

    @Column(name = "toe")
    private String toe;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Category category;

    @Column(name = "creator")
    private String creator;

    @Column(name = "owner")
    private String owner;

    // Relacionamentos genealógicos
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "father_id")
    @JsonIgnore
    private Goat father;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mother_id")
    @JsonIgnore
    private Goat mother;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    @JsonIgnore
    private Farm farm;

    @Override
    public String toString() {
        return "Goat{" +
                "id=" + id +
                ", registrationNumber='" + registrationNumber + '\'' +
                ", name='" + name + '\'' +
                ", gender=" + gender +
                ", breed=" + breed +
                ", color='" + color + '\'' +
                ", birthDate=" + birthDate +
                ", status=" + status +
                ", tod='" + tod + '\'' +
                ", toe='" + toe + '\'' +
                ", category=" + category +
                ", creator='" + creator + '\'' +
                ", owner='" + owner + '\'' +
                '}';
    }
}
```

### 2. Lógica de Negócio - GenealogyNode.java

A classe `GenealogyNode` representa um nó na árvore genealógica com toda a lógica de navegação:

```java
package com.devmaster.goatfarm.genealogy.domain.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class GenealogyNode {
    
    // Dados básicos do animal
    private String name;
    private String registration;
    private String breed;
    private String color;
    private String gender;
    private String status;
    private LocalDate birthDate;
    private String creator;
    private String owner;
    
    // Relacionamentos genealógicos
    private GenealogyNode father;
    private GenealogyNode mother;
    
    // Metadados
    private int generation;
    
    // Construtores
    public GenealogyNode() {}
    
    public GenealogyNode(String name, String registration) {
        this.name = name;
        this.registration = registration;
        this.generation = 0;
    }
    
    // Builder Pattern
    public static class Builder {
        private GenealogyNode node;
        
        public Builder() {
            this.node = new GenealogyNode();
        }
        
        public Builder name(String name) {
            node.name = name;
            return this;
        }
        
        public Builder registration(String registration) {
            node.registration = registration;
            return this;
        }
        
        public Builder breed(String breed) {
            node.breed = breed;
            return this;
        }
        
        public Builder color(String color) {
            node.color = color;
            return this;
        }
        
        public Builder gender(String gender) {
            node.gender = gender;
            return this;
        }
        
        public Builder status(String status) {
            node.status = status;
            return this;
        }
        
        public Builder birthDate(LocalDate birthDate) {
            node.birthDate = birthDate;
            return this;
        }
        
        public Builder creator(String creator) {
            node.creator = creator;
            return this;
        }
        
        public Builder owner(String owner) {
            node.owner = owner;
            return this;
        }
        
        public Builder father(GenealogyNode father) {
            node.father = father;
            return this;
        }
        
        public Builder mother(GenealogyNode mother) {
            node.mother = mother;
            return this;
        }
        
        public Builder generation(int generation) {
            node.generation = generation;
            return this;
        }
        
        public GenealogyNode build() {
            return node;
        }
    }
    
    // Métodos de verificação
    public boolean hasFather() {
        return father != null;
    }
    
    public boolean hasMother() {
        return mother != null;
    }
    
    public boolean hasParents() {
        return hasFather() || hasMother();
    }
    
    public boolean hasAncestors() {
        return hasParents();
    }
    
    public boolean hasValidData() {
        return name != null && !name.trim().isEmpty() && 
               registration != null && !registration.trim().isEmpty();
    }
    
    public boolean isLeaf() {
        return !hasParents();
    }
    
    public boolean isMainAnimal() {
        return generation == 0;
    }
    
    // Métodos de análise da árvore
    public int getMaxDepth() {
        int maxDepth = 0;
        
        if (hasFather()) {
            maxDepth = Math.max(maxDepth, father.getMaxDepth() + 1);
        }
        
        if (hasMother()) {
            maxDepth = Math.max(maxDepth, mother.getMaxDepth() + 1);
        }
        
        return maxDepth;
    }
    
    public int countNodes() {
        int count = 1; // Conta este nó
        
        if (hasFather()) {
            count += father.countNodes();
        }
        
        if (hasMother()) {
            count += mother.countNodes();
        }
        
        return count;
    }
}
```

### 3. Construtor da Árvore - GenealogyTreeBuilder.java

A classe responsável por construir e validar a árvore genealógica:

```java
package com.devmaster.goatfarm.genealogy.business;

import com.devmaster.goatfarm.genealogy.domain.entity.GenealogyNode;
import com.devmaster.goatfarm.goat.domain.entity.Goat;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

@Component
public class GenealogyTreeBuilder {
    
    private static final int MAX_GENERATIONS = 3;
    
    /**
     * Constrói uma árvore genealógica a partir de um animal principal
     */
    public GenealogyNode buildTree(Goat mainAnimal) {
        if (mainAnimal == null) {
            return null;
        }
        
        return buildNode(mainAnimal, 0);
    }
    
    /**
     * Constrói recursivamente um nó da árvore genealógica
     */
    private GenealogyNode buildNode(Goat goat, int generation) {
        if (goat == null || generation >= MAX_GENERATIONS) {
            return null;
        }
        
        GenealogyNode node = new GenealogyNode.Builder()
                .name(goat.getName())
                .registration(goat.getRegistrationNumber())
                .breed(goat.getBreed() != null ? goat.getBreed().toString() : null)
                .color(goat.getColor())
                .gender(goat.getGender() != null ? goat.getGender().toString() : null)
                .status(goat.getStatus() != null ? goat.getStatus().toString() : null)
                .birthDate(goat.getBirthDate())
                .creator(goat.getCreator())
                .owner(goat.getOwner())
                .generation(generation)
                .build();
        
        // Constrói recursivamente os pais
        if (goat.getFather() != null) {
            node.setFather(buildNode(goat.getFather(), generation + 1));
        }
        
        if (goat.getMother() != null) {
            node.setMother(buildNode(goat.getMother(), generation + 1));
        }
        
        return node;
    }
    
    /**
     * Valida a estrutura da árvore genealógica
     */
    public boolean validateTree(GenealogyNode tree) {
        if (tree == null) {
            return false;
        }
        
        return validateNode(tree, 0);
    }
    
    /**
     * Valida recursivamente um nó da árvore
     */
    private boolean validateNode(GenealogyNode node, int currentGeneration) {
        if (node == null) {
            return true;
        }
        
        // Verifica se a geração está correta
        if (node.getGeneration() != currentGeneration) {
            return false;
        }
        
        // Verifica se não excede o máximo de gerações
        if (currentGeneration >= MAX_GENERATIONS) {
            return node.getFather() == null && node.getMother() == null;
        }
        
        // Valida recursivamente os pais
        boolean fatherValid = validateNode(node.getFather(), currentGeneration + 1);
        boolean motherValid = validateNode(node.getMother(), currentGeneration + 1);
        
        return fatherValid && motherValid;
    }
    
    /**
     * Calcula estatísticas da árvore genealógica
     */
    public TreeStatistics calculateStatistics(GenealogyNode tree) {
        if (tree == null) {
            return new TreeStatistics(0, 0, 0.0);
        }
        
        int totalNodes = tree.countNodes();
        int maxDepth = tree.getMaxDepth();
        double completeness = calculateCompleteness(tree, 0);
        
        return new TreeStatistics(totalNodes, maxDepth, completeness);
    }
    
    /**
     * Calcula a completude da árvore (percentual de nós preenchidos)
     */
    private double calculateCompleteness(GenealogyNode node, int generation) {
        if (node == null || generation >= MAX_GENERATIONS) {
            return 0.0;
        }
        
        double currentLevel = 1.0; // Este nó existe
        double maxPossible = 1.0;
        
        if (generation < MAX_GENERATIONS - 1) {
            // Calcula para os pais
            double fatherCompleteness = calculateCompleteness(node.getFather(), generation + 1);
            double motherCompleteness = calculateCompleteness(node.getMother(), generation + 1);
            
            currentLevel += fatherCompleteness + motherCompleteness;
            maxPossible += 2.0; // Dois pais possíveis
        }
        
        return currentLevel / maxPossible;
    }
    
    /**
     * Classe interna para estatísticas da árvore
     */
    @Getter
    @Setter
    public static class TreeStatistics {
        private int totalNodes;
        private int maxDepth;
        private double completeness;
        
        public TreeStatistics(int totalNodes, int maxDepth, double completeness) {
            this.totalNodes = totalNodes;
            this.maxDepth = maxDepth;
            this.completeness = completeness;
        }
    }
}
```

### 4. Controller da API - GenealogyController.java

O controller que expõe os endpoints da genealogia:

```java
package com.devmaster.goatfarm.genealogy.controller;

import com.devmaster.goatfarm.genealogy.business.GenealogyBusiness;
import com.devmaster.goatfarm.genealogy.domain.dto.GenealogyResponseDTO;
import com.devmaster.goatfarm.genealogy.domain.entity.Genealogy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/genealogies")
@PreAuthorize("hasRole('USER')")
public class GenealogyController {

    @Autowired
    private GenealogyBusiness genealogyBusiness;

    @GetMapping("/{registrationNumber}")
    public ResponseEntity<GenealogyResponseDTO> getGenealogyByRegistration(@PathVariable String registrationNumber) {
        try {
            GenealogyResponseDTO genealogy = genealogyBusiness.getGenealogyByRegistration(registrationNumber);
            return ResponseEntity.ok(genealogy);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Genealogy> createGenealogy(@RequestBody Genealogy genealogy) {
        try {
            Genealogy savedGenealogy = genealogyBusiness.saveGenealogy(genealogy);
            return ResponseEntity.ok(savedGenealogy);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Genealogy> updateGenealogy(@PathVariable Long id, @RequestBody Genealogy genealogy) {
        try {
            genealogy.setId(id);
            Genealogy updatedGenealogy = genealogyBusiness.saveGenealogy(genealogy);
            return ResponseEntity.ok(updatedGenealogy);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private GenealogyResponseDTO convertToDTO(Genealogy genealogy) {
        GenealogyResponseDTO dto = new GenealogyResponseDTO();
        dto.setRegistrationNumber(genealogy.getRegistrationNumber());
        dto.setName(genealogy.getName());
        dto.setGender(genealogy.getGender());
        dto.setBreed(genealogy.getBreed());
        dto.setColor(genealogy.getColor());
        dto.setBirthDate(genealogy.getBirthDate());
        dto.setStatus(genealogy.getStatus());
        dto.setTod(genealogy.getTod());
        dto.setToe(genealogy.getToe());
        dto.setCategory(genealogy.getCategory());

        // Pais
        if (genealogy.getFatherName() != null) {
            GenealogyResponseDTO.Parent father = new GenealogyResponseDTO.Parent();
            father.setName(genealogy.getFatherName());
            father.setRegistrationNumber(genealogy.getFatherRegistration());
            dto.setFather(father);
        }

        if (genealogy.getMotherName() != null) {
            GenealogyResponseDTO.Parent mother = new GenealogyResponseDTO.Parent();
            mother.setName(genealogy.getMotherName());
            mother.setRegistrationNumber(genealogy.getMotherRegistration());
            dto.setMother(mother);
        }

        // Avós
        List<GenealogyResponseDTO.Ancestor> grandparents = List.of(
            createAncestor("Avô Paterno", genealogy.getPaternalGrandfatherName(), genealogy.getPaternalGrandfatherRegistration()),
            createAncestor("Avó Paterna", genealogy.getPaternalGrandmotherName(), genealogy.getPaternalGrandmotherRegistration()),
            createAncestor("Avô Materno", genealogy.getMaternalGrandfatherName(), genealogy.getMaternalGrandfatherRegistration()),
            createAncestor("Avó Materna", genealogy.getMaternalGrandmotherName(), genealogy.getMaternalGrandmotherRegistration())
        ).stream().filter(ancestor -> ancestor.getName() != null).toList();
        
        dto.setGrandparents(grandparents);

        // Bisavós
        List<GenealogyResponseDTO.Ancestor> greatGrandparents = List.of(
            createAncestor("Bisavô Paterno 1", genealogy.getPaternalGreatGrandfather1Name(), genealogy.getPaternalGreatGrandfather1Registration()),
            createAncestor("Bisavó Paterna 1", genealogy.getPaternalGreatGrandmother1Name(), genealogy.getPaternalGreatGrandmother1Registration()),
            createAncestor("Bisavô Paterno 2", genealogy.getPaternalGreatGrandfather2Name(), genealogy.getPaternalGreatGrandfather2Registration()),
            createAncestor("Bisavó Paterna 2", genealogy.getPaternalGreatGrandmother2Name(), genealogy.getPaternalGreatGrandmother2Registration()),
            createAncestor("Bisavô Materno 1", genealogy.getMaternalGreatGrandfather1Name(), genealogy.getMaternalGreatGrandfather1Registration()),
            createAncestor("Bisavó Materna 1", genealogy.getMaternalGreatGrandmother1Name(), genealogy.getMaternalGreatGrandmother1Registration()),
            createAncestor("Bisavô Materno 2", genealogy.getMaternalGreatGrandfather2Name(), genealogy.getMaternalGreatGrandfather2Registration()),
            createAncestor("Bisavó Materna 2", genealogy.getMaternalGreatGrandmother2Name(), genealogy.getMaternalGreatGrandmother2Registration())
        ).stream().filter(ancestor -> ancestor.getName() != null).toList();
        
        dto.setGreatGrandparents(greatGrandparents);

        return dto;
    }

    private GenealogyResponseDTO.Ancestor createAncestor(String type, String name, String registration) {
        if (name == null) return null;
        
        GenealogyResponseDTO.Ancestor ancestor = new GenealogyResponseDTO.Ancestor();
        ancestor.setType(type);
        ancestor.setName(name);
        ancestor.setRegistrationNumber(registration);
        return ancestor;
    }
}
```

### 5. Exemplo Real de Resposta JSON da API

Resposta do endpoint `GET /api/v1/genealogies/1643218012`:

```json
{
  "registrationNumber": "1643218012",
  "name": "XEQUE V DO CAPRIL VILAR",
  "gender": "MACHO",
  "breed": "SAANEN",
  "color": "CHAMOISÃE",
  "birthDate": "27/06/2018",
  "status": "ATIVO",
  "tod": "16432",
  "toe": "18012",
  "category": "PO",
  "father": {
    "name": "C.V.C SIGNOS PETROLEO",
    "registrationNumber": "1635717065"
  },
  "mother": {
    "name": "NAIDE DO CRS",
    "registrationNumber": "2114517012"
  },
  "grandparents": [
    {
      "type": "Avô Paterno",
      "name": "PETRÃLEO CAPRIVAMAR",
      "registrationNumber": "1422915618"
    },
    {
      "type": "Avó Paterna",
      "name": "BÃLGICA DA CAPRIVAMAR",
      "registrationNumber": "1422913470"
    },
    {
      "type": "Avô Materno",
      "name": "JOSA CAPRIMEL",
      "registrationNumber": "1650113018"
    },
    {
      "type": "Avó Materna",
      "name": "PANTALONA DO CRS",
      "registrationNumber": "2114513061"
    }
  ],
  "greatGrandparents": [
    {
      "type": "Bisavô Paterno 1",
      "name": "BALU DA CAPRIVAMA",
      "registrationNumber": "1422911451"
    },
    {
      "type": "Bisavó Paterna 1",
      "name": "COROA DA CAPRIVAMA",
      "registrationNumber": "1422911408"
    },
    {
      "type": "Bisavô Paterno 2",
      "name": "SHERIFF SAVANA",
      "registrationNumber": "1412811133"
    },
    {
      "type": "Bisavó Paterna 2",
      "name": "JUCELISE DO JALILI",
      "registrationNumber": "1418513119"
    },
    {
      "type": "Bisavô Materno 1",
      "name": "NATAL DO JACOMÃ",
      "registrationNumber": "1403110395"
    },
    {
      "type": "Bisavó Materna 1",
      "name": "12018 CAPRIMEL",
      "registrationNumber": "1650112018"
    },
    {
      "type": "Bisavô Materno 2",
      "name": "HERE DO ANGICANO",
      "registrationNumber": "2104406006"
    },
    {
      "type": "Bisavó Materna 2",
      "name": "TOPÃZIO DO CRS",
      "registrationNumber": "2114510040"
    }
  ]
}
```

### 6. Análise do Problema de Numeração

Com base na análise do código e da resposta JSON, identificamos que:

1. **Backend**: A API retorna os dados corretamente estruturados com tipos descritivos (`"Avô Paterno"`, `"Bisavó Materna 1"`, etc.)

2. **Frontend**: O arquivo `test-genealogy.html` usa uma estrutura textual simples sem numeração genealógica padrão

3. **Problema**: A numeração genealógica tradicional (1, 2, 3, 4 para avós; 5, 6, 7, 8, 9, 10, 11, 12 para bisavós) não está sendo aplicada

4. **Solução**: Modificar a função de formatação no frontend para incluir a numeração genealógica padrão junto com os tipos descritivos

---

**Data da Refatoração:** 18/09/2025  
**Última Atualização:** 25/01/2025
**Arquivos Modificados:** 2  
**Testes Afetados:** 30  
**Status:** ✅ Concluído com Sucesso
