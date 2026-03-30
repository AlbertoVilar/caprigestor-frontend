export interface FarmMilkProductionUpsertRequestDTO {
  totalProduced: number;
  withdrawalProduced?: number | null;
  marketableProduced?: number | null;
  notes?: string;
}

export interface FarmMilkProductionDailySummaryDTO {
  productionDate: string;
  registered: boolean;
  totalProduced: number;
  withdrawalProduced: number;
  marketableProduced: number;
  notes?: string | null;
  updatedAt?: string | null;
}

export interface FarmMilkProductionMonthlyDayItemDTO {
  productionDate: string;
  totalProduced: number;
  withdrawalProduced: number;
  marketableProduced: number;
  notes?: string | null;
}

export interface FarmMilkProductionMonthlySummaryDTO {
  year: number;
  month: number;
  totalProduced: number;
  withdrawalProduced: number;
  marketableProduced: number;
  daysRegistered: number;
  dailyRecords: FarmMilkProductionMonthlyDayItemDTO[];
}

export interface FarmMilkProductionAnnualMonthItemDTO {
  month: number;
  totalProduced: number;
  withdrawalProduced: number;
  marketableProduced: number;
  daysRegistered: number;
}

export interface FarmMilkProductionAnnualSummaryDTO {
  year: number;
  totalProduced: number;
  withdrawalProduced: number;
  marketableProduced: number;
  daysRegistered: number;
  monthlyRecords: FarmMilkProductionAnnualMonthItemDTO[];
}
