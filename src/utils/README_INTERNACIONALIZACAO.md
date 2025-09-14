# Sistema de Internacionalização para Cabras

## ✅ ATUALIZAÇÃO IMPORTANTE - Backend com @JsonValue e @JsonCreator

**O sistema foi simplificado!** O backend agora cuida de toda conversão automaticamente usando anotações Spring:
- `@JsonValue`: Converte enums para português na resposta
- `@JsonCreator`: Aceita valores em português na entrada

**Frontend agora trabalha diretamente com valores em português** - sem necessidade de conversões manuais.

## Arquivos Principais

### 1. `utils/i18nGoat.ts` - ✅ SIMPLIFICADO

```typescript
// ✅ CONVERSÕES REMOVIDAS - Backend cuida de tudo com @JsonValue e @JsonCreator
// Os valores em português podem ser enviados diretamente para o backend

// Arrays para popular selects do formulário (apenas se necessário)
export const UI_STATUS_LABELS = ["Ativo", "Inativo", "Vendido", "Falecido"];
export const UI_GENDER_LABELS = ["Macho", "Fêmea"];
```

### 2. `utils/goatValidation.ts` - Validação Zod em Português

```typescript
export const goatFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  registrationNumber: z.string().min(1, "Número de registro obrigatório"),
  farmId: z.string().min(1, "Selecione uma fazenda"),
  genderLabel: z.enum(["Macho", "Fêmea"]),
  statusLabel: z.enum(["Ativo", "Inativo", "Vendido", "Falecido"]),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
});
```

### 3. `Convertes/goats/goatConverter.ts` - ✅ SIMPLIFICADO

```typescript
// ✅ Converte dados do formulário (PT) para backend - SEM CONVERSÕES!
export const mapGoatToBackend = (goat: any): BackendGoatPayload => {
  return {
    name: goat.name,
    registrationNumber: goat.registrationNumber,
    gender: goat.gender, // ✅ Valor em português enviado diretamente ("Macho"/"Fêmea")
    status: goat.status, // ✅ Valor em português enviado diretamente ("Ativo")
    // ... outros campos
  };
};

// ✅ Backend já retorna valores em português com @JsonValue
export const convertResponseToRequest = (response: ExtendedGoatResponse): GoatFormData => {
  return {
    id: response.id,
    name: response.name,
    gender: response.gender, // ✅ Já vem "Macho"/"Fêmea" do backend
    status: response.status, // ✅ Já vem "Ativo"/"Inativo" do backend
    genderLabel: response.gender, // ✅ Mesmo valor
    statusLabel: response.status, // ✅ Mesmo valor
    // ... outros campos
  };
};
```

## Como Usar no Formulário

### Opção 1: Formulário Simples (GoatCreateForm.tsx)

```typescript
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { mapGoatToBackend, convertResponseToRequest } from "../../Convertes/goats/goatConverter";

// Estado do formulário com labels em português
const [formData, setFormData] = useState({
  name: "",
  genderLabel: "Macho",     // ← Label em português
  statusLabel: "Ativo",     // ← Label em português
  // ... outros campos
});

// Selects em português
<select name="genderLabel" value={formData.genderLabel} onChange={handleChange}>
  <option value="">Selecione o sexo</option>
  {UI_GENDER_LABELS.map((label) => (
    <option key={label} value={label}>{label}</option>
  ))}
</select>

<select name="statusLabel" value={formData.statusLabel} onChange={handleChange}>
  <option value="">Selecione o status</option>
  {UI_STATUS_LABELS.map((label) => (
    <option key={label} value={label}>{label}</option>
  ))}
</select>

// Submit: converte para backend
const handleSubmit = async (e) => {
  const backendData = mapGoatToBackend(formData); // Converte PT → Backend
  await createGoat(backendData);
};

// Edição: converte do backend
useEffect(() => {
  if (mode === "edit" && initialData) {
    const convertedData = convertResponseToRequest(initialData); // Backend → PT
    setFormData(convertedData);
  }
}, [mode, initialData]);
```

