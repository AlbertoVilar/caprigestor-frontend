import type { AlertItem, AlertSeverity, AlertSource } from "./AlertRegistry";

export type SourceFilter = "all" | AlertSource;
export type SeverityFilter = "all" | AlertSeverity;
export type SortMode = "priority" | "date";

function toDateValue(value?: string): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export function filterAndSortAlerts(
  items: AlertItem[],
  sourceFilter: SourceFilter,
  severityFilter: SeverityFilter,
  sortMode: SortMode
): AlertItem[] {
  const filtered = items.filter((item) => {
    const sourceOk = sourceFilter === "all" || item.source === sourceFilter;
    const severityOk = severityFilter === "all" || item.severity === severityFilter;
    return sourceOk && severityOk;
  });

  filtered.sort((left, right) => {
    if (sortMode === "date") {
      const dateDelta = toDateValue(left.date) - toDateValue(right.date);
      if (dateDelta !== 0) return dateDelta;
      return right.priority - left.priority;
    }

    const priorityDelta = right.priority - left.priority;
    if (priorityDelta !== 0) return priorityDelta;
    return toDateValue(left.date) - toDateValue(right.date);
  });

  return filtered;
}

export function summarizeBySeverity(items: AlertItem[]): Record<AlertSeverity, number> {
  return {
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    low: items.filter((item) => item.severity === "low").length
  };
}
