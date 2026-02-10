import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AlertRegistry, AlertProvider, AlertSummary } from '../../services/alerts/AlertRegistry';
import { PregnancyDiagnosisAlertProvider } from '../../services/alerts/providers/PregnancyDiagnosisAlertProvider';
import { LactationDryOffAlertProvider } from '../../services/alerts/providers/LactationDryOffAlertProvider';
import { HealthAlertProvider } from '../../services/alerts/providers/HealthAlertProvider';
import { AlertsEventBus } from '../../services/alerts/AlertsEventBus';

// Register providers
AlertRegistry.register(PregnancyDiagnosisAlertProvider);
AlertRegistry.register(LactationDryOffAlertProvider);
AlertRegistry.register(HealthAlertProvider);

interface ProviderState {
  providerKey: string;
  summary: AlertSummary;
  loading: boolean;
  error: boolean;
}

interface FarmAlertsContextType {
  totalCount: number;
  providerStates: ProviderState[];
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  getProvider: (key: string) => AlertProvider | undefined;
}

const FarmAlertsContext = createContext<FarmAlertsContextType | undefined>(undefined);

export function FarmAlertsProvider({ children, farmId }: { children: React.ReactNode; farmId?: number }) {
  const [providerStates, setProviderStates] = useState<ProviderState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const getProvider = (key: string) => {
    return AlertRegistry.getProviders().find(p => p.key === key);
  };

  const refreshAlerts = useCallback(async () => {
    if (!farmId) {
      setProviderStates([]);
      return;
    }

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

      if (!mountedRef.current) return;

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
      if (mountedRef.current) setIsLoading(false);
    }
  }, [farmId]);

  // Initial fetch and subscription
  useEffect(() => {
    mountedRef.current = true;
    refreshAlerts();

    // Subscribe to events
    const unsubscribe = AlertsEventBus.subscribe((invalidatedFarmId) => {
      if (farmId === invalidatedFarmId) {
        refreshAlerts();
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [refreshAlerts, farmId]);

  const totalCount = providerStates.reduce((acc, curr) => acc + curr.summary.count, 0);

  return (
    <FarmAlertsContext.Provider value={{ totalCount, providerStates, isLoading, refreshAlerts, getProvider }}>
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
