import { HealthEventStatus } from "../../../Models/HealthDTOs";
import { HEALTH_EVENT_STATUS_LABELS } from "../healthLabels";

interface HealthStatusBadgeProps {
  status: HealthEventStatus;
  overdue?: boolean;
}

export function HealthStatusBadge({ status, overdue }: HealthStatusBadgeProps) {
  const safeStatus = HEALTH_EVENT_STATUS_LABELS[status] || status;
  const showOverdue = overdue && status === HealthEventStatus.AGENDADO;

  return (
    <div className="health-status-badge-group">
      <span
        className={`health-status-badge health-status-badge--${status.toLowerCase()}`}
        aria-label={`Status do evento: ${safeStatus}`}
      >
        {safeStatus}
      </span>
      {showOverdue && (
        <span className="health-overdue-badge" aria-label="Evento atrasado">
          ATRASADO
        </span>
      )}
    </div>
  );
}
