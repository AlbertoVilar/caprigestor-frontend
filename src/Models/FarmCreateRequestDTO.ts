import { UserProfile, OwnerCompatibility } from "./UserProfileDTO";
import { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";

export interface FarmCreateRequest {
  farm: {
    name: string;
    tod: string;
  };
  owner: OwnerCompatibility; // Mantém compatibilidade com estrutura existente
  address: AddressRequest;
  phones: PhonesRequestDTO[];
}
