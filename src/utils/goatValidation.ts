import { z } from "zod";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "./i18nGoat";

// Schema de validação com rótulos em português
export const goatFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  registrationNumber: z.string().min(1, "Número de registro obrigatório"),
  farmId: z.string().min(1, "Selecione uma fazenda"),
  genderLabel: z.enum(["Macho", "Fêmea"] as const, {
    errorMap: () => ({ message: "Selecione o gênero" })
  }),
  statusLabel: z.enum(["Ativo", "Inativo", "Vendido", "Falecido"] as const, {
    errorMap: () => ({ message: "Selecione o status" })
  }),
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  category: z.string().optional(),
  weight: z.number().positive("Peso deve ser positivo").optional(),
  observations: z.string().optional(),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
});

export type GoatFormData = z.infer<typeof goatFormSchema>;

// Validação para edição (todos os campos opcionais exceto ID)
export const goatEditSchema = goatFormSchema.partial().extend({
  id: z.string().min(1, "ID obrigatório")
});

export type GoatEditData = z.infer<typeof goatEditSchema>;