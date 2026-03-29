import React from "react";
import { HealthAlertsDTO, WithdrawalAlertItemDTO } from "../../../Models/HealthAlertsDTO";
import { HealthEventResponseDTO } from "../../../Models/HealthDTOs";
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
          Nao foi possivel carregar o painel de alertas.
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

  const renderWithdrawalList = (
    title: string,
    items: WithdrawalAlertItemDTO[],
    emptyMsg: string,
    tone: "milk" | "meat"
  ) => (
    <div className="alert-list-column">
      <h4 className="alert-list-title">{title}</h4>
      <div className="alert-list-items">
        {items.length === 0 ? (
          <p className="alert-list-empty">{emptyMsg}</p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div
              key={`${tone}-${item.eventId}`}
              className={`alert-list-item alert-list-item--withdrawal alert-list-item--${tone}`}
              onClick={() => onNavigateToDetail(item.goatId, item.eventId)}
            >
              <div className="alert-item-header">
                <span className="alert-item-type">{tone === "milk" ? "Carencia leite" : "Carencia carne"}</span>
                <span className="alert-item-date">{formatLocalDatePtBR(item.withdrawalEndDate)}</span>
              </div>
              <div className="alert-item-body">
                <strong>{item.productName || item.title || "Tratamento sanitario"}</strong>
                <span className="alert-item-goat">Cabra: {item.goatId}</span>
                <span className="alert-item-goat">
                  {item.daysRemaining === 0
                    ? "Ultimo dia de carencia"
                    : `${item.daysRemaining} dia(s) restante(s)`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="farm-health-alerts-panel">
      <div className="alerts-summary-grid">
        <div className="alert-summary-card card-today" onClick={() => onFilterChange("today")}>
          <div className="summary-count">{alerts.dueTodayCount}</div>
          <div className="summary-label">Hoje</div>
        </div>
        <div className="alert-summary-card card-upcoming" onClick={() => onFilterChange("upcoming")}>
          <div className="summary-count">{alerts.upcomingCount}</div>
          <div className="summary-label">Proximos 7 dias</div>
        </div>
        <div className="alert-summary-card card-overdue" onClick={() => onFilterChange("overdue")}>
          <div className="summary-count">{alerts.overdueCount}</div>
          <div className="summary-label">Atrasados</div>
        </div>
        <div className="alert-summary-card card-withdrawal-milk alert-summary-card--static">
          <div className="summary-count">{alerts.activeMilkWithdrawalCount}</div>
          <div className="summary-label">Carencia de leite</div>
        </div>
        <div className="alert-summary-card card-withdrawal-meat alert-summary-card--static">
          <div className="summary-count">{alerts.activeMeatWithdrawalCount}</div>
          <div className="summary-label">Carencia de carne</div>
        </div>
      </div>

      <div className="alerts-lists-grid">
        {renderCompactList("Para Hoje", alerts.dueTodayTop, "Nenhum evento para hoje")}
        {renderCompactList("Proximos Dias", alerts.upcomingTop, "Nenhum evento proximo")}
        {renderCompactList("Atrasados", alerts.overdueTop, "Nenhum evento atrasado")}
        {renderWithdrawalList("Carencia de leite ativa", alerts.milkWithdrawalTop || [], "Nenhum animal com carencia de leite ativa", "milk")}
        {renderWithdrawalList("Carencia de carne ativa", alerts.meatWithdrawalTop || [], "Nenhum animal com carencia de carne ativa", "meat")}
      </div>
    </div>
  );
}