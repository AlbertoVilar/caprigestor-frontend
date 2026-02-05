// src/components/goat-farm-header/GoatFarmHeader.tsx

import "../../index.css"
import "./GoatFarmHeader.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";

interface Props {
  name: string;
  logoUrl?: string;
  farmId?: number;
}

interface AlertsCache {
  timestamp: number;
  data: HealthAlertsDTO;
}

export default function GoatFarmHeader({ name, logoUrl, farmId }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState<HealthAlertsDTO | null>(null);
  const cacheRef = useRef<Record<number, AlertsCache>>({});

  // Calculate derived values
  const overdueCount = alerts?.overdueCount || 0;
  const todayCount = alerts?.dueTodayCount || 0;
  const upcomingCount = alerts?.upcomingCount || 0;
  
  const urgentCount = overdueCount + todayCount;
  const hasUrgent = urgentCount > 0;
  const hasUpcoming = upcomingCount > 0;

  useEffect(() => {
    if (farmId) {
      const now = Date.now();
      const cached = cacheRef.current[farmId];
      
      // Cache valid for 60 seconds
      if (cached && (now - cached.timestamp < 60000)) {
        setAlerts(cached.data);
        return;
      }

      healthAPI.getAlerts(farmId)
        .then(data => {
          cacheRef.current[farmId] = {
            timestamp: Date.now(),
            data: data
          };
          setAlerts(data);
        })
        .catch(err => {
          console.error("Failed to load alerts count in header", err);
          // On error, we keep existing alerts or null, avoiding UI break
        });
    }
  }, [farmId]);

  const isAgendaPage = location.pathname.includes("health-agenda");

  // Badge content logic
  let badgeContent = null;
  if (hasUrgent) {
    badgeContent = urgentCount > 9 ? '9+' : urgentCount;
  }
  // We optionally hide badge for upcoming-only to avoid noise, as per requirements

  // Button class logic
  let btnClass = "farm-header-alert-btn";
  if (isAgendaPage) btnClass += " active";
  if (hasUrgent) btnClass += " farm-header-alert-btn--urgent";
  else if (hasUpcoming) btnClass += " farm-header-alert-btn--upcoming";

  // Tooltip construction
  let tooltip = isAgendaPage ? "Você já está na Agenda Sanitária" : "Ver Agenda Sanitária e Alertas";
  if (alerts) {
    tooltip = `Atrasados: ${overdueCount} • Hoje: ${todayCount} • Próximos: ${upcomingCount}`;
    if (!isAgendaPage) tooltip += "\nClique para ver a agenda sanitária";
  }

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

      {farmId && (
        <button 
          className={btnClass}
          onClick={() => !isAgendaPage && navigate(`/app/goatfarms/${farmId}/health-agenda`)}
          title={tooltip}
          style={{ cursor: isAgendaPage ? 'default' : 'pointer', opacity: isAgendaPage ? 1 : 0.9 }}
          aria-label="Abrir agenda sanitária da fazenda"
        >
          <i className="fa-solid fa-bell"></i>
          {badgeContent && (
            <span className="alert-badge">
              {badgeContent}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
