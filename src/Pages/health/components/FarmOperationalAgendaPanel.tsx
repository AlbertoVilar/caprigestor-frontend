import {
  FarmOperationalAgendaFilter,
  FarmOperationalAgendaItem,
  FarmOperationalAgendaSummary,
  formatOperationalAgendaDate
} from "../farmOperationalAgenda";

interface FarmOperationalAgendaPanelProps {
  loading: boolean;
  warningMessage?: string;
  summary: FarmOperationalAgendaSummary;
  activeFilter: FarmOperationalAgendaFilter;
  items: FarmOperationalAgendaItem[];
  onFilterChange: (filter: FarmOperationalAgendaFilter) => void;
  onOpenItem: (item: FarmOperationalAgendaItem) => void;
  onOpenAlerts: () => void;
}

const FILTERS: Array<{ value: FarmOperationalAgendaFilter; label: string }> = [
  { value: "all", label: "Tudo" },
  { value: "health", label: "Sanidade" },
  { value: "reproduction", label: "Reprodução" },
  { value: "lactation", label: "Lactação" }
];

export default function FarmOperationalAgendaPanel({
  loading,
  warningMessage,
  summary,
  activeFilter,
  items,
  onFilterChange,
  onOpenItem,
  onOpenAlerts
}: FarmOperationalAgendaPanelProps) {
  return (
    <section className="operational-agenda-panel">
      <div className="operational-agenda-panel__header">
        <div>
          <p className="operational-agenda-panel__eyebrow">Gestão da rotina</p>
          <h2>O que precisa da sua atenção</h2>
          <p className="operational-agenda-panel__copy">
            Resumo operacional da fazenda com sinais de sanidade, reprodução e lactação.
          </p>
        </div>
        <button className="health-btn health-btn-outline-secondary" type="button" onClick={onOpenAlerts}>
          Ver alertas consolidados
        </button>
      </div>

      <div className="operational-agenda-panel__metrics">
        <article className="operational-agenda-metric operational-agenda-metric--accent">
          <span>Total em atenção</span>
          <strong>{summary.totalAttention}</strong>
        </article>
        <article className="operational-agenda-metric">
          <span>Sanidade</span>
          <strong>{summary.counts.health}</strong>
        </article>
        <article className="operational-agenda-metric">
          <span>Reprodução</span>
          <strong>{summary.counts.reproduction}</strong>
        </article>
        <article className="operational-agenda-metric">
          <span>Lactação</span>
          <strong>{summary.counts.lactation}</strong>
        </article>
      </div>

      {warningMessage ? (
        <div className="operational-agenda-panel__warning" role="status">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span>{warningMessage}</span>
        </div>
      ) : null}

      <div className="operational-agenda-panel__toolbar">
        <div className="operational-agenda-panel__chips" role="tablist" aria-label="Filtrar origem da agenda operacional">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`operational-agenda-chip${activeFilter === filter.value ? " operational-agenda-chip--active" : ""}`}
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="operational-agenda-panel__hint">
          A tabela detalhada logo abaixo continua mostrando apenas o calendário sanitário.
        </p>
      </div>

      {loading ? (
        <div className="operational-agenda-list operational-agenda-list--loading" aria-label="Carregando agenda operacional">
          <div className="operational-agenda-skeleton"></div>
          <div className="operational-agenda-skeleton"></div>
          <div className="operational-agenda-skeleton"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="operational-agenda-list">
          {items.map((item) => (
            <article key={item.id} className="operational-agenda-item">
              <div className="operational-agenda-item__meta">
                <span className={`operational-agenda-item__badge operational-agenda-item__badge--${item.source}`}>
                  {item.sourceLabel}
                </span>
                <span className="operational-agenda-item__date">{formatOperationalAgendaDate(item.date)}</span>
              </div>
              <div className="operational-agenda-item__body">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="operational-agenda-item__aux">
                  <span>Cabra {item.goatId}</span>
                  {item.overdue ? (
                    <span className="operational-agenda-item__risk">
                      {typeof item.overdueDays === "number" && item.overdueDays > 0
                        ? `${item.overdueDays} dia(s) de atraso`
                        : "Em atraso"}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="operational-agenda-item__actions">
                <button className="health-btn health-btn-outline-secondary" type="button" onClick={() => onOpenItem(item)}>
                  Abrir
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="operational-agenda-panel__empty">
          Nenhuma ação operacional pendente foi encontrada para o filtro selecionado.
        </div>
      )}
    </section>
  );
}
