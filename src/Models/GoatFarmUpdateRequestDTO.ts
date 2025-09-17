
import type { UserUpdateRequest } from "./UserUpdateRequestDTO";
import type { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";


export interface GoatFarmUpdateRequest {
  user: UserUpdateRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
  farm: {
    id: number;
    nome: string;
    tod: string; // máximo 10 caracteres
  };
}


