// src/Components/GoatCreateForm.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatCategoryEnum, categoryLabels } from "../../types/goatEnums";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { convertResponseToRequest, mapGoatToBackend, fromDTOToExtended } from "../../Convertes/goats/goatConverter";
import { GoatFormData } from "../../Convertes/goats/goatConverter";
import { getCurrentUser } from "../../services/auth-service";
import { AxiosError } from "axios";

import "../../styles/forms.css";

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

  // Preenche dados no modo edição
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const convertedData = convertResponseToRequest(fromDTOToExtended(initialData));
      const dataWithFallbacks = {
        ...convertedData,
        userId: convertedData.userId || currentUserId,
        tod: convertedData.tod || "",
        toe: convertedData.toe || "",
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

  // Gera número de registro automaticamente (TOD + TOE)
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

    // Validações obrigatórias
    if (!formData.name?.trim()) {
      toast.error("❌ Nome da cabra é obrigatório");
      setIsSubmitting(false);
      return;
    }
    if (!formData.tod?.trim()) {
      toast.error("❌ TOD (Orelha Direita) é obrigatório");
      setIsSubmitting(false);
      return;
    }
    if (!formData.toe?.trim()) {
      toast.error("❌ TOE (Orelha Esquerda) é obrigatório");
      setIsSubmitting(false);
      return;
    }
    if (!formData.breed?.trim()) {
      toast.error("❌ Raça é obrigatória");
      setIsSubmitting(false);
      return;
    }
    if (!formData.color?.trim()) {
      toast.error("❌ Cor é obrigatória");
      setIsSubmitting(false);
      return;
    }
    if (!formData.birthDate?.trim()) {
      toast.error("❌ Data de nascimento é obrigatória");
      setIsSubmitting(false);
      return;
    }
    const birthDate = new Date(formData.birthDate);
    if (birthDate > new Date()) {
      toast.error("❌ Data de nascimento não pode ser futura");
      setIsSubmitting(false);
      return;
    }
    if (Number(formData.farmId) <= 0) {
      toast.error("❌ ID da fazenda inválido");
      setIsSubmitting(false);
      return;
    }
    if (Number(formData.userId) <= 0) {
      toast.error("❌ ID do usuário inválido");
      setIsSubmitting(false);
      return;
    }
    if (!formData.registrationNumber?.trim()) {
      toast.error("❌ Número de registro deve estar gerado");
      setIsSubmitting(false);
      return;
    }

    try {
      const goatPayload = mapGoatToBackend(formData);

      if (mode === "edit") {
        await updateGoat(Number(formData.farmId), formData.registrationNumber!, goatPayload);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        const createdGoat = await createGoat(goatPayload);
        toast.success("🐐 Cabra cadastrada com sucesso!");

        // Criar genealogia se pais informados
        if (formData.fatherRegistrationNumber && formData.motherRegistrationNumber) {
          try {
            await createGenealogy(Number(createdGoat.farmId), createdGoat.registrationNumber);
            toast.success("🌳 Genealogia criada com sucesso!");
          } catch (err) {
            const error = err as AxiosError;
            const respData = error.response?.data;
            console.error("Erro ao criar genealogia:", respData ? JSON.stringify(respData) : error.message);
            toast.warn("⚠️ Cabra cadastrada, mas não foi possível criar a genealogia.");
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
        toast.error("❌ Já existe uma cabra com este número de registro.");
      } else if (axiosError.response?.status === 400) {
        toast.error("❌ Dados inválidos. Verifique os campos.");
      } else {
        toast.error("❌ Erro ao salvar cabra. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <div className="form-header">
        <h1>{mode === 'edit' ? '📝 Editar Cabra' : '🐐 Cadastro de Cabra'}</h1>
        <p>Preencha os dados abaixo para {mode === 'edit' ? 'atualizar a cabra' : 'cadastrar uma nova cabra'}.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-body">
        <section className="form-section">
          <h2>📋 Dados da Cabra</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Nome <span className="required">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>TOD <span className="required">*</span></label>
              <input type="text" name="tod" value={formData.tod} onChange={handleChange} required readOnly={!!defaultTod} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>TOE <span className="required">*</span></label>
              <input type="text" name="toe" value={formData.toe} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Número de Registro <span className="required">*</span></label>
              <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cor <span className="required">*</span></label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Data de Nascimento <span className="required">*</span></label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sexo <span className="required">*</span></label>
              <select name="genderLabel" value={formData.genderLabel} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {UI_GENDER_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status <span className="required">*</span></label>
              <select name="statusLabel" value={formData.statusLabel} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {UI_STATUS_LABELS.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Selecione...</option>
                {Object.values(GoatCategoryEnum).map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Raça <span className="required">*</span></label>
              <select name="breed" value={formData.breed} onChange={handleChange} required>
                <option value="">Selecione a raça</option>
                <option value="ALPINE">Alpine</option>
                <option value="ALPINA">Alpina</option>
                <option value="ANGLO_NUBIANA">Anglo-Nubiana</option>
                <option value="BOER">Boer</option>
                <option value="MESTIÇA">Mestiça</option>
                <option value="MURCIANA_GRANADINA">Murciana-Granadina</option>
                <option value="SAANEN">Saanen</option>
                <option value="TOGGENBURG">Toggenburg</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ID da Fazenda <span className="required">*</span></label>
              <input type="number" name="farmId" value={formData.farmId} onChange={handleChange} required readOnly={!!defaultFarmId} />
            </div>
            <div className="form-group">
              <label>ID do Usuário <span className="required">*</span></label>
              <input type="number" name="userId" value={formData.userId} onChange={handleChange} required />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>🌳 Genealogia</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Registro do Pai {formData.category !== GoatCategoryEnum.PA && <span className="required">*</span>}</label>
              <input type="text" name="fatherRegistrationNumber" value={formData.fatherRegistrationNumber} onChange={handleChange} required={mode === 'create' && formData.category !== GoatCategoryEnum.PA} />
            </div>
            <div className="form-group">
              <label>Registro da Mãe {formData.category !== GoatCategoryEnum.PA && <span className="required">*</span>}</label>
              <input type="text" name="motherRegistrationNumber" value={formData.motherRegistrationNumber} onChange={handleChange} required={mode === 'create' && formData.category !== GoatCategoryEnum.PA} />
            </div>
          </div>
        </section>

        <div className="form-actions">
          {mode === 'edit' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onGoatCreated}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar Alterações" : "Cadastrar Cabra"}
          </button>
        </div>
      </form>
    </div>
  );
}
