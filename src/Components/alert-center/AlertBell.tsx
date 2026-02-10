import { useState } from 'react';
import { useFarmAlerts } from '../../contexts/alerts/FarmAlertsContext';
import AlertCenterDrawer from './AlertCenterDrawer';
import './AlertCenter.css';

interface Props {
  farmId: number;
  className?: string;
}

export default function AlertBell({ farmId, className }: Props) {
  const { totalCount } = useFarmAlerts();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <button 
        className={className || "alert-center-bell"} 
        onClick={() => setIsDrawerOpen(true)}
        title="Alertas da Fazenda"
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
