import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listOwnershipTransfers } from "../../api/OwnershipTransferAPI/ownershipTransfer";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type {
  OwnershipTransferDirection,
  OwnershipTransferResponseDTO,
  OwnershipTransferStatus,
} from "../../Models/OwnershipTransferDTOs";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import "./OwnershipTransferPage.css";

const STATUS_OPTIONS: Array<{ value: OwnershipTransferStatus; label: string }> = [
  { value: "REQUESTED", label: "Solicitada" },
  { value: "ACCEPTED", label: "Aceita" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "REJECTED", label: "Rejeitada" },
  { value: "CANCELLED", label: "Cancelada" },
];

const PAGE_SIZE = 10;

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
};

const statusLabel = (status: OwnershipTransferStatus): string =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

function TransferList({ items }: { items: OwnershipTransferResponseDTO[] }) {
  return (
    <div className="ownership-transfer-table-wrapper">
      <table className="ownership-transfer-table">
        <caption className="visually-hidden">Transferências de propriedade</caption>
        <thead>
          <tr>
            <th scope="col">Cabra</th>
            <th scope="col">Origem</th>
            <th scope="col">Destino</th>
            <th scope="col">Status</th>
            <th scope="col">Motivo</th>
            <th scope="col">Solicitada em</th>
          </tr>
        </thead>
        <tbody>
          {items.map((transfer) => (
            <tr key={transfer.id}>
              <td data-label="Cabra">#{transfer.goatId}</td>
              <td data-label="Origem">Fazenda #{transfer.sourceFarmId}</td>
              <td data-label="Destino">Fazenda #{transfer.targetFarmId}</td>
              <td data-label="Status">
                <span className={`ownership-transfer-status ownership-transfer-status--${transfer.status.toLowerCase()}`}>
                  {statusLabel(transfer.status)}
                </span>
              </td>
              <td data-label="Motivo">{transfer.reason}</td>
              <td data-label="Solicitada em">{formatDateTime(transfer.requestedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OwnershipTransferPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canAdministerFarm, loading: permissionsLoading } = useFarmPermissions(
    Number.isSafeInteger(farmIdNumber) && farmIdNumber > 0 ? farmIdNumber : undefined
  );
  const [direction, setDirection] = useState<OwnershipTransferDirection>("INCOMING");
  const [status, setStatus] = useState<OwnershipTransferStatus | "">("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listOwnershipTransfers>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    if (!Number.isSafeInteger(farmIdNumber) || farmIdNumber <= 0 || permissionsLoading || !canAdministerFarm) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await listOwnershipTransfers(
        farmIdNumber,
        direction,
        status || undefined,
        page,
        PAGE_SIZE,
      );
      setResult(next);
    } catch (cause) {
      setResult(null);
      setError(getApiErrorMessage(parseApiError(cause)));
    } finally {
      setLoading(false);
    }
  }, [canAdministerFarm, direction, farmIdNumber, page, permissionsLoading, status]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (!canAdministerFarm) {
      navigate("/403", { replace: true });
      return;
    }
    void loadTransfers();
  }, [canAdministerFarm, loadTransfers, navigate, permissionsLoading]);

  const updateDirection = (next: OwnershipTransferDirection) => {
    setDirection(next);
    setPage(0);
  };

  const updateStatus = (next: string) => {
    setStatus(next as OwnershipTransferStatus | "");
    setPage(0);
  };

  const totalPages = result?.totalPages ?? 0;
  const hasPrevious = page > 0;
  const hasNext = totalPages > 0 && page + 1 < totalPages;

  return (
    <div className="page-container ownership-transfer-page">
      <GoatFarmHeader name="Transferências de propriedade" />
      <PageHeader
        title="Transferências entre fazendas"
        description="Consulta administrativa de entradas e saídas de propriedade."
        showBackButton
        backButtonUrl={buildFarmDashboardPath(farmIdNumber)}
      />

      {permissionsLoading ? (
        <LoadingState label="Verificando permissões..." />
      ) : !canAdministerFarm ? null : (
        <>
          <section className="card-container ownership-transfer-filters" aria-label="Filtros de transferências">
            <div className="ownership-transfer-filter-group" role="group" aria-label="Direção">
              <span className="ownership-transfer-filter-label">Direção</span>
              <div className="ownership-transfer-chip-row">
                {(["INCOMING", "OUTGOING"] as OwnershipTransferDirection[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`ownership-transfer-chip ${direction === option ? "is-active" : ""}`}
                    aria-pressed={direction === option}
                    onClick={() => updateDirection(option)}
                  >
                    {option === "INCOMING" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </div>
            <div className="ownership-transfer-filter-group">
              <label className="ownership-transfer-filter-label" htmlFor="ownership-transfer-status">Status</label>
              <select
                id="ownership-transfer-status"
                className="form-select"
                value={status}
                onChange={(event) => updateStatus(event.target.value)}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="card-container ownership-transfer-list" aria-label="Lista de transferências">
            {loading ? (
              <LoadingState label="Carregando transferências..." />
            ) : error ? (
              <ErrorState
                title="Não foi possível carregar as transferências"
                description={error}
                onRetry={() => void loadTransfers()}
              />
            ) : !result || result.content.length === 0 ? (
              <EmptyState
                title="Nenhuma transferência encontrada"
                description="Não há transferências para os filtros selecionados."
              />
            ) : (
              <>
                <TransferList items={result.content} />
                <div className="ownership-transfer-pagination" aria-label="Paginação">
                  <span>Página {page + 1} de {Math.max(totalPages, 1)}</span>
                  <div className="ownership-transfer-pagination__actions">
                    <button type="button" className="btn btn-outline-secondary" disabled={!hasPrevious} onClick={() => setPage((current) => current - 1)}>
                      Anterior
                    </button>
                    <button type="button" className="btn btn-outline-primary" disabled={!hasNext} onClick={() => setPage((current) => current + 1)}>
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
