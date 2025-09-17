// src/Convertes/goats/goatConverter.ts
import type { GoatGenderEnum, GoatStatusEnum, GoatCategoryEnum } from "../../types/goatEnums";

/** ====== Tipos ====== */
export interface GoatFormData {
  id?: string | number;
  registrationNumber?: string;
  name?: string;
  breed?: string;
  color?: string;
  birthDate?: string;
  farmId?: number | string;
  userId?: number | string;

  // UI labels ou enums vindos do form/response
  gender?: GoatGenderEnum | string;       // "Macho" | "Fêmea" | "M" | "F"
  status?: GoatStatusEnum | string;       // "Ativo" | "Inativo" | ...
  genderLabel?: string;                   // preferimos usar label da UI
  statusLabel?: string;

  category?: GoatCategoryEnum | string;   // "PO" | "PA" | "PC"
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

interface ExtendedGoatResponse {
  registrationNumber?: string;
  name?: string;
  breed?: string;
  color?: string;
  gender?: GoatGenderEnum | "M" | "F" | "Macho" | "Fêmea";
  birthDate?: string;
  status?: GoatStatusEnum | "Ativo" | "Inativo" | "Vendido" | "Falecido";
  category?: GoatCategoryEnum | string;
  toe?: string;
  tod?: string;
  farmId?: number;
  farmName?: string;
  ownerName?: string;
  ownerId?: number;
  userId?: number;
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;

  id?: string | number;
  sex?: "MALE" | "FEMALE";
  situation?: "ATIVO" | "INACTIVE" | "SOLD" | "DECEASED";
  coat?: string;
  goatFarmId?: number | string;
  goatFarm?: { id: number | string };
  owner?: { id: number | string };
  user?: { id: number | string };
  weight?: number;
  height?: number;
  microchipNumber?: string;
  motherId?: string | number;
  fatherId?: string | number;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** ====== Utils ====== */
const toISO = (v?: string | Date): string | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;               // já ISO
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);          // dd/mm/yyyy
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
  return undefined;
};

/** Payload exatamente como o backend espera hoje (create/update) */
export type BackendGoatPayload = {
  registrationNumber: string;
  name: string;
  gender: "Macho" | "Fêmea"; // Alterado de "M" | "F"
  breed: string;
  color: string;
  birthDate: string;                           // yyyy-MM-dd
  status: "Ativo" | "Inativo" | "Vendido" | "Falecido";
  tod: string;
  toe: string;
  category: "PO" | "PA" | "PC";
  fatherRegistrationNumber?: string | null;
  motherRegistrationNumber?: string | null;
  farmId: number;
  userId: number;
};

/** ====== Mappers ====== */
const toBackendGender = (g?: string): "Macho" | "Fêmea" => {
  const val = (g || "").toUpperCase();
  if (val.startsWith("F")) {
    return "Fêmea"; // Alterado de "F"
  }
  return "Macho";   // Alterado de "M"
};

const toBackendStatus = (s?: string): BackendGoatPayload["status"] => {
  const v = (s || "").toLowerCase();
  if (v.includes("inativo") || v.includes("inactive")) return "Inativo";
  if (v.includes("vendido") || v.includes("sold"))     return "Vendido";
  if (v.includes("falec"))   /* falecido */            return "Falecido";
  return "Ativo";
};

const emptyToNull = (v?: string): string | null | undefined =>
  v === undefined ? undefined : (v?.trim() ? v.trim() : null);

/** FRONT (form) -> BACK (payload) */
export const mapGoatToBackend = (goat: GoatFormData): BackendGoatPayload => {
  return {
    registrationNumber: String(goat.registrationNumber ?? "").trim(),
    name: String(goat.name ?? "").trim(),
    gender: toBackendGender(goat.genderLabel ?? goat.gender),
    breed: String(goat.breed ?? "").trim(),
    color: String(goat.color ?? "").trim(),
    birthDate: toISO(goat.birthDate) ?? "",

    // Backend já aceita português via @JsonCreator/@JsonValue para Status
    status: toBackendStatus(goat.statusLabel ?? goat.status),

    // obrigatórios
    tod: String(goat.tod ?? "").trim(),
    toe: String(goat.toe ?? "").trim(),
    category: (String(goat.category ?? "PA").toUpperCase() as BackendGoatPayload["category"]),

    // genealogy opcionais: envie null se vazio
    fatherRegistrationNumber: emptyToNull(goat.fatherRegistrationNumber),
    motherRegistrationNumber: emptyToNull(goat.motherRegistrationNumber),

    farmId: Number(goat.farmId),
    userId: Number(goat.userId),
  };
};

/** BACK (response) -> FRONT (form) */
export const convertResponseToRequest = (response: ExtendedGoatResponse): GoatFormData => {
  const genderValue = response.gender ?? response.sex;       // pode vir "Macho"/"Fêmea" ou "M"/"F"
  const statusValue = response.status ?? response.situation; // pode vir em PT já

  return {
    id: response.id,
    registrationNumber: response.registrationNumber || "",
    name: response.name || "",
    breed: response.breed || "",
    color: response.color || response.coat || "",
    birthDate: response.birthDate || "",
    farmId: response.farmId || response.goatFarmId || response.goatFarm?.id || "",
    userId: response.userId || response.user?.id || response.ownerId || response.owner?.id || "",

    gender: genderValue,
    status: statusValue,
    genderLabel: typeof genderValue === "string" ? genderValue : "",
    statusLabel: typeof statusValue === "string" ? statusValue : "",

    category: response.category || "",
    toe: response.toe || "",
    tod: response.tod || "",
    weight: response.weight,
    height: response.height,
    observations: response.observations,
    microchipNumber: response.microchipNumber,
    fatherRegistrationNumber: response.fatherRegistrationNumber || "",
    motherRegistrationNumber: response.motherRegistrationNumber || "",
    motherId: response.motherId,
    fatherId: response.fatherId,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
};
