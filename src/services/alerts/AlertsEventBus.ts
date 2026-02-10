type AlertListener = (farmId: number) => void;
const listeners: AlertListener[] = [];

export const AlertsEventBus = {
  subscribe(listener: AlertListener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  },
  emit(farmId: number) {
    listeners.forEach(l => l(farmId));
  }
};