### Opção 2: Com Validação Zod (GoatCreateFormWithValidation.tsx)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goatFormSchema, type GoatFormData } from "../../utils/goatValidation";

const { register, handleSubmit, formState: { errors } } = useForm<GoatFormData>({
  resolver: zodResolver(goatFormSchema),
  defaultValues: {
    genderLabel: "Macho",
    statusLabel: "Ativo",
  },
});

const onSubmit = async (data: GoatFormData) => {
  const backendData = mapGoatToBackend(data);
  await createGoat(backendData);
};

// JSX com validação automática
<select {...register("genderLabel")} className={errors.genderLabel ? "error" : ""}>
  {UI_GENDER_LABELS.map((label) => (
    <option key={label} value={label}>{label}</option>
  ))}
</select>
{errors.genderLabel && <span className="error-message">{errors.genderLabel.message}</span>}
```

## Fluxo Completo

### 1. **Exibição (Frontend)**
- Usuário vê: `"Macho"`, `"Fêmea"`, `"Ativo"`, `"Inativo"`, `"Vendido"`, `"Falecido"`
- Selects populados com `UI_GENDER_LABELS` e `UI_STATUS_LABELS`

### 2. **Envio (Frontend → Backend)**
```typescript
// Dados do formulário
const formData = {
  name: "Cabra Teste",
  genderLabel: "Macho",    // ← Português
  statusLabel: "Inativo",  // ← Português
};

// mapGoatToBackend() converte automaticamente
const backendData = mapGoatToBackend(formData);
// Resultado:
// {
//   name: "Cabra Teste",
//   gender: "MALE",      // ← Enum do backend
//   status: "INACTIVE",  // ← Enum do backend
// }
```

### 3. **Carregamento (Backend → Frontend)**
```typescript
// Resposta do backend
const backendResponse = {
  id: 1,
  name: "Cabra Teste",
  gender: "MALE",      // ← Enum do backend
  status: "INACTIVE",  // ← Enum do backend
};

// convertResponseToRequest() traduz para português
const formData = convertResponseToRequest(backendResponse);
// Resultado:
// {
//   id: 1,
//   name: "Cabra Teste",
//   gender: "MALE",
//   genderLabel: "Macho",    // ← Traduzido para PT
//   status: "INACTIVE",
//   statusLabel: "Inativo",  // ← Traduzido para PT
// }
```

## Vantagens

✅ **UX em Português**: Usuário vê tudo em português
✅ **Backend Consistente**: Recebe enums corretos
✅ **Validação em PT**: Mensagens de erro em português
✅ **Manutenção Fácil**: Mappers centralizados
✅ **Flexibilidade**: Funciona com ou sem validação Zod
✅ **Compatibilidade**: Não quebra código existente

## Exemplo de Uso Completo

```typescript
// Página de cadastro
function GoatCreatePage() {
  return (
    <GoatCreateForm
      onGoatCreated={() => {
        toast.success("Cabra cadastrada!");
        navigate("/cabras");
      }}
      mode="create"
      defaultFarmId={1}
    />
  );
}

// Página de edição
function GoatEditPage() {
  const { id } = useParams();
  const [goatData, setGoatData] = useState(null);

  useEffect(() => {
    fetchGoatById(id).then(setGoatData);
  }, [id]);

  return (
    <GoatCreateForm
      onGoatCreated={() => {
        toast.success("Cabra atualizada!");
        navigate("/cabras");
      }}
      mode="edit"
      initialData={goatData} // ← Será convertido automaticamente
    />
  );
}
```

## Resultado Final

🎯 **O usuário vê e escolhe tudo em português** ✅
🎯 **O backend recebe os enums corretos** ✅  
🎯 **Ao editar, converte automaticamente do backend para PT** ✅
🎯 **Validação com mensagens em português** ✅
🎯 **Sistema robusto e escalável** ✅