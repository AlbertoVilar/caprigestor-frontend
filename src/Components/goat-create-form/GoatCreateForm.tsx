// src/Components/GoatCreateForm.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatBreedEnum, GoatCategoryEnum, breedLabels, categoryLabels } from "../../types/goatEnums";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { convertResponseToRequest, mapGoatToBackend, fromDTOToExtended } from "../../Convertes/goats/goatConverter";
import { GoatFormData } from "../../Convertes/goats/goatConverter";
import { getCurrentUser } from "../../services/auth-service";
import { AxiosError } from "axios";

import "./goatCreateForm.css";

interface Props {
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatResponseDTO;
  defaultFarmId?: number;
  defaultUserId?: number;
  defaultTod?: string;
}

export default function GoatCreateForm({
  onGoatCreated,
  mode = "create",
  initialData,
  defaultFarmId,
  defaultUserId,
  defaultTod,
}: Props) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || defaultUserId || 1;

  const [formData, setFormData] = useState<GoatFormData>({
    registrationNumber: "",
    name: "",
    genderLabel: "Macho",
    breed: "",
    color: "",
    birthDate: "",
    statusLabel: "Ativo",
    tod: "",
    toe: "",
    category: GoatCategoryEnum.PA,
    fatherRegistrationNumber: "",
    motherRegistrationNumber: "",
    farmId: defaultFarmId || 1,
    userId: currentUserId,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  function deriveIdentificationFields(
    registrationNumber?: string,
    tod?: string,
    toe?: string,
    fallbackTod?: string
  ) {
    const normalizedRegistration = registrationNumber?.trim() ?? "";
    const normalizedTod = tod?.trim() ?? "";
    const normalizedToe = toe?.trim() ?? "";
    const normalizedFallbackTod = fallbackTod?.trim() ?? "";

    if (!normalizedRegistration) {
      return {
        tod: normalizedTod,
        toe: normalizedToe,
      };
    }

    if (normalizedTod && normalizedToe) {
      return {
        tod: normalizedTod,
        toe: normalizedToe,
      };
    }

    const inferredTodLength =
      normalizedFallbackTod.length > 0
        ? normalizedFallbackTod.length
        : normalizedRegistration.length > 5
          ? 5
          : 0;

    const inferredTodFromRegistration =
      inferredTodLength > 0 ? normalizedRegistration.slice(0, inferredTodLength) : "";

    const inferredToeFromRegistration =
      inferredTodFromRegistration && normalizedRegistration.startsWith(inferredTodFromRegistration)
        ? normalizedRegistration.slice(inferredTodFromRegistration.length)
        : "";

    const derivedTod =
      normalizedTod ||
      (normalizedFallbackTod && normalizedRegistration.startsWith(normalizedFallbackTod)
        ? normalizedFallbackTod
        : inferredTodFromRegistration);

    const derivedToe =
      normalizedToe ||
      (derivedTod && normalizedRegistration.startsWith(derivedTod)
        ? normalizedRegistration.slice(derivedTod.length)
        : inferredToeFromRegistration);

    return {
      tod: derivedTod,
      toe: derivedToe,
    };
  }

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const convertedData = convertResponseToRequest(fromDTOToExtended(initialData));
      const derivedIdentification = deriveIdentificationFields(
        convertedData.registrationNumber,
        convertedData.tod,
        convertedData.toe,
        defaultTod
      );

      const dataWithFallbacks = {
        ...convertedData,
        userId: convertedData.userId || currentUserId,
        tod: derivedIdentification.tod || "",
        toe: derivedIdentification.toe || "",
        category: convertedData.category || "",
        fatherRegistrationNumber: convertedData.fatherRegistrationNumber || "",
        motherRegistrationNumber: convertedData.motherRegistrationNumber || "",
      };
      setFormData(dataWithFallbacks);
    } else if (mode === "create") {
      setFormData((prev) => ({
        ...prev,
        farmId: defaultFarmId ?? prev.farmId,
        userId: currentUserId,
        tod: defaultTod ?? prev.tod,
      }));
    }
  }, [mode, initialData, defaultFarmId, defaultUserId, defaultTod, currentUserId]);

  useEffect(() => {
    if (mode !== "edit" || !formData.registrationNumber) {
      return;
    }

    const derivedIdentification = deriveIdentificationFields(
      formData.registrationNumber,
      formData.tod,
      formData.toe,
      defaultTod
    );

    if (
      derivedIdentification.tod &&
      derivedIdentification.toe &&
      (derivedIdentification.tod !== formData.tod || derivedIdentification.toe !== formData.toe)
    ) {
      setFormData((prev) => ({
        ...prev,
        tod: prev.tod || derivedIdentification.tod,
        toe: prev.toe || derivedIdentification.toe,
      }));
    }
  }, [mode, formData.registrationNumber, formData.tod, formData.toe, defaultTod]);

  useEffect(() => {
    if (formData.tod && formData.toe && mode !== "edit") {
      const generated = formData.tod + formData.toe;
      setFormData((prev) => ({ ...prev, registrationNumber: generated }));
    }
  }, [formData.tod, formData.toe, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category" && value === GoatCategoryEnum.PA) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        fatherRegistrationNumber: "",
        motherRegistrationNumber: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "farmId" || name === "userId" ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name?.trim()) {
      toast.error("Nome da cabra é obrigatório.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.tod?.trim()) {
      toast.error("TOD (orelha direita) é obrigatório.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.toe?.trim()) {
      toast.error("TOE (orelha esquerda) é obrigatório.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.breed?.trim()) {
      toast.error("Raça é obrigatória.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.color?.trim()) {
      toast.error("Cor é obrigatória.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.birthDate?.trim()) {
      toast.error("Data de nascimento é obrigatória.");
      setIsSubmitting(false);
      return;
    }

    const birthDate = new Date(formData.birthDate);
    if (birthDate > new Date()) {
      toast.error("Data de nascimento não pode ser futura.");
      setIsSubmitting(false);
      return;
    }
    if (Number(formData.farmId) <= 0) {
      toast.error("Fazenda vinculada inválida.");
      setIsSubmitting(false);
      return;
    }
    if (Number(formData.userId) <= 0) {
      toast.error("Responsável inválido.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.registrationNumber?.trim()) {
      toast.error("Número de registro deve ser gerado antes de salvar.");
      setIsSubmitting(false);
      return;
    }

    try {
      const goatPayload = mapGoatToBackend(formData);

      if (mode === "edit") {
        await updateGoat(Number(formData.farmId), formData.registrationNumber!, goatPayload);
        toast.success("Cabra atualizada com sucesso.");
      } else {
        const createdGoat = await createGoat(Number(formData.farmId), goatPayload);
        toast.success("Cabra cadastrada com sucesso.");

        if (formData.fatherRegistrationNumber && formData.motherRegistrationNumber) {
          try {
            await createGenealogy(Number(createdGoat.farmId), createdGoat.registrationNumber);
            toast.success("Genealogia criada com sucesso.");
          } catch (err) {
            const error = err as AxiosError;
            const respData = error.response?.data;
            console.error("Erro ao criar genealogia:", respData ? JSON.stringify(respData) : error.message);
            toast.warn("Cabra cadastrada, mas não foi possível criar a genealogia.");
          }
        }

        setTimeout(() => navigate("/cabras"), 1500);
        setFormData({
          registrationNumber: "",
          name: "",
          genderLabel: "Macho",
          breed: "",
          color: "",
          birthDate: "",
          statusLabel: "Ativo",
          tod: defaultTod || "",
          toe: "",
          category: GoatCategoryEnum.PA,
          fatherRegistrationNumber: "",
          motherRegistrationNumber: "",
          farmId: defaultFarmId || 1,
          userId: defaultUserId || 1,
        });
      }

      onGoatCreated();
    } catch (error: unknown) {
      console.error("Erro ao salvar cabra:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 409) {
        toast.error("Já existe uma cabra com este número de registro.");
      } else if (axiosError.response?.status === 400) {
        toast.error("Dados inválidos. Revise os campos preenchidos.");
      } else {
        toast.error("Erro ao salvar a cabra. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="goat-create-form">
      <header className="goat-create-form__header">
        <div className="goat-create-form__header-copy">
          <h1>{mode === "edit" ? "Editar cabra" : "Cadastrar nova cabra"}</h1>
          <p>
            {mode === "edit"
              ? "Atualize os dados principais da cabra e salve quando terminar."
              : "Preencha os dados principais para adicionar uma nova cabra à fazenda."}
          </p>
        </div>
        <div className="goat-create-form__context">
          <div className="goat-create-form__context-card">
            <span className="goat-create-form__context-label">Fazenda vinculada</span>
            <strong>#{formData.farmId}</strong>
          </div>
          <div className="goat-create-form__context-card">
            <span className="goat-create-form__context-label">Registro gerado</span>
            <strong>{formData.registrationNumber || "Será gerado com TOD + TOE"}</strong>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="goat-create-form__content">
        <section className="goat-create-form__section">
          <div className="goat-create-form__section-head">
            <h2>Dados da cabra</h2>
            <p>Comece pelos dados de identificação. Os campos obrigatórios estão marcados com *.</p>
          </div>

          <div className="goat-create-form__grid goat-create-form__grid--two">
            <label className="goat-create-form__field">
              <span>Nome <span className="goat-create-form__required">*</span></span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </label>

            <label className="goat-create-form__field">
              <span>Sexo <span className="goat-create-form__required">*</span></span>
              <select name="genderLabel" value={formData.genderLabel} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {UI_GENDER_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>

            <label className="goat-create-form__field">
              <span>TOD <span className="goat-create-form__required">*</span></span>
              <input
                type="text"
                name="tod"
                value={formData.tod}
                onChange={handleChange}
                required
                readOnly={mode === "create" && !!defaultTod}
              />
              <small>Identificação da orelha direita.</small>
            </label>

            <label className="goat-create-form__field">
              <span>TOE <span className="goat-create-form__required">*</span></span>
              <input type="text" name="toe" value={formData.toe} onChange={handleChange} required />
              <small>Identificação da orelha esquerda.</small>
            </label>

            <label className="goat-create-form__field">
              <span>Número de registro <span className="goat-create-form__required">*</span></span>
              <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required readOnly />
              <small>Gerado automaticamente a partir de TOD + TOE.</small>
            </label>

            <label className="goat-create-form__field">
              <span>Data de nascimento <span className="goat-create-form__required">*</span></span>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
            </label>

            <label className="goat-create-form__field">
              <span>Raça <span className="goat-create-form__required">*</span></span>
              <select name="breed" value={formData.breed} onChange={handleChange} required>
                <option value="">Selecione a raça</option>
                {Object.values(GoatBreedEnum).map((breed) => (
                  <option key={breed} value={breed}>
                    {breedLabels[breed]}
                  </option>
                ))}
              </select>
            </label>

            <label className="goat-create-form__field">
              <span>Cor <span className="goat-create-form__required">*</span></span>
              <input type="text" name="color" value={formData.color} onChange={handleChange} required />
            </label>

            <label className="goat-create-form__field">
              <span>Categoria</span>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Selecione...</option>
                {Object.values(GoatCategoryEnum).map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            </label>

            <label className="goat-create-form__field">
              <span>Status <span className="goat-create-form__required">*</span></span>
              <select name="statusLabel" value={formData.statusLabel} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {UI_STATUS_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <input type="hidden" name="farmId" value={String(formData.farmId)} readOnly />
          <input type="hidden" name="userId" value={String(formData.userId)} readOnly />
        </section>

        <section className="goat-create-form__section">
          <div className="goat-create-form__section-head">
            <h2>Genealogia</h2>
            <p>Preencha os registros dos pais apenas quando essa informação estiver disponível.</p>
          </div>

          <div className="goat-create-form__grid goat-create-form__grid--two">
            <label className="goat-create-form__field">
              <span>Registro do pai {formData.category !== GoatCategoryEnum.PA && <span className="goat-create-form__required">*</span>}</span>
              <input type="text" name="fatherRegistrationNumber" value={formData.fatherRegistrationNumber} onChange={handleChange} required={mode === "create" && formData.category !== GoatCategoryEnum.PA} />
            </label>

            <label className="goat-create-form__field">
              <span>Registro da mãe {formData.category !== GoatCategoryEnum.PA && <span className="goat-create-form__required">*</span>}</span>
              <input type="text" name="motherRegistrationNumber" value={formData.motherRegistrationNumber} onChange={handleChange} required={mode === "create" && formData.category !== GoatCategoryEnum.PA} />
            </label>
          </div>
        </section>

        <div className="goat-create-form__actions">
          {mode === "edit" && (
            <button
              type="button"
              className="goat-create-form__button goat-create-form__button--secondary"
              onClick={onGoatCreated}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            className="goat-create-form__button goat-create-form__button--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar alterações" : "Cadastrar cabra"}
          </button>
        </div>
      </form>
    </div>
  );
}
