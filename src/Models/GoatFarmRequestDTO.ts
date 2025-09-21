export interface GoatFarmRequest {
  id?: number; 
  name: string;
  tod: string;
  userId: number; // Substitui ownerId para alinhar com o backend
  addressId: number;
  phoneIds: number[]; // IDs dos telefones salvos anteriormente
}
