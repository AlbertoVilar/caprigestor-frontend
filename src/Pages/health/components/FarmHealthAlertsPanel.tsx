import React from "react";
import { HealthAlertsDTO } from "../../../Models/HealthAlertsDTO";
import { HealthEventResponseDTO, HealthEventStatus } from "../../../Models/HealthDTOs";
import { formatLocalDatePtBR } from "../../../utils/localDate";
import { HEALTH_EVENT_TYPE_LABELS } from "../healthLabels";
import { HealthStatusBadge } from "./HealthStatusBadge";
import "./FarmHealthAlertsPanel.css";

interface FarmHealthAlertsPanelProps {
  alerts: HealthAlertsDTO | null;
  loading: boolean;
  onFilterChange: (filterType: "today" | "upcoming" | "overdue") => void;
  onNavigateToDetail: (goatId: string, eventId: number) => void;
}

export default function FarmHealthAlertsPanel({
  alerts,
  loading,
  onFilterChange,
  onNavigateToDetail
}: FarmHealthAlertsPanelProps) {
  if (loading) {
    return <div className="farm-health-alerts-skeleton">Carregando alertas...</div>;
  }

  if (!alerts) {
    return (
        <div className="farm-health-alerts-panel">
            <div className="alert alert-warning w-100 text-center">
                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                Não foi possível carregar o painel de alertas.
            </div>
        </div>
    );
  }

  const renderCompactList = (title: string, events: HealthEventResponseDTO[], emptyMsg: string) => (
    <div className="alert-list-column">
      <h4 className="alert-list-title">{title}</h4>
      <div className="alert-list-items">
        {events && events.length === 0 ? (
          <p className="alert-list-empty">{emptyMsg}</p>
        ) : (
          events && events.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className={`alert-list-item ${event.overdue ? "alert-item-overdue" : ""}`}
              onClick={() => onNavigateToDetail(event.goatId, event.id)}
            >
              <div className="alert-item-header">
                <span className="alert-item-type">{HEALTH_EVENT_TYPE_LABELS[event.type] || event.type}</span>
                <span className="alert-item-date">{formatLocalDatePtBR(event.scheduledDate)}</span>
              </div>
              <div className="alert-item-body">
                <strong>{event.title}</strong>
                <span className="alert-item-goat">Cabra: {event.goatId}</span>
              </div>
              <div className="alert-item-footer">
                 <HealthStatusBadge status={event.status} overdue={event.overdue} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="farm-health-alerts-panel">
      {/* Summary Cards */}
      <div className="alerts-summary-grid">
        <div className="alert-summary-card card-today" onClick={() => onFilterChange("today")}>
          <div className="summary-count">{alerts.dueTodayCount}</div>
          <div className="summary-label">Hoje</div>
        </div>
        <div className="alert-summary-card card-upcoming" onClick={() => onFilterChange("upcoming")}>
          <div className="summary-count">{alerts.upcomingCount}</div>
          <div className="summary-label">Próximos 7 dias</div>
        </div>
        <div className="alert-summary-card card-overdue" onClick={() => onFilterChange("overdue")}>
          <div className="summary-count">{alerts.overdueCount}</div>
          <div className="summary-label">Atrasados</div>
        </div>
      </div>

      {/* Top 5 Lists */}
      <div className="alerts-lists-grid">
        {renderCompactList("Para Hoje", alerts.dueTodayTop, "Nenhum evento para hoje")}
        {renderCompactList("Próximos Dias", alerts.upcomingTop, "Nenhum evento próximo")}
        {renderCompactList("Atrasados", alerts.overdueTop, "Nenhum evento atrasado")}
      </div>
    </div>
  );
}
