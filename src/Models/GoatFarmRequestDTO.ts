export interface GoatFarmRequest {
  name: string;
  tod: string;
  ownerId: number;
  addressId: number;
  phoneIds: number[]; // IDs dos telefones salvos anteriormente
}
