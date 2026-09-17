export type FarmGoatRegistryGlobalStatus =
  | "ATIVO"
  | "INATIVO"
  | "FALECIDO"
  | "VENDIDO";

export type FarmGoatRegistryRole =
  | "CREATOR"
  | "CURRENT_OWNER"
  | "FORMER_OWNER";

export type FarmGoatRegistryDisposition =
  | "CURRENT"
  | "SOLD"
  | "TRANSFERRED"
  | "DONATED"
  | "RETIRED"
  | "DECEASED"
  | "NONE";

export interface FarmGoatRegistryResponseDTO {
  goatId: number;
  registrationNumber: string;
  name: string;
  globalStatus: FarmGoatRegistryGlobalStatus;
  creatorFarmId: number | null;
  creatorNameSnapshot: string | null;
  roles: FarmGoatRegistryRole[];
  disposition: FarmGoatRegistryDisposition;
  currentOwnerFarmId: number | null;
}
