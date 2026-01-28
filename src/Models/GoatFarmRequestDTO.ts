export interface GoatFarmRequest {
  id?: number; 
  name: string;
  tod: string;
  logoUrl?: string; // URL da logo da fazenda
  userId: number; // Substitui ownerId para alinhar com o backend
  addressId: number;
  phoneIds: number[]; // IDs dos telefones salvos anteriormente
  version?: number; // versão atual para update (opcional aqui)
}
