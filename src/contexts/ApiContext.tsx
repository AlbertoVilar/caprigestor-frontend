// src/contexts/ApiContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { FarmService } from '../services/FarmService';
import { GoatService } from '../services/GoatService';
import { EventService } from '../services/EventService';
import { UserService } from '../services/UserService';

interface ApiContextType {
  farmService: FarmService;
  goatService: GoatService;
  eventService: EventService;
  userService: UserService;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const farmService = new FarmService();
  const goatService = new GoatService();
  const eventService = new EventService();
  const userService = new UserService();

  const value: ApiContextType = {
    farmService,
    goatService,
    eventService,
    userService,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};