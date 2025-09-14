import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { GoatCategoryEnum, categoryLabels } from "../../types/goatEnums.tsx";
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from "../../utils/i18nGoat";
import { mapGoatToBackend, convertResponseToRequest } from "../../Convertes/goats/goatConverter";
import ButtonCard from "../buttons/ButtonCard";

import "./goatCreateForm.css";

interface Props {
  onGoatCreated: () => void;        // Callback executado após criação/edição
  mode?: "create" | "edit";         // Modo do formulário (padrão: "create")
  initialData?: GoatRequestDTO;     // Dados iniciais para edição
  defaultFarmId?: number;           // ID da fazenda padrão
  defaultUserId?: number;           // ID do usuário padrão
  defaultTod?: string;              // TOD padrão (orelha direita)
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
  const [formData, setFormData] = useState<any>({
    registrationNumber: "",           // Gerado automaticamente (TOD + TOE)
    name: "",                         // Nome da cabra
    genderLabel: "Macho",             // Label em português para o select
    breed: "",                        // Raça (obrigatório)
    color: "",                        // Cor
    birthDate: "",                    // Data de nascimento
    statusLabel: "Ativo",             // Label em português para o select
    tod: "",                          // TOD - Orelha Direita (obrigatório)
    toe: "",                          // TOE - Orelha Esquerda (obrigatório)
    category: GoatCategoryEnum.PA,    // Categoria
    fatherRegistrationNumber: "",    // Número de registro do pai
    motherRegistrationNumber: "",    // Número de registro da mãe
    farmId: defaultFarmId || 1,       // ID da fazenda (obrigatório) - usar valor padrão válido
    userId: defaultUserId || 1,      // ID do usuário (obrigatório) - usar valor padrão válido
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preenche dados iniciais no modo edição ou criação com dados da fazenda
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else if (mode === "create") {
      setFormData((prev) => ({
        ...prev,
        farmId: defaultFarmId ?? prev.farmId,
        userId: defaultUserId ?? prev.userId,
        tod: defaultTod ?? prev.tod,
      }));
    }
  }, [mode, initialData, defaultFarmId, defaultUserId, defaultTod]);

