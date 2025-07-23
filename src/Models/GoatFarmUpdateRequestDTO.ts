
import type { OwnerRequest } from "./OwnerRequestDTO";
import type { AddressRequest } from "./AddressRequestDTO";
import { PhonesRequestDTO } from "./PhoneRequestDTO";


export interface GoatFarmUpdateRequest {
  owner: OwnerRequest;
  address: AddressRequest;
  phones: PhonesRequestDTO[];
  farm: {
    name: string;
    tod: string;
    ownerId: number;
    addressId: number;
    phoneIds: number[];
  };
}


