import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Button, EmptyState, LoadingState, Modal } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { dryLactation, getLactationById } from "../../api/GoatFarmAPI/lactation";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
};

export default function LactationDetailPage() {
  const { farmId, goatId, lactationId } = useParams<{
    farmId: string;
    goatId: string;
    lactationId: string;
  }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [lactation, setLactation] = useState<LactationResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDryModal, setShowDryModal] = useState(false);
  const [dryDate, setDryDate] = useState("");
  const [dryError, setDryError] = useState<string | null>(null);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const lactationIdNumber = useMemo(() => Number(lactationId), [lactationId]);
  const { canManageLactation } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canManageLactation;

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId || !lactationId) return;
      try {
        setLoading(true);
        const [goatData, lactationData] = await Promise.all([
          fetchGoatById(farmIdNumber, goatId),
          getLactationById(farmIdNumber, goatId, lactationIdNumber),
        ]);
        setGoat(goatData);
        setLactation(lactationData);
      } catch (error) {
        console.error("Erro ao carregar lactação", error);
        toast.error("Erro ao carregar detalhes da lactação");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [farmId, farmIdNumber, goatId, lactationId, lactationIdNumber]);

  const handleDry = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!lactation) return;
    if (!dryDate) {
      setDryError("Informe a data de secagem.");
      return;
    }
    try {
      setDryError(null);
      await dryLactation(farmIdNumber, goatId!, lactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada com sucesso");
      setShowDryModal(false);
      setDryDate("");
      const updated = await getLactationById(farmIdNumber, goatId!, lactation.id);
      setLactation(updated);
    } catch (error) {
      console.error("Erro ao encerrar lactação", error);
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setDryError(message);
      toast.error(message);
    }
  };

  if (loading) {
    return <LoadingState label="Carregando detalhes da lactação..." />;
  }

  if (!lactation) {
    return (
      <EmptyState
        title="Lactação não encontrada"
        description="Não foi possível localizar o ciclo informado para este animal."
      />
    );
  }

  return (
    <div className="module-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title="Detalhes da lactação"
          subtitle={`${goat?.name || goatId} · Registro ${goatId} · Fazenda · Cabra`}
          showBackButton
          backTo={`/app/goatfarms/${farmId}/goats/${goatId}/lactations`}
          actions={
            <div className="lactation-page__actions">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactation.id}/summary`
                  )
                }
              >
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i> Ver sumário
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)}
              >
                <i className="fa-solid fa-jug-detergent" aria-hidden="true"></i> Produção de leite
              </Button>
              {lactation.status === "ACTIVE" && (
                <Button
                  variant="warning"
                  disabled={!canManage}
                  title={!canManage ? "Sem permissão para encerrar a lactação." : ""}
                  onClick={() => {
                    if (!canManage) return;
                    setShowDryModal(true);
                  }}
                >
                  <i className="fa-solid fa-stop" aria-hidden="true"></i> Realizar secagem
                </Button>
              )}
            </div>
          }
        />
      </section>

      <section className="lactation-detail-grid">
        <div className="lactation-detail-card">
          <h4>Status</h4>
          <span
            className={`lactation-status-badge ${
              lactation.status === "ACTIVE"
                ? "lactation-status-badge--active"
                : "lactation-status-badge--closed"
            }`}
          >
            <i className="fa-solid fa-circle" aria-hidden="true"></i>
            {lactation.status === "ACTIVE" ? "Ativa" : "Encerrada"}
          </span>
        </div>
        <div className="lactation-detail-card">
          <h4>Início</h4>
          <p>{formatDate(lactation.startDate)}</p>
        </div>
        <div className="lactation-detail-card">
          <h4>Fim / secagem</h4>
          <p>{formatDate(lactation.endDate)}</p>
        </div>
        <div className="lactation-detail-card">
          <h4>Início da gestação</h4>
          <p>{formatDate(lactation.pregnancyStartDate)}</p>
        </div>
        <div className="lactation-detail-card">
          <h4>Início da secagem</h4>
          <p>{formatDate(lactation.dryStartDate)}</p>
        </div>
      </section>

      {lactation.status !== "ACTIVE" && (
        <div className="lactation-note-card">
          <p>
            Esta lactação já foi encerrada. Consulte a produção de leite associada para avaliar o
            desempenho completo do ciclo.
          </p>
        </div>
      )}

      <Modal
        open={showDryModal}
        onClose={() => setShowDryModal(false)}
        title="Encerrar lactação"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDryModal(false)}>
              Cancelar
            </Button>
            <Button variant="warning" onClick={handleDry} disabled={!canManage}>
              Confirmar secagem
            </Button>
          </>
        }
      >
        <p>Esta ação encerra a lactação e não pode ser desfeita.</p>
        <div className="lm-form-group">
          <label htmlFor="dry-date-detail">Data de secagem</label>
          <input
            id="dry-date-detail"
            type="date"
            value={dryDate}
            onChange={(e) => {
              setDryDate(e.target.value);
              setDryError(null);
            }}
            disabled={!canManage}
          />
          {dryError && <p className="text-danger">{dryError}</p>}
        </div>
      </Modal>
    </div>
  );
}

