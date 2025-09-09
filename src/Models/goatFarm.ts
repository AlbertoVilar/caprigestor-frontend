import type { PhonesDTO } from "./phone";

export type GoatFarmDTO = {
  id: number;
  name: string;
  tod: string;
  createdAt: string; // ou Date, dependendo de como você lida com datas
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

  phones: PhonesDTO[];

  logoUrl?: string; // <- adicionado como opcional
  
  // Campos de compatibilidade (deprecated)
  ownerId?: number;
  ownerName?: string;
};
