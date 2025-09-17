// src/Models/goatRequestDTO.ts
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums';

export interface GoatRequestDTO {
  registrationNumber: string;             // TOD + TOE (único)
  name: string;                           // Nome da cabra
  breed: string;                          // Raça (enum GoatBreed no backend)
  color: string;                          // Cor (coat no backend)
  gender: GoatGenderEnum;                 // M / F
  birthDate: string;                      // yyyy-MM-dd
  status: GoatStatusEnum;                 // Ativo / Inativo / Vendido / Falecido
  category: GoatCategoryEnum;             // PO / PA / PC
  toe: string;                            // Orelha esquerda
  tod: string;                            // Orelha direita
  fatherRegistrationNumber?: string;      // opcional
  motherRegistrationNumber?: string;      // opcional
  farmId: number | string;                // ID da fazenda
  userId: number | string;                // ID do usuário (proprietário)

  // Campos opcionais adicionais
  weight?: number;
  height?: number;
  registrationNumber2?: string;           // compatibilidade futura
  microchipNumber?: string;
  observations?: string;
  motherId?: string;
  fatherId?: string;
}
