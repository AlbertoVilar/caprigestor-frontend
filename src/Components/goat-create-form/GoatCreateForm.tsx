import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createGoat, updateGoat } from "../../api/GoatAPI/goat";
import { createGenealogy } from "../../api/GenealogyAPI/genealogy";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import ButtonCard from "../buttons/ButtonCard";

import "./goatCreateForm.css";

interface Props {
  onGoatCreated: () => void;
  mode?: "create" | "edit";
  initialData?: GoatRequestDTO;
}

export default function GoatCreateForm({
  onGoatCreated,
  mode = "create",
  initialData,
}: Props) {
  const [formData, setFormData] = useState<GoatRequestDTO>({
    registrationNumber: "",
    name: "",
    gender: "MALE",
    breed: "",
    color: "",
    birthDate: "",
    status: "ATIVO",
    tod: "",
    toe: "",
    category: "",
    fatherRegistrationNumber: "",
    motherRegistrationNumber: "",
    farmId: 0,
    ownerId: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    }
  }, [mode, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "farmId" || name === "ownerId" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "edit") {
        await updateGoat(formData.registrationNumber, formData);
        toast.success("🐐 Cabra atualizada com sucesso!");
      } else {
        // Cria nova cabra
        await createGoat(formData);
        toast.success("🐐 Cabra cadastrada com sucesso!");

        // Cria genealogia automaticamente se pai e mãe estiverem preenchidos
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

        // Limpa o formulário
        setFormData({
          registrationNumber: "",
          name: "",
          gender: "MALE",
          breed: "",
          color: "",
          birthDate: "",
          status: "ATIVO",
          tod: "",
          toe: "",
          category: "",
          fatherRegistrationNumber: "",
          motherRegistrationNumber: "",
          farmId: 0,
          ownerId: 0,
        });
      }

      onGoatCreated();
    } catch (error: unknown) {
      console.error("Erro ao salvar cabra:", error);
      toast.error("❌ Erro ao salvar cabra. Verifique os dados.");
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
            <label>Número de Registro</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
              disabled={mode === "edit"}
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
          <div className="form-group">
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
              <option value="MALE">Macho</option>
              <option value="FEMALE">Fêmea</option>
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
              <option value="ATIVO">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="DECEASED">Falecido</option>
              <option value="SOLD">Vendido</option>
            </select>
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>ID da Fazenda</label>
            <input
              type="number"
              name="farmId"
              value={formData.farmId}
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
          <div className="form-group">
            <label>TOD (Orelha Direita)</label>
            <input
              type="text"
              name="tod"
              value={formData.tod}
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
          <div className="form-group">
            <label>TOE (Orelha Esquerda)</label>
            <input
              type="text"
              name="toe"
              value={formData.toe}
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
        <label>ID do Proprietário</label>
        <input
          type="number"
          name="ownerId"
          value={formData.ownerId}
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
