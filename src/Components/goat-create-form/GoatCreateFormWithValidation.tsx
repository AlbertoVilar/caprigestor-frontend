import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { goatFormSchema, type GoatFormData } from "../../utils/goatValidation";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { mapGoatToBackend, convertResponseToRequest } from "../../Convertes/goats/goatConverter";
import ButtonCard from "../buttons/ButtonCard";
import { buildGoatTechnicalToken } from "../../utils/appRoutes";

import "./goatCreateForm.css";

interface Props {
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: unknown;
  defaultFarmId?: number;
}

/**
 * Exemplo de GoatCreateForm com validação Zod e React Hook Form
 * Demonstra como usar o sistema de internacionalização completo
 */
export default function GoatCreateFormWithValidation({
  onGoatCreated,
  mode = "create",
  initialData,
  defaultFarmId,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GoatFormData>({
    resolver: zodResolver(goatFormSchema),
    defaultValues: {
      name: "",
      registrationNumber: "",
      farmId: String(defaultFarmId || 1),
      genderLabel: "Macho",
      statusLabel: "Ativo",
      birthDate: "",
      category: "",
      weight: undefined,
      observations: "",
      motherId: "",
      fatherId: "",
    },
  });

  // Carrega dados iniciais para edição
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const convertedData = convertResponseToRequest(initialData);
      reset(convertedData);
    }
  }, [mode, initialData, reset]);

  const onSubmit = async (data: GoatFormData) => {
    setIsSubmitting(true);

    try {
      // Converte dados do formulário (PT) para o formato do backend
      const backendData = mapGoatToBackend(data);

      if (mode === "edit") {
        const goatIdentifier = data.id != null
          ? buildGoatTechnicalToken(data.id)
          : data.registrationNumber;
        await updateGoat(Number(data.farmId), goatIdentifier, backendData);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        await createGoat(Number(data.farmId), backendData);
        toast.success("🐐 Cabra cadastrada com sucesso!");
        
        // Reset form após criação
        reset({
          name: "",
          registrationNumber: "",
          farmId: String(defaultFarmId || 1),
          genderLabel: "Macho",
          statusLabel: "Ativo",
          birthDate: "",
          category: "",
          weight: undefined,
          observations: "",
          motherId: "",
          fatherId: "",
        });
      }

      onGoatCreated();
    } catch (error) {
      console.error("Erro ao salvar cabra:", error);
      toast.error("❌ Erro ao salvar cabra. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-cadastro">
      <h2>{mode === "edit" ? "Editar Cabra" : "Cadastrar Nova Cabra"}</h2>

      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              {...register("name")}
              className={errors.name ? "error" : ""}
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Número de Registro *</label>
            <input
              type="text"
              {...register("registrationNumber")}
              className={errors.registrationNumber ? "error" : ""}
            />
            {errors.registrationNumber && (
              <span className="error-message">{errors.registrationNumber.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Data de Nascimento *</label>
            <input
              type="date"
              {...register("birthDate")}
              className={errors.birthDate ? "error" : ""}
            />
            {errors.birthDate && (
              <span className="error-message">{errors.birthDate.message}</span>
            )}
          </div>
        </div>

        <div className="col">
          <div className="form-group">
            <label>Sexo *</label>
            <select
              {...register("genderLabel")}
              className={errors.genderLabel ? "error" : ""}
            >
              <option value="">Selecione o sexo</option>
              {UI_GENDER_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            {errors.genderLabel && (
              <span className="error-message">{errors.genderLabel.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              {...register("statusLabel")}
              className={errors.statusLabel ? "error" : ""}
            >
              <option value="">Selecione o status</option>
              {UI_STATUS_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            {errors.statusLabel && (
              <span className="error-message">{errors.statusLabel.message}</span>
            )}
          </div>

          <div className="form-group">
            <label>Fazenda *</label>
            <input
              type="text"
              {...register("farmId")}
              className={errors.farmId ? "error" : ""}
            />
            {errors.farmId && (
              <span className="error-message">{errors.farmId.message}</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Observações</label>
        <textarea
          {...register("observations")}
          rows={3}
          placeholder="Observações adicionais sobre a cabra..."
        />
      </div>

      <div className="submit-button-wrapper">
        <ButtonCard
          name={
            isSubmitting
              ? "Salvando..."
              : mode === "edit"
              ? "Salvar Alterações"
              : "Cadastrar Cabra"
          }
          type="submit"
          className="submit"
          disabled={isSubmitting}
        />
      </div>

      <style>{`
        .error {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
        }
        .error-message {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }
      `}</style>
    </form>
  );
}

/**
 * EXEMPLO DE USO:
 * 
 * // No componente pai:
 * import GoatCreateFormWithValidation from './GoatCreateFormWithValidation';
 * 
 * function MyPage() {
 *   return (
 *     <GoatCreateFormWithValidation
 *       onGoatCreated={() => {
 *         console.log('Cabra criada com sucesso!');
 *         // Recarregar lista, fechar modal, etc.
 *       }}
 *       mode="create"
 *       defaultFarmId={1}
 *       defaultUserId={1}
 *     />
 *   );
 * }
 * 
 * FLUXO COMPLETO:
 * 1. Usuário vê labels em português: "Macho/Fêmea", "Ativo/Inativo/Vendido/Falecido"
 * 2. Validação Zod garante dados corretos com mensagens em PT
 * 3. mapGoatToBackend() converte automaticamente para enums do backend
 * 4. Backend recebe: "MALE/FEMALE", "ATIVO/INACTIVE/SOLD/DECEASED"
 * 5. Na edição, convertResponseToRequest() traduz de volta para PT
 */
