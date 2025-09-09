export interface GoatFarmResponse {
  id: number;
  name: string;
  tod: string;
  createdAt: string;
  updatedAt: string;

  userId: number;
  user: {
    id: number;
    name: string;
  };

  addressId: number;
  street: string;
  district: string;
  city: string;
  state: string;
  cep: string;

  phones: {
    id: number;
    ddd: string;
    number: string;
  }[];

  // Campos de compatibilidade (deprecated)
  ownerId?: number;
  ownerName?: string;
}

