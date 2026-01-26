
import type { UserUpdateRequest } from "./UserUpdateRequestDTO";
import type { AddressRequest } from "./AddressRequestDTO";
import type { PhonesRequestDTO } from "./PhoneRequestDTO";

// DTO de atualização da fazenda alinhado ao backend
export interface GoatFarmUpdateFarmDTO {
  name: string;
  tod: string;
  version?: number; // opcional para concorrência otimista
}

export interface GoatFarmUpdateRequest {
  user: UserUpdateRequest; // atualização de dados do proprietário
  address: AddressRequest; // dados do endereço
  phones: PhonesRequestDTO[]; // ao menos um telefone
  farm: GoatFarmUpdateFarmDTO; // apenas campos da fazenda + version
}


