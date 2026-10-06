import { useEffect, useRef, useState } from "react";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import {
  getGoatOwnershipHistory,
  isValidStructuralGoatId,
} from "../../api/GoatOwnershipAPI/ownershipHistory";
import type {
  OwnershipEntryType,
  OwnershipExitType,
  OwnershipHistoryPeriodDTO,
} from "../../Models/GoatOwnershipHistoryDTOs";

type Props = {
  goatId?: number;
};

type LoadState = "idle" | "loading" | "success" | "error";

const entryLabels: Record<OwnershipEntryType, string> = {
  BIRTH: "Nascimento",
  MANUAL_IMPORT: "Importação manual",
  ABCC_IMPORT: "Importação ABCC",
  PURCHASE: "Compra",
  TRANSFER_IN: "Transferência recebida",
  RETURN: "Retorno",
  EXTERNAL_CLAIM: "Vínculo externo",
};

const exitLabels: Record<OwnershipExitType, string> = {
  TRANSFER_OUT: "Transferência",
  EXTERNAL_SALE: "Venda externa",
  DONATION: "Doação",
  DEATH: "Morte",
  RETIREMENT: "Retirada",
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "Em aberto";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
};

const responseStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
};

const periodTone = (period: OwnershipHistoryPeriodDTO): "success" | "warning" =>
  period.current ? "success" : "warning";

export default function GoatOwnershipHistoryPanel({ goatId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [periods, setPeriods] = useState<OwnershipHistoryPeriodDTO[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [stateGoatId, setStateGoatId] = useState<number | undefined>(undefined);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    requestGenerationRef.current += 1;
    setExpanded(false);
    setState("idle");
    setPeriods([]);
    setError(null);
    setStateGoatId(undefined);
  }, [goatId]);

  const loadHistory = async () => {
    const requestGeneration = ++requestGenerationRef.current;

    if (!isValidStructuralGoatId(goatId)) {
      setStateGoatId(goatId);
      setState("error");
      setError(new Error("Histórico de propriedade indisponível: identificador estrutural do animal não encontrado."));
      return;
    }

    setStateGoatId(goatId);
    setState("loading");
    setError(null);
    try {
      const response = await getGoatOwnershipHistory(goatId);
      if (requestGeneration !== requestGenerationRef.current) return;
      setPeriods(response.periods ?? []);
      setState("success");
    } catch (requestError) {
      if (requestGeneration !== requestGenerationRef.current) return;
      setError(requestError);
      setState("error");
    }
  };

  const handleToggle = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && state === "idle") void loadHistory();
  };

  const retry = () => void loadHistory();
  const stateBelongsToCurrentGoat = Object.is(stateGoatId, goatId);
  const renderState: LoadState = stateBelongsToCurrentGoat ? state : "idle";
  const renderPeriods = stateBelongsToCurrentGoat ? periods : [];
  const renderError = stateBelongsToCurrentGoat ? error : null;
  const status = responseStatus(renderError);
  const isForbidden = status === 403;
  const isUnavailableId =
    renderState === "error" &&
    renderError instanceof Error &&
    renderError.message.includes("identificador estrutural");

  return (
    <section className="animal-history-panel" aria-labelledby="goat-ownership-history-title">
      <div className="animal-history-panel__header">
        <h3 id="goat-ownership-history-title">Histórico de propriedade</h3>
        <button
          type="button"
          className="animal-history-panel__toggle"
          aria-expanded={expanded}
          onClick={handleToggle}
        >
          {expanded ? "Ocultar histórico" : "Ver histórico"}
        </button>
      </div>

      {expanded ? (
        <div>
          {renderState === "loading" ? (
            <div className="animal-history-panel__empty" role="status" aria-live="polite">
              Carregando histórico de propriedade...
            </div>
          ) : null}

          {renderState === "error" && isForbidden ? (
            <div className="animal-history-panel__empty" role="alert">
              Histórico de propriedade indisponível para este perfil.
            </div>
          ) : null}

          {renderState === "error" && !isForbidden && isUnavailableId ? (
            <div className="animal-history-panel__empty" role="alert">
              Histórico de propriedade indisponível: identificador estrutural do animal não encontrado.
            </div>
          ) : null}

          {renderState === "error" && !isForbidden && !isUnavailableId ? (
            <ErrorState
              title={status === 422 ? "Dados canônicos indisponíveis" : "Não foi possível carregar o histórico"}
              description={status === 404 ? "Animal não encontrado para consulta." : getApiErrorMessage(parseApiError(renderError))}
              retryLabel="Tentar novamente"
              onRetry={retry}
            />
          ) : null}

          {renderState === "success" && renderPeriods.length === 0 ? (
            <EmptyState
              title="Nenhum período de propriedade"
              description="Nenhum registro de propriedade foi retornado para este animal."
            />
          ) : null}

          {renderState === "success" && renderPeriods.length > 0 ? (
            <ol className="animal-history-timeline">
              {renderPeriods.map((period, index) => (
                <li
                  key={`${period.startedAt}-${period.farmId}-${index}`}
                  className={`animal-history-timeline__item animal-history-timeline__item--${periodTone(period)}`}
                >
                  <div className="animal-history-timeline__date">
                    {formatDateTime(period.startedAt)}
                    <br />
                    <span>até {formatDateTime(period.endedAt)}</span>
                  </div>
                  <div className="animal-history-timeline__content">
                    <strong>{entryLabels[period.entryType] ?? period.entryType}</strong>
                    <p>Fazenda #{period.farmId}</p>
                    {period.exitType ? <p>Saída: {exitLabels[period.exitType] ?? period.exitType}</p> : null}
                    {period.current ? <p><strong>Proprietário atual</strong></p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
