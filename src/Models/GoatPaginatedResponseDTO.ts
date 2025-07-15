import type { GoatResponseDTO } from "./goatResponseDTO";

export interface GoatPageResponseDTO {
  content: GoatResponseDTO[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
