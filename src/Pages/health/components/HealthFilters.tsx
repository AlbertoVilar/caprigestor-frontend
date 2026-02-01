import { HealthEventStatus, HealthEventType } from "../../../Models/HealthDTOs";
import { HEALTH_EVENT_STATUS_LABELS, HEALTH_EVENT_TYPE_LABELS } from "../healthLabels";

export type HealthFiltersValues = {
  type: HealthEventType | "";
  status: HealthEventStatus | "";
  from: string;
  to: string;
};

interface HealthFiltersProps {
  values: HealthFiltersValues;
  onChange: (field: keyof HealthFiltersValues, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  isBusy?: boolean;
}

const TYPE_LABELS = HEALTH_EVENT_TYPE_LABELS;
const STATUS_LABELS = HEALTH_EVENT_STATUS_LABELS;

const TODAY = new Date().toISOString().split("T")[0];

export default function HealthFilters({
  values,
  onChange,
  onApply,
  onClear,
  isBusy = false
}: HealthFiltersProps) {
  return (
    <div className="health-filters-grid">
      <label className="health-filter-field">
        <span>Tipo</span>
        <select
          value={values.type}
          onChange={(event) => onChange("type", event.target.value)}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="health-filter-field">
        <span>Status</span>
        <select
          value={values.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="health-filter-field">
        <span>Data inicial</span>
        <input
          type="date"
          value={values.from}
          onChange={(event) => onChange("from", event.target.value)}
          max={TODAY}
          placeholder="dd/mm/aaaa"
        />
      </label>

      <label className="health-filter-field">
        <span>Data final</span>
        <input
          type="date"
          value={values.to}
          onChange={(event) => onChange("to", event.target.value)}
          max={TODAY}
          placeholder="dd/mm/aaaa"
        />
      </label>

      <div className="health-filter-actions">
        <button
          type="button"
          className="health-btn health-btn-outline-secondary"
          onClick={onClear}
          disabled={isBusy}
        >
          Limpar filtros
        </button>
        <button
          type="button"
          className="health-btn health-btn-primary"
          onClick={onApply}
          disabled={isBusy}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
