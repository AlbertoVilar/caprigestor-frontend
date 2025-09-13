import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat, updateGoat, fetchGoatByRegistrationNumber } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum, categoryLabels, statusLabels, genderLabels } from "../../types/goatEnums.tsx";
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
  const [formData, setFormData] = useState<GoatRequestDTO>({
    registrationNumber: "",
    name: "",
    gender: GoatGenderEnum.MALE,
    breed: "",
    color: "",
    birthDate: "",
    status: GoatStatusEnum.ATIVO,
    tod: "",
    toe: "",
    category: GoatCategoryEnum.PA,
    fatherRegistrationNumber: "",
    motherRegistrationNumber: "",
    farmId: 0,
    userId: 0,
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "farmId" || name === "userId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação prévia para evitar duplicatas (apenas no modo create)
      if (mode === "create" && formData.registrationNumber) {
        try {
          await fetchGoatByRegistrationNumber(formData.registrationNumber);
          // Se chegou aqui, significa que já existe uma cabra com este TOD
          toast.error("❌ Já existe uma cabra cadastrada com este TOD (Orelha Direita). Verifique o número de registro.");
          setIsSubmitting(false);
          return;
        } catch (error: any) {
          // Se deu erro 404, significa que não existe - pode prosseguir
          if (error.response?.status === 404) {
            console.log('✅ TOD disponível para cadastro');
          } else if (error.response?.status === 500) {
            // Erro 500 no servidor - permite prosseguir mas avisa
            console.warn('⚠️ Erro no servidor ao validar TOD, prosseguindo com cadastro');
            toast.warn('⚠️ Não foi possível validar duplicata do TOD. Prosseguindo com cadastro.');
          } else {
            // Outros erros - falha na validação
            console.error('❌ Erro na validação de duplicata:', error);
            toast.error('❌ Erro ao validar TOD. Tente novamente.');
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (mode === "edit") {
        await updateGoat(formData.registrationNumber, formData);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        await createGoat(formData);
        toast.success("🐐 Cabra cadastrada com sucesso!");

        if (
          formData.fatherRegistrationNumber &&
          formData.motherRegistrationNumber
        ) {
          try {
            await createGenealogy(formData.registrationNumber);
            toast.success("🌳 Genealogia gerada com sucesso!");
          } catch (err) {
            console.error("Erro ao criar genealogia:", err);
            toast.warn("⚠️ Cabra cadastrada, mas não foi possível gerar a genealogia.");
          }
        }

        // Redirecionar para a lista de cabras após cadastro bem-sucedido
        setTimeout(() => {
          navigate('/cabras');
        }, 1500); // Aguarda 1.5s para mostrar a mensagem de sucesso

        setFormData({
          registrationNumber: "",
          name: "",
          gender: GoatGenderEnum.MALE,
          breed: "",
          color: "",
          birthDate: "",
          status: GoatStatusEnum.ATIVO,
          tod: defaultTod || "",
          toe: "",
          category: GoatCategoryEnum.PA,
          fatherRegistrationNumber: "",
          motherRegistrationNumber: "",
          farmId: defaultFarmId || 0,
          userId: defaultUserId || 0,
        });
      }

      onGoatCreated();
    } catch (error: unknown) {
      console.error("Erro ao salvar cabra:", error);
      
      // Verificar se é erro de conflito (409)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
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
      <h2>Dados da Cabra</h2>
      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Nome da Cabra</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>TOD (Orelha Direita)</label>
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
            <label>TOE (Orelha Esquerda)</label>
            <input
              type="text"
              name="toe"
              value={formData.toe}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Número de Registro (gerado automaticamente)</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              readOnly
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
            <label>Sexo</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o sexo</option>
              {Object.values(GoatGenderEnum).map((gender) => (
                <option key={gender} value={gender}>
                  {genderLabels[gender]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o status</option>
              {Object.values(GoatStatusEnum).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
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
            <label>ID da Fazenda</label>
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

      <h2>Genealogia</h2>
      <div className="row">
        <div className="col">
          <div className="form-group">
            <label>Número de Registro do Pai</label>
            <input
              type="text"
              name="fatherRegistrationNumber"
              value={formData.fatherRegistrationNumber}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="col">
          <div className="form-group">
            <label>Número de Registro da Mãe</label>
            <input
              type="text"
              name="motherRegistrationNumber"
              value={formData.motherRegistrationNumber}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <h2>Informações Adicionais</h2>
      <div className="form-group">
        <label>Raça</label>
        <select
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          required
        >
          <option value="">Selecione</option>
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

      <div className="form-group">
        <label>ID do Usuário</label>
        <input
          type="number"
          name="userId"
          value={formData.userId}
          readOnly={!!defaultUserId}
          onChange={handleChange}
          required
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
        />
      </div>
    </form>
  );
}
