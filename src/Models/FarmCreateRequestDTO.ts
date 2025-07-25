import { OwnerRequest } from "./OwnerRequestDTO";
import { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";

export interface FarmCreateRequest {
  farm: {
    name: string;
    tod: string;
  };
  owner: OwnerRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
}
