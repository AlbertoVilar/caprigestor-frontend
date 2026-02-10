// src/components/goat-farm-header/GoatFarmHeader.tsx

import "../../index.css"
import "./GoatFarmHeader.css";
import { FarmAlertsProvider } from "../../contexts/alerts/FarmAlertsContext";
import AlertBell from "../../Components/alert-center/AlertBell";

interface Props {
  name: string;
  logoUrl?: string;
  farmId?: number;
  useExternalAlertsProvider?: boolean;
}

export default function GoatFarmHeader({
  name,
  logoUrl,
  farmId,
  useExternalAlertsProvider = true
}: Props) {
  const alertBell = farmId ? (
    <AlertBell farmId={farmId} className="farm-header-alert-btn" />
  ) : null;

  return (
    <div className="goatfarm-header">
      {logoUrl ? (
        <img src={logoUrl} alt={`Logo ${name}`} className="farm-header-logo" />
      ) : (
        <span className="farm-header-icon">🐐</span>
      )}
      <div className="farm-header-content">
        <h2>{name}</h2>
      </div>

      {farmId &&
        (useExternalAlertsProvider ? (
          <FarmAlertsProvider farmId={farmId}>{alertBell}</FarmAlertsProvider>
        ) : (
          alertBell
        ))}
    </div>
  );
}
