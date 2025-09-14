// src/pages/goat/GoatCreatePage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createGoat } from "../../api/GoatAPI/goat";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum, categoryLabels, statusLabels, genderLabels } from "../../types/goatEnums";
import { useAuth } from "../../contexts/AuthContext";
import "../../Components/goat-create-form/goatCreateForm.css";

const initialFormData: GoatRequestDTO = {
  name: "",
  registrationNumber: "",
  tod: "",
  toe: "",
  gender: "",
  birthDate: "",
  color: "",
  category: GoatCategoryEnum.PA,
  status: GoatStatusEnum.ATIVO,
  breed: "",
  fatherId: undefined,
  motherId: undefined,
  farmId: 0,
  userId: 0,
};

export default function GoatCreatePage() {
  const [formData, setFormData] = useState<GoatRequestDTO>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { tokenPayload } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const farmId = Number(searchParams.get("farmId") || 0);
    const userId = Number(tokenPayload?.userId || 0);
    
    if (farmId && userId) {
      setFormData(prev => ({
        ...prev,
        farmId,
        userId
      }));
    }
  }, [searchParams, tokenPayload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validações básicas
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }
    if (!formData.tod.trim()) {
      newErrors.tod = "TOD é obrigatório";
    }
    if (!formData.toe.trim()) {
      newErrors.toe = "TOE é obrigatório";
    }
    if (!formData.gender) {
      newErrors.gender = "Sexo é obrigatório";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await createGoat(formData);
      toast.success("✅ Cabra cadastrada com sucesso!");
      navigate("/goats");
    } catch (error: any) {
      console.error("Erro ao cadastrar cabra:", error);
      toast.error("❌ Erro ao cadastrar cabra. Verifique os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <form className="form-cadastro" onSubmit={handleSubmit}>
        <h2>Cadastrar Nova Cabra</h2>
        
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
              {errors.name && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>TOD (Orelha Direita)</label>
              <input
                type="text"
                name="tod"
                value={formData.tod}
                onChange={handleChange}
                required
              />
              {errors.tod && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.tod}</span>}
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
              {errors.toe && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.toe}</span>}
            </div>

            <div className="form-group">
              <label>Número de Registro (gerado automaticamente)</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="Será gerado automaticamente"
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
              {errors.gender && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
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
                {Object.values(GoatCategoryEnum).map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Raça</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ID do Pai</label>
              <input
                type="number"
                name="fatherId"
                value={formData.fatherId || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ID da Mãe</label>
              <input
                type="number"
                name="motherId"
                value={formData.motherId || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-buttons-container">
          <button
            type="button"
            onClick={() => navigate("/goats")}
            className="btn-cancel"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-submit ${isSubmitting ? 'submitting' : ''}`}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar Cabra"}
          </button>
        </div>
      </form>

      <style>{`
        .container { max-width: 920px; margin: 0 auto; padding: 12px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .form-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
        .form-grid input, .form-grid select { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
        .form-inline { display: flex; gap: 8px; margin: 8px 0 16px; }
        .readonly-pill { background: #f5f5f5; border: 1px dashed #ccc; border-radius: 999px; padding: 6px 12px; font-size: 12px; }
        .alert-error { background: #ffebee; border: 1px solid #ef9a9a; padding: 10px 12px; border-radius: 8px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .btn { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; }
        .btn-secondary { background: #e9ecef; }
        .btn-primary { background: #0d6efd; color: #fff; }
      `}</style>
    </div>
  );
}