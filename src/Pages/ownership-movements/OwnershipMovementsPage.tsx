import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type {
  OwnershipMovementDTO,
  OwnershipMovementDirection,
  OwnershipMovementKind,
  OwnershipMovementStatus,
} from "../../Models/OwnershipMovementDTOs";
import { listOwnershipMovements } from "../../api/OwnershipMovementAPI/ownershipMovements";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import "./OwnershipMovementsPage.css";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: OwnershipMovementStatus; label: string }> = [
  { value: "REQUESTED", label: "Solicitado" },
  { value: "ACCEPTED", label: "Aceito" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "CANCELLED", label: "Cancelado" },
];

const KIND_LABELS: Record<OwnershipMovementKind, string> = {
  INTERNAL_TRANSFER: "Transferência entre fazendas",
  INTERNAL_SALE: "Venda entre fazendas",
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
};

const formatAmount = (value: number | null): string => {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

function MovementRow({ movement }: { movement: OwnershipMovementDTO }) {
  const isSale = movement.movementKind === "INTERNAL_SALE";
  const reason = movement.reason?.trim();
  const goatName = movement.goatName?.trim();
  const registrationNumber = movement.goatRegistrationNumber?.trim();
  const sourceFarmName = movement.sourceFarmName?.trim();
  const targetFarmName = movement.targetFarmName?.trim();
  const goatLabel = goatName
    ? `${goatName}${registrationNumber ? ` · RG ${registrationNumber}` : ""}`
    : registrationNumber || `Animal #${movement.goatId}`;

  return (
    <tr>
      <td data-label="Movimento">#{movement.movementId}</td>
      <td data-label="Animal">{goatLabel}</td>
      <td data-label="Origem">{sourceFarmName || `Fazenda #${movement.sourceFarmId ?? "—"}`}</td>
      <td data-label="Destino">{targetFarmName || `Fazenda #${movement.targetFarmId}`}</td>
      <td data-label="Tipo">{KIND_LABELS[movement.movementKind]}</td>
      <td data-label="Processo">
        {STATUS_OPTIONS.find((option) => option.value === movement.status)?.label ?? movement.status}
      </td>
      <td data-label="Movimento de propriedade">{movement.realized ? "Realizado" : "Pendente"}</td>
      <td data-label="Pagamento">
        {isSale && movement.paymentStatus ? `Pagamento: ${movement.paymentStatus}` : "—"}
      </td>
      <td data-label="Valor">{isSale ? formatAmount(movement.amount) : "—"}</td>
      <td data-label="Venda / pagamento">
        {isSale ? (
          <span className="ownership-movements-dates">
            <span>Venda #{movement.saleId ?? "—"} · {formatDate(movement.saleDate)}</span>
            <span>Pagamento · {formatDate(movement.paymentDate)}</span>
          </span>
        ) : "—"}
      </td>
      <td data-label="Solicitada em">{formatDateTime(movement.requestedAt)}</td>
      <td data-label="Motivo">{reason || "—"}</td>
    </tr>
  );
}

export default function OwnershipMovementsPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const validFarmId = Number.isSafeInteger(farmIdNumber) && farmIdNumber > 0;
  const { canAdministerFarm, loading: permissionsLoading } = useFarmPermissions(
    validFarmId ? farmIdNumber : undefined,
  );

  const [direction, setDirection] = useState<OwnershipMovementDirection>("INCOMING");
  const [status, setStatus] = useState<OwnershipMovementStatus | "">("");
  const [kind, setKind] = useState<OwnershipMovementKind | "">("");
  const [page, setPage] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listOwnershipMovements>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!validFarmId || !canAdministerFarm) {
      navigate("/403", { replace: true });
    }
  }, [canAdministerFarm, navigate, permissionsLoading, validFarmId]);

  useEffect(() => {
    if (!validFarmId || permissionsLoading || !canAdministerFarm) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    void listOwnershipMovements(
      farmIdNumber,
      direction,
      status || undefined,
      kind || undefined,
      page,
      PAGE_SIZE,
    )
      .then((next) => {
        if (!cancelled) setResult(next);
      })
      .catch((cause) => {
        if (!cancelled) {
          setResult(null);
          setError(getApiErrorMessage(parseApiError(cause)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canAdministerFarm, direction, farmIdNumber, kind, page, permissionsLoading, refreshVersion, status, validFarmId]);

  const retry = useCallback(() => setRefreshVersion((version) => version + 1), []);
  const updateDirection = (next: OwnershipMovementDirection) => {
    setDirection(next);
    setPage(0);
  };
  const updateStatus = (next: string) => {
    setStatus(next as OwnershipMovementStatus | "");
    setPage(0);
  };
  const updateKind = (next: string) => {
    setKind(next as OwnershipMovementKind | "");
    setPage(0);
  };

  const displayedPage = result?.number ?? page;
  const totalPages = result?.totalPages ?? 0;
  const hasPrevious = result !== null && result.number > 0;
  const hasNext = result !== null && result.number + 1 < result.totalPages;

  return (
    <div className="page-container ownership-movements-page">
      <GoatFarmHeader name="Movimentos de propriedade" />
      <PageHeader
        title="Movimentos de propriedade"
        description="Histórico consolidado, somente para consulta, de entradas e saídas de propriedade da fazenda."
        showBackButton
        backButtonUrl={buildFarmDashboardPath(farmIdNumber)}
      />

      {permissionsLoading ? (
        <LoadingState label="Verificando permissões..." />
      ) : !canAdministerFarm ? null : (
        <>
          <section className="card-container ownership-movements-filters" aria-label="Filtros de movimentos">
            <div className="ownership-movements-filter-group" role="group" aria-label="Direção">
              <span className="ownership-movements-filter-label">Direção</span>
              <div className="ownership-movements-direction-row">
                {(["INCOMING", "OUTGOING"] as OwnershipMovementDirection[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`ownership-movements-direction ${direction === option ? "is-active" : ""}`}
                    aria-pressed={direction === option}
                    onClick={() => updateDirection(option)}
                  >
                    {option === "INCOMING" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </div>
            <div className="ownership-movements-filter-group">
              <label className="ownership-movements-filter-label" htmlFor="ownership-movement-kind">Tipo</label>
              <select id="ownership-movement-kind" value={kind} onChange={(event) => updateKind(event.target.value)}>
                <option value="">Todos</option>
                <option value="INTERNAL_TRANSFER">Transferência entre fazendas</option>
                <option value="INTERNAL_SALE">Venda entre fazendas</option>
              </select>
            </div>
            <div className="ownership-movements-filter-group">
              <label className="ownership-movements-filter-label" htmlFor="ownership-movement-status">Status</label>
              <select id="ownership-movement-status" value={status} onChange={(event) => updateStatus(event.target.value)}>
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="card-container ownership-movements-list" aria-label="Histórico de movimentos">
            {loading ? (
              <LoadingState label="Carregando movimentos de propriedade..." />
            ) : error ? (
              <ErrorState
                title="Não foi possível carregar os movimentos de propriedade"
                description={error}
                onRetry={retry}
              />
            ) : !result || result.content.length === 0 ? (
              <EmptyState
                title="Nenhum movimento encontrado"
                description="Não há movimentos para a direção, tipo e status selecionados."
              />
            ) : (
              <>
                <div className="ownership-movements-table-wrapper">
                  <table className="ownership-movements-table">
                    <caption className="visually-hidden">Histórico consolidado de movimentos de propriedade</caption>
                    <thead>
                      <tr>
                        <th scope="col">Movimento</th>
                        <th scope="col">Animal</th>
                        <th scope="col">Origem</th>
                        <th scope="col">Destino</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Processo</th>
                        <th scope="col">Movimento</th>
                        <th scope="col">Pagamento</th>
                        <th scope="col">Valor</th>
                        <th scope="col">Venda / pagamento</th>
                        <th scope="col">Solicitada em</th>
                        <th scope="col">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.content.map((movement) => (
                        <MovementRow key={movement.movementId} movement={movement} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ownership-movements-pagination" aria-label="Paginação">
                  <span>Página {displayedPage + 1} de {Math.max(totalPages, 1)} · {result.totalElements} movimento(s)</span>
                  <div className="ownership-movements-pagination-actions">
                    <button type="button" disabled={!hasPrevious} onClick={() => setPage(result.number - 1)}>
                      Anterior
                    </button>
                    <button type="button" disabled={!hasNext} onClick={() => setPage(result.number + 1)}>
                      Próxima
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
