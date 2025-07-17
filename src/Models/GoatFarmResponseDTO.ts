export interface GoatFarmResponse {
  id: number;
  name: string;
  tod: string;
  createdAt: string;
  updatedAt: string;

  ownerId: number;
  ownerName: string;

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
}

