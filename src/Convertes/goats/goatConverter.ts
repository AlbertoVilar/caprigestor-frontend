// src/Convertes/goats/goatConverter.ts
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatStatusEnum, GoatGenderEnum, GoatCategoryEnum } from "../../types/goatEnums";
// ✅ Imports de conversão removidos - backend cuida de tudo com @JsonValue e @JsonCreator
// Apenas mantendo arrays para os selects do formulário se necessário

// Interface para dados do formulário com labels em português
interface GoatFormData {
  id?: string | number;
  registrationNumber?: string;
  name?: string;
  breed?: string;
  color?: string;
  birthDate?: string;
  farmId?: string | number;
  userId?: string | number; // ✅ Corrigido: ownerId → userId
  gender?: GoatGenderEnum | string;
  status?: GoatStatusEnum | string;
  genderLabel?: string; // "Macho" | "Fêmea"
  statusLabel?: string; // "Ativo" | "Inativo" | "Vendido" | "Falecido"
  category?: string;
  weight?: number;
  height?: number;
  observations?: string;
  microchipNumber?: string;
  toe?: string;
  tod?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  motherId?: string | number;
  fatherId?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

// Interface para resposta estendida do backend
interface ExtendedGoatResponse {
  // Campos do GoatResponseDTO
  registrationNumber?: string;
  name?: string;
  breed?: string;
  color?: string;
  gender?: GoatGenderEnum | "MACHO" | "FÊMEA";
  birthDate?: string;
  status?: GoatStatusEnum | "INACTIVE" | "SOLD" | "DECEASED";
  category?: GoatCategoryEnum | string;
  toe?: string;
  tod?: string;
  farmId?: number;
  farmName?: string;
  ownerName?: string;
  ownerId?: number;
  userId?: number; // ✅ Adicionado userId
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  
  // Campos adicionais/alternativos do backend
  id?: string | number;
  sex?: "MALE" | "FEMALE";
  situation?: "ATIVO" | "INACTIVE" | "SOLD" | "DECEASED";
  coat?: string;
  goatFarmId?: number | string;
  goatFarm?: { id: number | string };
  owner?: { id: number | string };
  user?: { id: number | string }; // ✅ Adicionado user
  weight?: number;
  height?: number;
  microchipNumber?: string;
  motherId?: string | number;
  fatherId?: string | number;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** --------- Util: data em ISO (YYYY-MM-DD) --------- */
const toISO = (v?: string | Date): string | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") {
    // já está ISO?
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // dd/mm/yyyy
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
  return undefined;
};

/** --------- Tipo do payload esperado pelo BACKEND (POST /api/goats) --------- */
// Tipo corrigido para corresponder ao GoatRequestDTO.java do backend
export type BackendGoatPayload = {
  registrationNumber: string;
  name: string;
  gender: 'M' | 'F';                 // ✅ Corrigido: sex → gender
  breed: string;
  color: string;                     // ✅ Corrigido: coat → color
  birthDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'DECEASED'; // ✅ Corrigido: situation → status
  tod: string;                       // ✅ Adicionado: obrigatório
  toe: string;                       // ✅ Adicionado: obrigatório
  category: 'JOVEM' | 'ADULTO' | 'SENIOR'; // ✅ Adicionado: obrigatório
  fatherRegistrationNumber?: string; // ✅ Adicionado: opcional
  motherRegistrationNumber?: string; // ✅ Adicionado: opcional
  farmId: number;
  userId: number;
};

// Mantendo o tipo antigo para compatibilidade
export type BackendGoatCreateDTO = BackendGoatPayload;

/** 
 * FRONT (form - PT/DTO do FE) -> BACK (payload)
 * - NÃO inclui motherId/fatherId (genealogia é outra rota)
 */
export const mapGoatToBackend = (goat: GoatFormData): BackendGoatPayload => {
  return {
    registrationNumber: String(goat.registrationNumber ?? "").trim(),
    name: String(goat.name ?? "").trim(),
    gender: (goat.genderLabel ?? goat.gender) as "M" | "F", // ✅ Valor em português enviado diretamente ("Macho"/"Fêmea")
    breed: String(goat.breed ?? "").trim(),    // ✅ Obrigatório
    color: String(goat.color ?? "").trim(),    // ✅ Corrigido: coat → color
    birthDate: toISO(goat.birthDate) ?? "",    // ✅ Obrigatório
    status: (goat.statusLabel ?? goat.status) as BackendGoatPayload["status"], // ✅ Valor em português enviado diretamente ("Ativo")
    tod: String(goat.tod ?? "").trim(),        // ✅ Adicionado: obrigatório
    toe: String(goat.toe ?? "").trim(),        // ✅ Adicionado: obrigatório
    category: (goat.category ?? "ADULTO") as BackendGoatPayload["category"], // ✅ Valor direto ("PO", "PA", "PC")
    fatherRegistrationNumber: goat.fatherRegistrationNumber || undefined, // ✅ Adicionado: opcional
    motherRegistrationNumber: goat.motherRegistrationNumber || undefined, // ✅ Adicionado: opcional
    farmId: Number(goat.farmId),               // ✅ Obrigatório
    userId: Number(goat.userId),               // ✅ Obrigatório
  };
};

/**
 * BACK (GoatResponseDTO) -> FRONT (dados pro form)
 * - Sem motherId/fatherId (não existem no seu GoatResponseDTO atual)
 * - Com labels PT para selects no formulário
 */
export const convertResponseToRequest = (response: ExtendedGoatResponse): GoatFormData => {
  const extendedResponse = response as ExtendedGoatResponse;
  // ✅ Backend agora retorna valores em português diretamente com @JsonValue
  const genderValue = extendedResponse.gender || extendedResponse.sex;
  const statusValue = extendedResponse.status || extendedResponse.situation;

  return {
    // campos básicos
    id: extendedResponse.id,
    registrationNumber: extendedResponse.registrationNumber || "",
    name: extendedResponse.name || "",
    breed: extendedResponse.breed || "",
    color: extendedResponse.color || extendedResponse.coat || "",
    birthDate: extendedResponse.birthDate || "",
    farmId: extendedResponse.farmId || extendedResponse.goatFarmId || extendedResponse.goatFarm?.id || "",
    userId: extendedResponse.userId || extendedResponse.user?.id || extendedResponse.ownerId || extendedResponse.owner?.id || "", // ✅ Corrigido: incluir userId

    // ✅ Valores já em português vindos do backend ("Macho"/"Fêmea", "Ativo"/"Inativo")
    gender: genderValue,
    status: statusValue,
    genderLabel: genderValue, // ✅ Mesmo valor, backend já retorna em português
    statusLabel: statusValue, // ✅ Mesmo valor, backend já retorna em português

    // campos opcionais
    category: extendedResponse.category,
    toe: extendedResponse.toe || "",
    tod: extendedResponse.tod || "",
    weight: extendedResponse.weight,
    height: extendedResponse.height,
    observations: extendedResponse.observations,
    microchipNumber: extendedResponse.microchipNumber,
    fatherRegistrationNumber: extendedResponse.fatherRegistrationNumber,
    motherRegistrationNumber: extendedResponse.motherRegistrationNumber,
    motherId: extendedResponse.motherId,
    fatherId: extendedResponse.fatherId,
    createdAt: extendedResponse.createdAt,
    updatedAt: extendedResponse.updatedAt,
  };
};
