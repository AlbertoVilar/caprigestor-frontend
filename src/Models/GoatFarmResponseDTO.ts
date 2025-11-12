export interface GoatFarmResponse {
  id: number;
  name: string;
  tod: string;
  createdAt: string;
  updatedAt: string;
  version?: number;

  userId: number;
  userName: string;
  userEmail: string;
  userCpf: string;

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

