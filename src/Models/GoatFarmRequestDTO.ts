export interface GoatFarmRequest {
  id?: number; 
  name: string;
  tod: string;
  userId: number;
  addressId: number;
  phoneIds: number[]; // IDs dos telefones salvos anteriormente
  
  // Campo de compatibilidade (deprecated)
  ownerId?: number;
}
