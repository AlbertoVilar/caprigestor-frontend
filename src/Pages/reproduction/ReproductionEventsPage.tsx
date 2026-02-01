import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { getReproductiveEvents } from "../../api/GoatFarmAPI/reproduction";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { ReproductiveEventResponseDTO } from "../../Models/ReproductionDTOs";
import "./reproductionPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

const eventLabels: Record<string, string> = {
  COVERAGE: "Cobertura",
  PREGNANCY_CHECK: "Check de prenhez",
  PREGNANCY_CLOSE: "Encerramento de gestação",
};

export default function ReproductionEventsPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [events, setEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);

  const loadData = async (pageOverride = page) => {
    if (!farmId || !goatId) return;
    try {
      setLoading(true);
      const [goatData, response] = await Promise.all([
        fetchGoatById(farmIdNumber, goatId),
        getReproductiveEvents(farmIdNumber, goatId, pageOverride, 10),
      ]);
      setGoat(goatData);
      setEvents(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error("Erro ao carregar eventos", error);
      toast.error("Erro ao carregar eventos reprodutivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId]);

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  return (
    <div className="repro-page">
      <section className="repro-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Linha do tempo reprodutiva</h2>
        <p className="text-muted">Fazenda · Cabra · Reprodução</p>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="repro-actions">
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction`)
            }
          >
            <i className="fa-solid fa-layer-group"></i> Voltar ao painel
          </button>
        </div>
      </section>

      {events.length === 0 ? (
        <div className="repro-empty">Nenhum evento reprodutivo registrado.</div>
      ) : (
        <section className="repro-timeline">
          {events.map((event) => (
            <article key={event.id} className="repro-event">
              <div className="repro-event-header">
                <div className="repro-event-title">
                  {eventLabels[event.eventType] || event.eventType}
                </div>
                <div className="repro-event-meta">{formatDate(event.eventDate)}</div>
              </div>
              <div className="repro-event-meta">
                {event.breedingType && (
                  <span>Tipo: {event.breedingType === "AI" ? "IA" : "Natural"} · </span>
                )}
                {event.breederRef && <span>Ref.: {event.breederRef} · </span>}
                {event.checkResult && <span>Resultado: {event.checkResult}</span>}
              </div>
              {event.notes && <p>{event.notes}</p>}
              {event.pregnancyId && (
                <div className="repro-actions">
                  <button
                    className="btn-outline"
                    onClick={() =>
                      navigate(
                        `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${event.pregnancyId}`
                      )
                    }
                  >
                    Ver gestação
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <div className="repro-pagination">
        <button
          className="btn-outline"
          disabled={page <= 0}
          onClick={() => {
            const next = Math.max(page - 1, 0);
            setPage(next);
            loadData(next);
          }}
        >
          Anterior
        </button>
        <span>
          Página {page + 1} de {Math.max(totalPages, 1)}
        </span>
        <button
          className="btn-outline"
          disabled={page + 1 >= totalPages}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            loadData(next);
          }}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
