import { UserCreateRequest } from "./UserProfileDTO";
import { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";

type OwnerRequest = UserCreateRequest;

export interface GoatFarmFullRequest {
  farm: {
    name: string;
    tod: string;
  };
  user: OwnerRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
}

// Mantém compatibilidade com código existente
export type FarmCreateRequest = GoatFarmFullRequest;
