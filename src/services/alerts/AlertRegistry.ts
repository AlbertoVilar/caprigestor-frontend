export interface AlertSummary {
  count: number;
  headline?: string;
  worstOverdueDays?: number;
  highestSeverity?: AlertSeverity;
  previewItems?: AlertItem[];
}

export type AlertSource = "reproduction" | "lactation" | "health";
export type AlertSeverity = "high" | "medium" | "low";

const ALERT_SEVERITY_WEIGHT: Record<AlertSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function resolveHighestAlertSeverity(
  severities: Array<AlertSeverity | undefined>
): AlertSeverity | undefined {
  return severities.reduce<AlertSeverity | undefined>((highest, current) => {
    if (!current) return highest;
    if (!highest || ALERT_SEVERITY_WEIGHT[current] > ALERT_SEVERITY_WEIGHT[highest]) {
      return current;
    }
    return highest;
  }, undefined);
}

export interface AlertItem {
  id: string;
  source: AlertSource;
  title: string;
  description: string;
  date?: string;
  severity: AlertSeverity;
  priority: number;
  link?: string;
  actionLabel?: string;
  onAction?: () => void;
  goatId?: string;
  startDatePregnancy?: string;
  dryOffDate?: string;
  gestationDays?: number;
  daysOverdue?: number;
}

export interface AlertListParams {
  referenceDate?: string;
  page?: number;
  size?: number;
}

export interface AlertProvider {
  key: string;
  label: string;
  priority: number;

  getSummary(farmId: number): Promise<AlertSummary>;
  getList?(farmId: number, params?: AlertListParams): Promise<AlertItem[]>;
  getRoute(farmId: number): string;
}

class AlertRegistryImpl {
  private providers: AlertProvider[] = [];

  register(provider: AlertProvider) {
    if (this.providers.some((current) => current.key === provider.key)) {
      console.warn(`AlertProvider with key ${provider.key} is already registered.`);
      return;
    }

    this.providers.push(provider);
    this.providers.sort((left, right) => right.priority - left.priority);
  }

  getProviders() {
    return this.providers;
  }
}

export const AlertRegistry = new AlertRegistryImpl();
