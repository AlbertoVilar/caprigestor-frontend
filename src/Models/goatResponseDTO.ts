import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums.tsx';

export interface GoatResponseDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: GoatGenderEnum | "MACHO" | "FÊMEA";
  birthDate: string;
  status: GoatStatusEnum | "INATIVO" | "VENDIDO" | "MORTO" | "INACTIVE" | "SOLD" | "DECEASED";
  category: GoatCategoryEnum | string;
  toe: string;
  tod: string;
  farmId: number;
  farmName: string;
  ownerName: string;
  ownerId?: number; // ✅ adicione isso!
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
}
