import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LactationManager from "../../Components/lactation/LactationManager";
import { fetchGoatByRegistrationNumber } from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "../../index.css";
import "./lactationPages.css";

export default function LactationPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGoat() {
      if (!farmId || !goatId) return;

      try {
        setLoading(true);
        const found = await fetchGoatByRegistrationNumber(goatId);
        setGoat(found);
      } catch (error) {
        console.error("Erro ao carregar animal", error);
        toast.error("Erro ao carregar dados do animal");
      } finally {
        setLoading(false);
      }
    }

    loadGoat();
  }, [farmId, goatId, navigate]);

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  if (!farmId || !goatId || !goat) return null;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div className="page-header mb-4">
        <button className="btn-secondary mb-2" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Gerenciamento de Lactação</h2>
        <p className="text-muted">
          Animal: <strong>{goat.name || goat.registrationNumber}</strong> (Registro: {goat.registrationNumber})
        </p>
        <div className="module-actions">
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/active`)
            }
          >
            <i className="fa-solid fa-eye"></i> Lacta??o ativa
          </button>
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
            }
          >
            <i className="fa-solid fa-jug-detergent"></i> Produ??o de leite
          </button>
        </div>
      </div>

      <div className="page-content">
        <LactationManager 
          farmId={Number(farmId)} 
          goatId={goatId} 
          goatName={goat.name || goat.registrationNumber} 
        />
      </div>
    </div>
  );
}
