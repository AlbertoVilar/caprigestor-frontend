import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AlertRegistry,
  AlertProvider,
  AlertSeverity,
  AlertSummary,
  resolveHighestAlertSeverity,
} from '../../services/alerts/AlertRegistry';
import { PregnancyDiagnosisAlertProvider } from '../../services/alerts/providers/PregnancyDiagnosisAlertProvider';
import { PregnancyDueAlertProvider } from '../../services/alerts/providers/PregnancyDueAlertProvider';
import { LactationDryOffAlertProvider } from '../../services/alerts/providers/LactationDryOffAlertProvider';
import { HealthAlertProvider } from '../../services/alerts/providers/HealthAlertProvider';
import { AlertsEventBus } from '../../services/alerts/AlertsEventBus';

// Register providers
AlertRegistry.register(PregnancyDiagnosisAlertProvider);
AlertRegistry.register(PregnancyDueAlertProvider);
AlertRegistry.register(LactationDryOffAlertProvider);
AlertRegistry.register(HealthAlertProvider);

interface ProviderState {
  providerKey: string;
  summary: AlertSummary;
  loading: boolean;
  error: boolean;
}

const LIFECYCLE_REFRESH_DEBOUNCE_MS = 1_500;

interface FarmAlertsContextType {
  farmId?: number;
  totalCount: number;
  highestSeverity?: AlertSeverity;
  providerStates: ProviderState[];
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  getProvider: (key: string) => AlertProvider | undefined;
}

const FarmAlertsContext = createContext<FarmAlertsContextType | undefined>(undefined);

export function FarmAlertsProvider({
  children,
  farmId,
  enabled = true,
}: {
  children: React.ReactNode;
  farmId?: number;
  enabled?: boolean;
}) {
  const [providerStates, setProviderStates] = useState<ProviderState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);
  const requestVersionRef = useRef(0);
  const lastLifecycleRefreshAtRef = useRef<number | null>(null);

  const getProvider = (key: string) => {
    return AlertRegistry.getProviders().find(p => p.key === key);
  };

  const refreshAlerts = useCallback(async () => {
    if (!farmId || !enabled) {
      requestVersionRef.current += 1;
      setProviderStates([]);
      setIsLoading(false);
      return;
    }

    const requestVersion = ++requestVersionRef.current;
    setIsLoading(true);
    const providers = AlertRegistry.getProviders();

    setProviderStates((previousStates) =>
      providers.map((provider) => {
        const previous = previousStates.find((state) => state.providerKey === provider.key);
        return {
          providerKey: provider.key,
          summary: previous?.summary ?? { count: 0 },
          loading: true,
          error: false
        };
      })
    );

    try {
      const results = await Promise.allSettled(
        providers.map(p => p.getSummary(farmId))
      );

      if (!mountedRef.current || requestVersion !== requestVersionRef.current) return;

      const newStates: ProviderState[] = providers.map((p, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return {
            providerKey: p.key,
            summary: result.value,
            loading: false,
            error: false
          };
        } else {
          console.error(`Error fetching alerts for ${p.key}:`, result.reason);
          return {
            providerKey: p.key,
            summary: { count: 0 },
            loading: false,
            error: true
          };
        }
      });

      setProviderStates(newStates);
    } catch (error) {
      console.error("Global alert fetch error", error);
    } finally {
      if (mountedRef.current && requestVersion === requestVersionRef.current) setIsLoading(false);
    }
  }, [enabled, farmId]);

  // Initial fetch and subscription
  useEffect(() => {
    mountedRef.current = true;
    lastLifecycleRefreshAtRef.current = null;
    refreshAlerts();

    // Subscribe to events
    const unsubscribe = AlertsEventBus.subscribe((invalidatedFarmId) => {
      if (farmId === invalidatedFarmId) {
        refreshAlerts();
      }
    });

    const refreshFromLifecycle = () => {
      if (!farmId || !enabled) return;

      const now = Date.now();
      const lastRefreshAt = lastLifecycleRefreshAtRef.current;
      if (lastRefreshAt !== null && now - lastRefreshAt < LIFECYCLE_REFRESH_DEBOUNCE_MS) return;

      lastLifecycleRefreshAtRef.current = now;
      void refreshAlerts();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshFromLifecycle();
    };

    window.addEventListener('focus', refreshFromLifecycle);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
      unsubscribe();
      window.removeEventListener('focus', refreshFromLifecycle);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, farmId, refreshAlerts]);

  const totalCount = providerStates.reduce((acc, curr) => acc + curr.summary.count, 0);
  const highestSeverity = resolveHighestAlertSeverity(
    providerStates
      .filter((state) => state.summary.count > 0)
      .map((state) => state.summary.highestSeverity)
  );

  return (
    <FarmAlertsContext.Provider
      value={{ farmId, totalCount, highestSeverity, providerStates, isLoading, refreshAlerts, getProvider }}
    >
      {children}
    </FarmAlertsContext.Provider>
  );
}

export function useFarmAlerts() {
  const context = useContext(FarmAlertsContext);
  if (context === undefined) {
    throw new Error('useFarmAlerts must be used within a FarmAlertsProvider');
  }
  return context;
}
