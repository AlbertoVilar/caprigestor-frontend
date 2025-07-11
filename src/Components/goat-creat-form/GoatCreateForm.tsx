import { useState } from "react";
import { createGoat } from "../../api/GoatAPI/goat";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import ButtonCard from "../buttons/ButtonCard";

import "./goatCreateForm.css";

// ✅ Interface de props com o callback
interface Props {
  onGoatCreated: () => void;
}

export default function GoatCreateForm({ onGoatCreated }: Props) {
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
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");

    try {
      await createGoat(formData);
      setSuccessMessage("✅ Cabra cadastrada com sucesso!");
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

      // ✅ Notifica o componente pai (GoatCreateModal)
      onGoatCreated();
    } catch (error) {
      console.error("Erro ao cadastrar cabra:", error);
      setSuccessMessage("❌ Erro ao cadastrar cabra. Verifique os dados.");
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
              <option value="INATIVO">Inativo</option>
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
          <option value="ALPINE">ALPINE</option>
          <option value="ANGLO_NUBIANA">ANGLO NUBIANA</option>
          <option value="BOER">BOER</option>
          <option value="MESTICA">MESTIÇA</option>
          <option value="MURCIANA_GRANADINA">MURCIANA GRANADINA</option>
          <option value="SAANEN">SAANEN</option>
          <option value="TOGGENBURG">TOGGENBURG</option>
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
          name={isSubmitting ? "Enviando..." : "Cadastrar Cabra"}
          type="submit"
          className="submit"
        />
      </div>

      {successMessage && <p className="form-feedback">{successMessage}</p>}
    </form>
  );
}
