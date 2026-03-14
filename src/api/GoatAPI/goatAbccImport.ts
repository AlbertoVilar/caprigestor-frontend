import type { BackendGoatPayload } from "../../Convertes/goats/goatConverter";
import { toGoatResponseDTO } from "../../Convertes/goats/goatConverter";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { requestBackEnd } from "../../utils/request";

type Envelope<T> = { data: T } | T;

function hasData<T>(payload: unknown): payload is { data: T } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  );
}

function unwrap<T>(payload: Envelope<T>): T {
  return hasData<T>(payload) ? payload.data : (payload as T);
}

export type GoatAbccFilterSex = "0" | "1";
export type GoatAbccFilterDna = "0" | "1";

export interface GoatAbccRaceOptionDTO {
  id: number;
  name: string;
  normalizedBreed?: string | null;
}

export interface GoatAbccRaceOptionsResponseDTO {
  items: GoatAbccRaceOptionDTO[];
}

export interface GoatAbccSearchRequestDTO {
  raceId?: number;
  raceName?: string;
  affix: string;
  page?: number;
  sex?: GoatAbccFilterSex;
  tod?: string;
  toe?: string;
  name?: string;
  dna?: GoatAbccFilterDna;
}

export interface GoatAbccSearchItemDTO {
  externalSource: string;
  externalId: string;
  nome: string;
  situacao: string;
  dna: string;
  tod: string;
  toe: string;
  criador: string;
  afixo: string;
  dataNascimento: string;
  sexo: string;
  raca: string;
  pelagem: string;
  normalizedGender?: string | null;
  normalizedBreed?: string | null;
  normalizedStatus?: string | null;
  normalizationWarnings?: string[];
}

export interface GoatAbccSearchResponseDTO {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  items: GoatAbccSearchItemDTO[];
}

export interface GoatAbccPreviewResponseDTO {
  externalSource: string;
  externalId: string;
  registrationNumber: string;
  name: string;
  gender?: string | null;
  breed?: string | null;
  color?: string | null;
  birthDate?: string | null;
  status?: string | null;
  tod?: string | null;
  toe?: string | null;
  category?: string | null;
  fatherName?: string | null;
  fatherRegistrationNumber?: string | null;
  motherName?: string | null;
  motherRegistrationNumber?: string | null;
  userName?: string | null;
  farmId?: number | null;
  farmName?: string | null;
  normalizationWarnings?: string[];
}

export interface GoatAbccConfirmRequestDTO {
  externalId: string;
  goat: BackendGoatPayload;
}

export interface GoatAbccBatchConfirmItemRequestDTO {
  externalId: string;
}

export interface GoatAbccBatchConfirmRequestDTO {
  items: GoatAbccBatchConfirmItemRequestDTO[];
}

export type GoatAbccBatchItemStatus =
  | "IMPORTED"
  | "SKIPPED_DUPLICATE"
  | "SKIPPED_TOD_MISMATCH"
  | "ERROR";

export interface GoatAbccBatchConfirmItemResultDTO {
  externalId?: string | null;
  registrationNumber?: string | null;
  name?: string | null;
  status: GoatAbccBatchItemStatus;
  message: string;
}

export interface GoatAbccBatchConfirmResponseDTO {
  totalSelected: number;
  totalImported: number;
  totalSkippedDuplicate: number;
  totalSkippedTodMismatch: number;
  totalError: number;
  results: GoatAbccBatchConfirmItemResultDTO[];
}

export async function listAbccRaceOptions(
  farmId: number
): Promise<GoatAbccRaceOptionsResponseDTO> {
  const response = await requestBackEnd.get(
    `/goatfarms/${farmId}/goats/imports/abcc/races`
  );
  const raw = unwrap(response.data);

  return {
    items: Array.isArray(raw?.items) ? raw.items : [],
  };
}

export async function searchGoatsByAbcc(
  farmId: number,
  payload: GoatAbccSearchRequestDTO
): Promise<GoatAbccSearchResponseDTO> {
  const response = await requestBackEnd.post(
    `/goatfarms/${farmId}/goats/imports/abcc/search`,
    payload
  );
  const raw = unwrap(response.data);
  return {
    currentPage: Number(raw?.currentPage ?? 0),
    totalPages: Number(raw?.totalPages ?? 0),
    pageSize: Number(raw?.pageSize ?? 0),
    items: Array.isArray(raw?.items) ? raw.items : [],
  };
}

export async function previewGoatFromAbcc(
  farmId: number,
  externalId: string
): Promise<GoatAbccPreviewResponseDTO> {
  const response = await requestBackEnd.post(
    `/goatfarms/${farmId}/goats/imports/abcc/preview`,
    { externalId }
  );
  const raw = unwrap<GoatAbccPreviewResponseDTO>(response.data);
  return raw;
}

export async function confirmGoatImportFromAbcc(
  farmId: number,
  payload: GoatAbccConfirmRequestDTO
): Promise<GoatResponseDTO> {
  const response = await requestBackEnd.post(
    `/goatfarms/${farmId}/goats/imports/abcc/confirm`,
    payload
  );
  const raw = unwrap(response.data);
  return toGoatResponseDTO(raw);
}

export async function confirmGoatImportBatchFromAbcc(
  farmId: number,
  payload: GoatAbccBatchConfirmRequestDTO
): Promise<GoatAbccBatchConfirmResponseDTO> {
  const response = await requestBackEnd.post(
    `/goatfarms/${farmId}/goats/imports/abcc/confirm-batch`,
    payload
  );
  const raw = unwrap(response.data);

  return {
    totalSelected: Number(raw?.totalSelected ?? 0),
    totalImported: Number(raw?.totalImported ?? 0),
    totalSkippedDuplicate: Number(raw?.totalSkippedDuplicate ?? 0),
    totalSkippedTodMismatch: Number(raw?.totalSkippedTodMismatch ?? 0),
    totalError: Number(raw?.totalError ?? 0),
    results: Array.isArray(raw?.results) ? raw.results : [],
  };
}
