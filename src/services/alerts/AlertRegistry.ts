export interface AlertSummary {
  count: number;
  headline?: string; // Ex: "Maior atraso: 15 dias"
  worstOverdueDays?: number;
  previewItems?: AlertItem[];
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  date?: string; // ISO string
  severity: 'high' | 'medium' | 'low';
  link?: string; // Internal route
  actionLabel?: string;
  onAction?: () => void;
  goatId?: string; // For linking to animal
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
  label: string; // Ex: "Secagem", "Diagnóstico de Prenhez"
  priority: number; // Higher number = higher priority in list
  
  /**
   * Fetches summary for the badge/header
   */
  getSummary(farmId: number): Promise<AlertSummary>;
  
  /**
   * Optional: Fetches detailed items for the drawer/list
   */
  getList?(farmId: number, params?: AlertListParams): Promise<AlertItem[]>;
  
  /**
   * Route to the full details page
   */
  getRoute(farmId: number): string;
}

class AlertRegistryImpl {
  private providers: AlertProvider[] = [];

  register(provider: AlertProvider) {
    // Prevent duplicates
    if (this.providers.some(p => p.key === provider.key)) {
      console.warn(`AlertProvider with key ${provider.key} is already registered.`);
      return;
    }
    this.providers.push(provider);
    // Sort by priority desc
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  getProviders() {
    return this.providers;
  }
}

export const AlertRegistry = new AlertRegistryImpl();
