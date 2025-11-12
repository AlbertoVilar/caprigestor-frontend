// Interfaces para o serviço de telefones

export type PhoneType = 'MOBILE' | 'HOME' | 'WORK';

export interface PhoneRequestDTO {
  number: string;
  type: PhoneType;
}

export interface PhoneResponseDTO {
  id: number;
  number: string;
  type: PhoneType;
}

export interface PhoneValidationErrors {
  number?: string;
  type?: string;
}