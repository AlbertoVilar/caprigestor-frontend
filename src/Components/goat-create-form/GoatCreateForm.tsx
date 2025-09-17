// src/Components/GoatCreateForm.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { GoatCategoryEnum, categoryLabels } from "../../types/goatEnums";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { convertResponseToRequest, mapGoatToBackend } from "../../Convertes/goats/goatConverter";
import { getCurrentUser } from "../../services/auth-service";
import ButtonCard from "../buttons/ButtonCard";

import "./goatCreateForm.css";

interface Props {
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatRequestDTO;
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

  // Mantive "any" para aceitar campos extras (genderLabel/statusLabel)
  const [formData, setFormData] = useState<any>({
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
      const convertedData = convertResponseToRequest(initialData as any);
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
      setFormData((prev: any) => ({
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
      setFormData((prev: any) => ({ ...prev, registrationNumber: generated }));
    }
  }, [formData.tod, formData.toe, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category" && value === GoatCategoryEnum.PA) {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value,
        fatherRegistrationNumber: "",
        motherRegistrationNumber: "",
      }));
    } else {
      setFormData((prev: any) => ({
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
    if (formData.farmId <= 0) {
      toast.error("❌ ID da fazenda inválido");
      setIsSubmitting(false);
      return;
    }
    if (formData.userId <= 0) {
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
      // ✅ NÃO mapear aqui. O arquivo api/goat.ts já chama mapGoatToBackend internamente.
      if (mode === "edit") {
        await updateGoat(formData.registrationNumber, formData as GoatRequestDTO);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        await createGoat(formData as GoatRequestDTO);
        toast.success("🐐 Cabra cadastrada com sucesso!");

        // Criar genealogia se pais informados
        if (formData.fatherRegistrationNumber && formData.motherRegistrationNumber) {
          try {
            const genealogyData = {
              animalName: formData.name,
              animalRegistration: formData.registrationNumber,
              fatherRegistration: formData.fatherRegistrationNumber,
              motherRegistration: formData.motherRegistrationNumber,
            };
            await createGenealogy(formData.registrationNumber, genealogyData);
            toast.success("🌳 Genealogia criada com sucesso!");
          } catch (err: any) {
            console.error("Erro ao criar genealogia:", err?.response?.data || err.message);
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
    } catch (error: any) {
      console.error("Erro ao salvar cabra:", error);
      if (error.response?.status === 409) {
        toast.error("❌ Já existe uma cabra com este número de registro.");
      } else if (error.response?.status === 400) {
        toast.error("❌ Dados inválidos. Verifique os campos.");
      } else {
        toast.error("❌ Erro ao salvar cabra. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-cadastro" onSubmit={handleSubmit}>
      {/* Dados da Cabra */}
      <h2>Dados da Cabra</h2>
      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Nome *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>TOD *</label>
            <input type="text" name="tod" value={formData.tod} onChange={handleChange} required readOnly={!!defaultTod} />
          </div>
          <div className="form-group">
            <label>TOE *</label>
            <input type="text" name="toe" value={formData.toe} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Número de Registro *</label>
            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Cor *</label>
            <input type="text" name="color" value={formData.color} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Data de Nascimento *</label>
            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
          </div>
        </div>

        <div className="col">
          <div className="form-group">
            <label>Sexo *</label>
            <select name="genderLabel" value={formData.genderLabel} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {UI_GENDER_LABELS.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select name="statusLabel" value={formData.statusLabel} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {UI_STATUS_LABELS.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
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
            <label>ID da Fazenda *</label>
            <input type="number" name="farmId" value={formData.farmId} onChange={handleChange} required readOnly={!!defaultFarmId} />
          </div>
          <div className="form-group">
            <label>ID do Usuário *</label>
            <input type="number" name="userId" value={formData.userId} onChange={handleChange} required />
          </div>
        </div>
      </div>

      {/* Genealogia obrigatória (PO/PC) */}
      {formData.category !== GoatCategoryEnum.PA && (
        <>
          <h2>Genealogia</h2>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label>Registro do Pai *</label>
                <input type="text" name="fatherRegistrationNumber" value={formData.fatherRegistrationNumber} onChange={handleChange} required />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label>Registro da Mãe *</label>
                <input type="text" name="motherRegistrationNumber" value={formData.motherRegistrationNumber} onChange={handleChange} required />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Genealogia opcional (PA) */}
      {formData.category === GoatCategoryEnum.PA && (
        <>
          <h2>Genealogia</h2>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label>Registro do Pai (opcional)</label>
                <input type="text" name="fatherRegistrationNumber" value={formData.fatherRegistrationNumber} onChange={handleChange} />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label>Registro da Mãe (opcional)</label>
                <input type="text" name="motherRegistrationNumber" value={formData.motherRegistrationNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="submit-button-wrapper">
        <ButtonCard
          name={isSubmitting ? "Salvando..." : mode === "edit" ? "Salvar Alterações" : "Cadastrar Cabra"}
          type="submit"
          className="submit"
        />
      </div>
    </form>
  );
}
