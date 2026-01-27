import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatByRegistrationNumber } from "../../api/GoatAPI/goat";
import { dryLactation, getActiveLactation } from "../../api/GoatFarmAPI/lactation";
import { usePermissions } from "../../Hooks/usePermissions";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

export default function LactationActivePage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [lactation, setLactation] = useState<LactationResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDryModal, setShowDryModal] = useState(false);
  const [dryDate, setDryDate] = useState("");
  const canManage = permissions.isAdmin() || (goat ? permissions.canEditGoat(goat) : false);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId) return;
      try {
        setLoading(true);
        const [goatData, active] = await Promise.all([
          fetchGoatByRegistrationNumber(goatId),
          getActiveLactation(farmIdNumber, goatId),
        ]);
        setGoat(goatData);
        setLactation(active);
      } catch (error) {
        console.error("Erro ao carregar lactação ativa", error);
        toast.error("Erro ao carregar lactação ativa");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, farmIdNumber, goatId]);

  const handleDry = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (!lactation || !dryDate) {
      toast.warning("Informe a data de secagem");
      return;
    }
    try {
      await dryLactation(farmIdNumber, goatId!, lactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada com sucesso");
      setShowDryModal(false);
      setDryDate("");
      const updated = await getActiveLactation(farmIdNumber, goatId!);
      setLactation(updated);
    } catch (error) {
      console.error("Erro ao secar lactação", error);
      toast.error("Erro ao encerrar lactação");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  return (
    <div className="module-page">
      <section className="module-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Lactação ativa</h2>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="module-actions">
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
            }
          >
            <i className="fa-solid fa-jug-detergent"></i> Produção de leite
          </button>
          {lactation && (
            <button
              className="btn-warning"
              disabled={!canManage}
              title={!canManage ? "Sem permissao para secar lactacao" : ""}
              onClick={() => {
                if (!canManage) return;
                setShowDryModal(true);
              }}
            >
              <i className="fa-solid fa-stop"></i> Realizar secagem
            </button>
          )}
        </div>
      </section>

      {!lactation ? (
        <div className="module-empty">
          Não há lactação ativa registrada para este animal.
        </div>
      ) : (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <h4>Status</h4>
              <span className="status-badge status-active">
                <i className="fa-solid fa-circle"></i> Ativa
              </span>
            </div>
            <div className="detail-card">
              <h4>Início</h4>
              <p>{formatDate(lactation.startDate)}</p>
            </div>
            <div className="detail-card">
              <h4>Início da gestação</h4>
              <p>{formatDate(lactation.pregnancyStartDate)}</p>
            </div>
            <div className="detail-card">
              <h4>Início da secagem</h4>
              <p>{formatDate(lactation.dryStartDate)}</p>
            </div>
          </div>
          <div className="notes-card">
            <p>
              A lactação ativa é usada como referência para registros de produção
              diária. Use o botão de secagem quando a cabra for retirada do ciclo
              produtivo.
            </p>
          </div>
        </>
      )}

      {showDryModal && (
        <div className="lm-modal-overlay">
          <div className="lm-modal-content">
            <h3>Encerrar lactação</h3>
            <p>Informe a data de secagem para fechar o ciclo atual.</p>
            <div className="lm-form-group">
              <label>Data de secagem</label>
              <input
                type="date"
                value={dryDate}
                onChange={(e) => setDryDate(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="lm-modal-actions">
              <button className="btn-secondary" onClick={() => setShowDryModal(false)}>
                Cancelar
              </button>
              <button className="btn-warning" onClick={handleDry} disabled={!canManage}>
                Confirmar secagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
