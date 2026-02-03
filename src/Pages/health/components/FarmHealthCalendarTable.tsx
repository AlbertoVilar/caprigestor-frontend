import React from "react";
import { HealthEventResponseDTO, HealthEventStatus } from "../../../Models/HealthDTOs";
import { formatLocalDatePtBR } from "../../../utils/localDate";
import { HEALTH_EVENT_TYPE_LABELS } from "../healthLabels";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { useNavigate } from "react-router-dom";

interface FarmHealthCalendarTableProps {
  events: HealthEventResponseDTO[];
  loading: boolean;
  errorMessage: string;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  currentPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (goatId: string, eventId: number) => void;
  onMarkDone: (event: HealthEventResponseDTO) => void;
  onCancel: (event: HealthEventResponseDTO) => void;
  onRetry: () => void;
  areCanceledHidden?: boolean;
  onShowCanceled?: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ACTION_TOOLTIP = "Apenas eventos AGENDADOS podem ser alterados.";

export default function FarmHealthCalendarTable({
  events,
  loading,
  errorMessage,
  totalElements,
  totalPages,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onMarkDone,
  onCancel,
  onRetry,
  areCanceledHidden,
  onShowCanceled
}: FarmHealthCalendarTableProps) {
  const displayStart = events.length > 0 ? currentPage * currentPageSize + 1 : 0;
  const displayEnd = events.length > 0 ? Math.min(displayStart + events.length - 1, totalElements || 0) : 0;
  const hasPaginationInfo = !loading && !errorMessage;
  const isPrevDisabled = currentPage <= 0;
  const isNextDisabled = totalPages > 0 ? currentPage + 1 >= totalPages : true;

  if (loading) {
    return (
      <div className="health-table-skeleton" role="status" aria-live="polite">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="health-table-skeleton-row" key={index}>
            <span className="health-table-skeleton-cell short" />
            <span className="health-table-skeleton-cell short" />
            <span className="health-table-skeleton-cell medium" />
            <span className="health-table-skeleton-cell long" />
            <span className="health-table-skeleton-cell short" />
            <span className="health-table-skeleton-cell actions" />
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="health-error-state">
        <p>{errorMessage}</p>
        <button type="button" className="health-btn health-btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="health-empty-state">
        {areCanceledHidden && onShowCanceled ? (
          <>
            <p>Nenhum evento nesta página (cancelados ocultos).</p>
            <button
              type="button"
              className="health-btn health-btn-outline-secondary"
              onClick={onShowCanceled}
            >
              Mostrar cancelados
            </button>
          </>
        ) : (
          <p>Nenhum evento encontrado para os filtros selecionados.</p>
        )}
      </div>
    );
  }

  return (
    <div className="health-table-wrapper">
      <table className="health-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Cabra</th>
            <th>Tipo</th>
            <th>Título/Descrição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isScheduled = event.status === HealthEventStatus.AGENDADO;
            const isOverdue = isScheduled && event.overdue;
            return (
              <tr
                key={event.id}
                className={`health-table-row ${isOverdue ? "health-table-row--overdue" : ""}`}
              >
                <td>{formatLocalDatePtBR(event.scheduledDate)}</td>
                <td>
                    <span className="fw-bold">{event.goatId}</span>
                </td>
                <td>
                  <span className="health-type-pill">{HEALTH_EVENT_TYPE_LABELS[event.type] || event.type}</span>
                </td>
                <td>
                  <div className="health-row__title">{event.title}</div>
                  {event.description && (
                    <p className="health-row__description">{event.description}</p>
                  )}
                </td>
                <td>
                  <HealthStatusBadge status={event.status} overdue={event.overdue} />
                </td>
                <td>
                  <div className="health-action-group">
                    <button
                      type="button"
                      className="health-action-btn"
                      title="Ver detalhes"
                      onClick={() => onViewDetail(event.goatId, event.id)}
                    >
                      <i className="fa-solid fa-eye" />
                    </button>
                    
                    <button
                      type="button"
                      className={`health-action-btn health-action-btn--success ${isScheduled ? "" : "health-action-btn--disabled"}`}
                      title={isScheduled ? "Marcar como realizado" : ACTION_TOOLTIP}
                      disabled={!isScheduled}
                      onClick={() => isScheduled && onMarkDone(event)}
                    >
                      <i className="fa-solid fa-check" />
                    </button>

                    <button
                      type="button"
                      className={`health-action-btn health-action-btn--danger ${isScheduled ? "" : "health-action-btn--disabled"}`}
                      title={isScheduled ? "Cancelar evento" : ACTION_TOOLTIP}
                      disabled={!isScheduled}
                      onClick={() => isScheduled && onCancel(event)}
                    >
                      <i className="fa-solid fa-ban" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hasPaginationInfo && (
        <div className="health-table-footer">
          <div className="health-pagination-info">
            Exibindo {displayStart}–{displayEnd} de {totalElements}
          </div>
          <div className="health-pagination-controls">
            <div className="health-page-size">
              <label htmlFor="health-page-size-farm">Itens por página</label>
              <select
                id="health-page-size-farm"
                value={currentPageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="health-pagination-buttons">
              <button
                type="button"
                className="health-pagination-btn"
                disabled={isPrevDisabled}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Anterior
              </button>
              <span>
                Página {Math.max(currentPage + 1, 1)} de {Math.max(totalPages, 1)}
              </span>
              <button
                type="button"
                className="health-pagination-btn"
                disabled={isNextDisabled}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
