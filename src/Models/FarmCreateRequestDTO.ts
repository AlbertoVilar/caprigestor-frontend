import { UserProfile, OwnerCompatibility } from "./UserProfileDTO";
import { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";

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
export interface FarmCreateRequest extends GoatFarmFullRequest {}
