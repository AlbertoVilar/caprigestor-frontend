import { AddressRequest } from "../../Models/AddressRequestDTO";
import { requestBackEnd } from "../../utils/request";

export async function createAddress(data: AddressRequest): Promise<number> {
  const response = await requestBackEnd({
    url: "/address",
    method: "POST",
    data
  });
  
  return response.data.id;
}
