import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums.tsx';

export interface GoatRequestDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: GoatGenderEnum;
  birthDate: string;
  status: GoatStatusEnum;
  category: GoatCategoryEnum;
  toe: string;
  tod: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  farmId: number;
  userId: number;
}
