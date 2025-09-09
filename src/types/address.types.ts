// Interfaces para o serviço de endereços

export interface AddressRequestDTO {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressResponseDTO {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface AddressValidationErrors {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}