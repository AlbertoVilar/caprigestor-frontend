// src/Models/goatResponseDTO.ts
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums';

export interface GoatResponseDTO {
  registrationNumber: string;             // Identificador único (TOD + TOE)
  name: string;                           // Nome da cabra
  breed: string;                          // Raça
  color: string;                          // Cor
  gender: GoatGenderEnum | string;        // "M" | "F" | "Macho" | "Fêmea"
  birthDate: string;                      // yyyy-MM-dd
  status: GoatStatusEnum | string;        // "Ativo" | "Inativo" | "Vendido" | "Falecido"
  category: GoatCategoryEnum | string;    // "PO" | "PA" | "PC"
  toe: string;                            // Orelha esquerda
  tod: string;                            // Orelha direita

  // Dados de relacionamento
  farmId: number;
  farmName?: string;
  ownerId?: number;
  ownerName?: string;
  userId?: number;
  userName?: string;                      // Nome do criador/usuário

  // Genealogia
  fatherName?: string;
  fatherRegistrationNumber?: string;
  motherName?: string;
  motherRegistrationNumber?: string;

  // Extras opcionais
  weight?: number;
  height?: number;
  microchipNumber?: string;
  observations?: string;
  motherId?: string | number;
  fatherId?: string | number;

  // Controle de auditoria
  createdAt?: string;
  updatedAt?: string;
}
