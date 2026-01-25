export interface LactationRequestDTO {
  startDate: string; // yyyy-MM-dd
}

export interface LactationDryRequestDTO {
  endDate: string; // yyyy-MM-dd
}

export interface LactationResponseDTO {
  id: number;
  goatId: number;
  startDate: string;
  endDate?: string;
  isClosed: boolean;
}
