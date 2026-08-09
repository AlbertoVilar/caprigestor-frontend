import { useState } from 'react';
import { useFarmAlerts } from '../../contexts/alerts/FarmAlertsContext';
import AlertCenterDrawer from './AlertCenterDrawer';
import './AlertCenter.css';

interface Props {
  farmId: number;
  className?: string;
}

export default function AlertBell({ farmId, className }: Props) {
  const { totalCount, highestSeverity } = useFarmAlerts();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const severityClass = totalCount > 0 && highestSeverity
    ? `alert-center-bell--${highestSeverity}`
    : "";
  const buttonClassName = [className || "alert-center-bell", severityClass]
    .filter(Boolean)
    .join(" ");
  const severityLabel = highestSeverity === "high"
    ? "alta prioridade"
    : highestSeverity === "medium"
      ? "média prioridade"
      : "baixa prioridade";
  const accessibleLabel = totalCount > 0
    ? `Alertas da fazenda: ${totalCount} pendente(s), ${severityLabel}`
    : "Alertas da fazenda: nenhum alerta pendente";

  return (
    <>
      <button 
        type="button"
        className={buttonClassName}
        onClick={() => setIsDrawerOpen(true)}
        title={accessibleLabel}
        aria-label={accessibleLabel}
        data-severity={totalCount > 0 ? highestSeverity : undefined}
      >
        <i className="fa-solid fa-bell"></i>
        {totalCount > 0 && (
          <span className="alert-badge">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      <AlertCenterDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        farmId={farmId}
      />
    </>
  );
}
