import type {
  FarmGoatRegistryDisposition,
  FarmGoatRegistryGlobalStatus,
  FarmGoatRegistryRole,
} from "./FarmGoatRegistryDTOs";
import type { GenealogyNodeSource } from "./goatGenealogyDTO";

export type HistoricalGenealogyIntegrationStatus =
  | "FOUND"
  | "NOT_FOUND"
  | "UNAVAILABLE"
  | "INSUFFICIENT_DATA";

export interface FarmGoatRegistryHistoricalDossierBasicDTO {
  goatId: number;
  registrationNumber: string | null;
  name: string;
  globalStatus: FarmGoatRegistryGlobalStatus;
  gender: string;
  breed: string;
  color: string | null;
  birthDate: string;
  category: string;
  tod: string | null;
  toe: string | null;
  fatherName: string | null;
  fatherRegistrationNumber: string | null;
  motherName: string | null;
  motherRegistrationNumber: string | null;
  creatorFarmId: number | null;
  creatorNameSnapshot: string | null;
  roles: FarmGoatRegistryRole[];
  disposition: FarmGoatRegistryDisposition;
  currentOwnerFarmId: number | null;
}

export interface FarmGoatRegistryHistoricalGenealogyNodeDTO {
  relationship: string;
  name: string | null;
  registrationNumber: string | null;
  source: GenealogyNodeSource;
  localTechnicalGoatId: number | null;
}

export interface FarmGoatRegistryHistoricalGenealogyIntegrationDTO {
  status: HistoricalGenealogyIntegrationStatus;
  lookupKey: string | null;
  message: string | null;
}

export interface FarmGoatRegistryHistoricalGenealogyDTO {
  animalPrincipal: FarmGoatRegistryHistoricalGenealogyNodeDTO;
  pai: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  mae: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  avoPaterno: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  avoPaterna: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  avoMaterno: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  avoMaterna: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoPaternoPai: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoPaternaPai: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoPaternoMae: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoPaternaMae: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoMaternoPai: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoMaternaPai: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoMaternoMae: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  bisavoMaternaMae: FarmGoatRegistryHistoricalGenealogyNodeDTO | null;
  integration: FarmGoatRegistryHistoricalGenealogyIntegrationDTO | null;
}

export interface FarmGoatHistoricalLactationDTO {
  id: number;
  goatId: number;
  farmId: number;
  status: string;
  startDate: string;
  endDate: string | null;
  pregnancyStartDate: string | null;
  dryStartDate: string | null;
  dryAtPregnancyDays: number | null;
  restDays: number | null;
  active: boolean;
}

export interface FarmGoatHistoricalMilkProductionDTO {
  id: number;
  goatId: number;
  lactationId: number | null;
  farmId: number;
  date: string;
  shift: string;
  volumeLiters: number;
  status: string;
  notes: string | null;
  canceledAt: string | null;
  canceledReason: string | null;
  recordedDuringMilkWithdrawal: boolean;
  milkWithdrawalEventId: number | null;
  milkWithdrawalEndDate: string | null;
  milkWithdrawalSource: string | null;
}

export interface FarmGoatHistoricalMilkLactationResponseDTO {
  goatId: number;
  lactations: FarmGoatHistoricalLactationDTO[];
  milkProductions: FarmGoatHistoricalMilkProductionDTO[];
}
