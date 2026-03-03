import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  dryLactation,
  getActiveLactation,
  getLactationHistory,
  startLactation,
} from "../../api/GoatFarmAPI/lactation";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { Button, EmptyState, LoadingState, Modal, Table } from "../ui";
import "./LactationManager.css";

interface Props {
  farmId: number;
  goatId: string;
  goatName: string;
  canManage?: boolean;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

export default function LactationManager({
  farmId,
  goatId,
  goatName,
  canManage = false,
}: Props) {
  const navigate = useNavigate();
  const [activeLactation, setActiveLactation] = useState<LactationResponseDTO | null>(null);
  const [history, setHistory] = useState<LactationResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [showDryModal, setShowDryModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [dryDate, setDryDate] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [dryError, setDryError] = useState<string | null>(null);
  const [startErrorStatus, setStartErrorStatus] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const active = await getActiveLactation(farmId, goatId);
      setActiveLactation(active);

      const hist = await getLactationHistory(farmId, goatId);
      setHistory(hist.content || []);
    } catch (error) {
      console.error("Erro ao carregar lactação", error);
      toast.error("Não foi possível carregar os dados de lactação deste animal.");
    } finally {
      setLoading(false);
    }
  }, [farmId, goatId]);

  useEffect(() => {
    if (farmId && goatId) {
      void loadData();
    }
  }, [farmId, goatId, loadData]);

  async function handleStartLactation() {
    if (!canManage) {
      toast.error("Você não tem permissão para iniciar uma lactação.");
      return;
    }

    if (!startDate) {
      setStartError("Informe a data de início.");
      return;
    }

    try {
      setStartError(null);
      setStartErrorStatus(null);
      await startLactation(farmId, goatId, { startDate });
      toast.success("Lactação iniciada com sucesso.");
      setShowStartModal(false);
      setStartDate("");
      await loadData();
    } catch (error) {
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setStartErrorStatus(parsed.status ?? null);
      setStartError(message);
      toast.error(message);
    }
  }

  async function handleDryLactation() {
    if (!canManage) {
      toast.error("Você não tem permissão para encerrar a lactação.");
      return;
    }

    if (!activeLactation) return;

    if (!dryDate) {
      setDryError("Informe a data de secagem.");
      return;
    }

    try {
      setDryError(null);
      await dryLactation(farmId, goatId, activeLactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada com sucesso.");
      setShowDryModal(false);
      setDryDate("");
      await loadData();
    } catch (error) {
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setDryError(message);
      toast.error(message);
    }
  }

  return (
    <section className="lactation-manager">
      {loading && !activeLactation && history.length === 0 ? (
        <LoadingState label="Buscando o status atual e o histórico de lactação." />
      ) : (
        <>
          <div className="lactation-manager__overview">
            <div className="lactation-manager__status-card">
              <span className="lactation-manager__eyebrow">Situação atual</span>
              <h3>{activeLactation ? "Lactação em andamento" : "Nenhuma lactação ativa"}</h3>
              <p>
                {activeLactation
                  ? "A lactação ativa já pode receber registros de produção e secagem."
                  : "Inicie uma nova lactação quando este animal entrar em produção."}
              </p>

              <dl className="lactation-manager__stats">
                <div>
                  <dt>Animal</dt>
                  <dd>{goatName}</dd>
                </div>
                <div>
                  <dt>Início</dt>
                  <dd>{formatDate(activeLactation?.startDate)}</dd>
                </div>
                <div>
                  <dt>Secagem</dt>
                  <dd>{formatDate(activeLactation?.endDate)}</dd>
                </div>
              </dl>
            </div>

            <div className="lactation-manager__action-card">
              <h4>Ações rápidas</h4>
              <p>Use os atalhos abaixo para continuar o acompanhamento sem sair desta página.</p>

              <div className="lactation-manager__action-list">
                {activeLactation ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/active`)
                      }
                    >
                      <i className="fa-solid fa-eye" aria-hidden="true"></i> Ver lactação ativa
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/app/goatfarms/${farmId}/goats/${goatId}/lactations/${activeLactation.id}/summary`
                        )
                      }
                    >
                      <i className="fa-solid fa-chart-line" aria-hidden="true"></i> Ver resumo
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => {
                        if (!canManage) return;
                        setShowDryModal(true);
                      }}
                      disabled={!canManage}
                      title={!canManage ? "Sem permissão para encerrar lactação." : undefined}
                    >
                      <i className="fa-solid fa-stop" aria-hidden="true"></i> Registrar secagem
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (!canManage) return;
                        setShowStartModal(true);
                      }}
                      disabled={!canManage}
                      title={!canManage ? "Sem permissão para iniciar lactação." : undefined}
                    >
                      <i className="fa-solid fa-play" aria-hidden="true"></i> Iniciar lactação
                    </Button>
                    <p className="lactation-manager__helper">
                      {canManage
                        ? "Ao iniciar, o histórico desta cabra será atualizado automaticamente."
                        : "Somente pessoas com permissão podem iniciar uma lactação."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lactation-manager__history">
            <div className="lactation-manager__section-head">
              <div>
                <h4>Histórico de lactação</h4>
                <p>Consulte os ciclos anteriores e abra os detalhes quando precisar.</p>
              </div>
            </div>

            {history.length === 0 ? (
              <EmptyState
                title="Nenhum registro de lactação"
                description="Este animal ainda não possui uma lactação registrada."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Início</th>
                    <th>Fim (secagem)</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((lactation) => (
                    <tr key={lactation.id}>
                      <td>{formatDate(lactation.startDate)}</td>
                      <td>{formatDate(lactation.endDate)}</td>
                      <td>
                        <span
                          className={
                            lactation.status === "ACTIVE"
                              ? "status-badge status-active"
                              : "status-badge status-closed"
                          }
                        >
                          {lactation.status === "ACTIVE" ? "Ativa" : "Encerrada"}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactation.id}`
                            )
                          }
                        >
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setStartError(null);
          setStartErrorStatus(null);
        }}
        title="Nova lactação"
        size="sm"
        footer={
          <div className="lactation-manager__modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowStartModal(false);
                setStartError(null);
                setStartErrorStatus(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleStartLactation} disabled={!canManage}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="lactation-manager__modal-copy">
          <p>
            Animal: <strong>{goatName}</strong>
          </p>
        </div>
        <div className="lactation-manager__field">
          <label htmlFor="lactation-start-date">Data de início</label>
          <input
            id="lactation-start-date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setStartError(null);
            }}
            disabled={!canManage}
          />
          {startError && <p className="lactation-manager__error">{startError}</p>}
          {startErrorStatus === 422 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction`)}
            >
              Ver reprodução
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showDryModal}
        onClose={() => {
          setShowDryModal(false);
          setDryError(null);
        }}
        title="Registrar secagem"
        size="sm"
        footer={
          <div className="lactation-manager__modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDryModal(false);
                setDryError(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="warning" onClick={handleDryLactation} disabled={!canManage}>
              Confirmar secagem
            </Button>
          </div>
        }
      >
        <div className="lactation-manager__modal-copy">
          <p>Esta ação encerra a lactação atual e não pode ser desfeita.</p>
        </div>
        <div className="lactation-manager__field">
          <label htmlFor="lactation-dry-date">Data de secagem</label>
          <input
            id="lactation-dry-date"
            type="date"
            value={dryDate}
            onChange={(event) => {
              setDryDate(event.target.value);
              setDryError(null);
            }}
            disabled={!canManage}
          />
          {dryError && <p className="lactation-manager__error">{dryError}</p>}
        </div>
      </Modal>
    </section>
  );
}