  // Atualiza número de registro automaticamente
  useEffect(() => {
    if (formData.tod && formData.toe && mode !== "edit") {
      const generated = formData.tod + formData.toe;
      setFormData((prev) => ({ ...prev, registrationNumber: generated }));
    }
  }, [formData.tod, formData.toe, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Se a categoria mudou para PA, limpar campos de pai e mãe
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

    // Validações obrigatórias conforme documentação
    if (!formData.name.trim()) {
      toast.error("❌ Nome da cabra é obrigatório");
      setIsSubmitting(false);
      return;
    }

    if (!formData.tod.trim()) {
      toast.error("❌ TOD (Orelha Direita) é obrigatório");
      setIsSubmitting(false);
      return;
    }

    if (!formData.toe.trim()) {
      toast.error("❌ TOE (Orelha Esquerda) é obrigatório");
      setIsSubmitting(false);
      return;
    }

    if (!formData.breed.trim()) {
      toast.error("❌ Raça é obrigatória");
      setIsSubmitting(false);
      return;
    }

    if (!formData.color.trim()) {
      toast.error("❌ Cor é obrigatória");
      setIsSubmitting(false);
      return;
    }

    if (!formData.birthDate.trim()) {
      toast.error("❌ Data de nascimento é obrigatória");
      setIsSubmitting(false);
      return;
    }

    // Validar se a data de nascimento não é futura
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    if (birthDate > today) {
      toast.error("❌ Data de nascimento não pode ser futura");
      setIsSubmitting(false);
      return;
    }

    if (formData.farmId <= 0) {
      toast.error("❌ ID da fazenda deve ser maior que 0");
      setIsSubmitting(false);
      return;
    }

    if (formData.userId <= 0) {
      toast.error("❌ ID do usuário deve ser maior que 0");
      setIsSubmitting(false);
      return;
    }

    if (!formData.registrationNumber.trim()) {
      toast.error("❌ Número de registro deve estar gerado");
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ CORREÇÃO: Removida validação GET prévia - deixar o backend tratar duplicatas
      // A validação de registro duplicado é responsabilidade do backend via DuplicateEntityException

      // Converte dados do formulário (PT) para o formato do backend
      const backendData = mapGoatToBackend(formData);
      
      if (mode === "edit") {
        console.log('📝 [DEBUG] Payload para updateGoat:', {
          registrationNumber: formData.registrationNumber,
          payload: backendData,
          timestamp: new Date().toISOString()
        });
        await updateGoat(formData.registrationNumber, backendData);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        console.log('🐐 [DEBUG] Payload para createGoat:', {
          originalFormData: formData,
          backendPayload: backendData,
          timestamp: new Date().toISOString(),
          validations: {
            name: !!formData.name.trim(),
            breed: !!formData.breed.trim(),
            color: !!formData.color.trim(),
            birthDate: !!formData.birthDate.trim(),
            tod: !!formData.tod.trim(),
            toe: !!formData.toe.trim(),
            farmId: formData.farmId > 0,
            userId: formData.userId > 0
          }
        });
        await createGoat(backendData);
        toast.success("🐐 Cabra cadastrada com sucesso!");

        // Criar genealogia após cadastro da cabra (se tiver pais informados)
        if (
          formData.fatherRegistrationNumber &&
          formData.motherRegistrationNumber
        ) {
          try {
            // Criar genealogia com os dados corretos
            const genealogyData = {
              animalName: formData.name,
              animalRegistration: formData.registrationNumber,
              fatherRegistration: formData.fatherRegistrationNumber,
              motherRegistration: formData.motherRegistrationNumber
            };
            
            // POST /api/genealogies/{registrationNumber} ou POST /api/genealogies
            await createGenealogy(formData.registrationNumber, genealogyData);
            toast.success("🌳 Genealogia criada com sucesso!");
          } catch (err: any) {
            console.error("Erro ao criar genealogia:", {
              error: err?.response?.data || err.message,
              status: err?.response?.status,
              genealogyData: {
                animalRegistration: formData.registrationNumber,
                fatherRegistration: formData.fatherRegistrationNumber,
                motherRegistration: formData.motherRegistrationNumber
              }
            });
            toast.warn("⚠️ Cabra cadastrada, mas não foi possível criar a genealogia.");
          }
        }

        // Redirecionar para a lista de cabras após cadastro bem-sucedido
        setTimeout(() => {
          navigate('/cabras');
        }, 1500); // Aguarda 1.5s para mostrar a mensagem de sucesso

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
      
      // Verificar se é erro de conflito (409)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 409) {
          toast.error("❌ Erro: Já existe uma cabra com este número de registro. Verifique o TOD (Orelha Direita).");
        } else if (axiosError.response?.status === 400) {
          toast.error("❌ Dados inválidos. Verifique se todos os campos obrigatórios estão preenchidos corretamente.");
        } else {
          toast.error("❌ Erro ao salvar cabra. Tente novamente.");
        }
      } else {
        toast.error("❌ Erro ao salvar cabra. Verifique os dados.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-cadastro" onSubmit={handleSubmit}>
      {/* Seção: Dados da Cabra */}
      <h2>Dados da Cabra</h2>
      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Nome da Cabra *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>TOD (Orelha Direita) *</label>
            <input
              type="text"
              name="tod"
              value={formData.tod}
              onChange={handleChange}
              required
              readOnly={!!defaultTod}
            />
          </div>

          <div className="form-group">
            <label>TOE (Orelha Esquerda) *</label>
            <input
              type="text"
              name="toe"
              value={formData.toe}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Número de Registro *</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
              placeholder="Digite o número de registro"
            />
          </div>

          <div className="form-group">
            <label>Cor</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          <div className="form-group date-field">
            <label>Data de Nascimento</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="col">
          <div className="form-group">
            <label>Sexo *</label>
            <select
              name="genderLabel"
              value={formData.genderLabel}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o sexo</option>
              {UI_GENDER_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              name="statusLabel"
              value={formData.statusLabel}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o status</option>
              {UI_STATUS_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Selecione uma categoria</option>
              {Object.values(GoatCategoryEnum).map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>ID da Fazenda *</label>
            <input
              type="number"
              name="farmId"
              value={formData.farmId}
              readOnly={!!defaultFarmId}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Genealogia - Condicional baseada na categoria */}
      {formData.category !== GoatCategoryEnum.PA && (
        <>
          <h2>Genealogia</h2>
          <div className="genealogy-info">
            <p className="info-text">
              📝 <strong>Nota:</strong> Para animais {categoryLabels[formData.category || GoatCategoryEnum.PO]}, 
              os dados de genealogia (pai e mãe) são obrigatórios.
            </p>
          </div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label>Número de Registro do Pai *</label>
                <input
                  type="text"
                  name="fatherRegistrationNumber"
                  value={formData.fatherRegistrationNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label>Número de Registro da Mãe *</label>
                <input
                  type="text"
                  name="motherRegistrationNumber"
                  value={formData.motherRegistrationNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Informação para animais PA */}
      {formData.category === GoatCategoryEnum.PA && (
        <>
          <h2>Genealogia</h2>
          <div className="genealogy-info pa-info">
            <p className="info-text">
              ✅ <strong>Animais PA (Puro por Avaliação):</strong> 
              Os dados de genealogia (pai e mãe) são opcionais para esta categoria.
            </p>
          </div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label>Número de Registro do Pai (opcional)</label>
                <input
                  type="text"
                  name="fatherRegistrationNumber"
                  value={formData.fatherRegistrationNumber}
                  onChange={handleChange}
                  placeholder="Deixe em branco se não souber"
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label>Número de Registro da Mãe (opcional)</label>
                <input
                  type="text"
                  name="motherRegistrationNumber"
                  value={formData.motherRegistrationNumber}
                  onChange={handleChange}
                  placeholder="Deixe em branco se não souber"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Seção: Informações Adicionais */}
      <h2>Informações Adicionais</h2>
      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Raça *</label>
            <select
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              required
            >
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
        
        <div className="col">
          <div className="form-group">
            <label>ID do Usuário *</label>
            <input
              type="number"
              name="userId"
              value={formData.userId}
              readOnly={true}
              onChange={handleChange}
              required
            />
          </div>
        </div>
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
        />
      </div>
    </form>
  );
}
