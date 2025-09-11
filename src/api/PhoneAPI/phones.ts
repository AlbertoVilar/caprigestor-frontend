import { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import { requestBackEnd } from "../../utils/request";
import { CustomAPIError } from "../CustomError/CustomAPIError";

export async function createPhone(data: PhonesRequestDTO): Promise<number> {
  try {
    const response = await requestBackEnd({
      url: "/phones",
      method: "POST",
      data
    });
    
    return response.data.id;
  } catch (error: any) {
    const errorResponse: CustomAPIError = { 
      status: error.response?.status || 500, 
      message: error.response?.data || error.message 
    };
    throw errorResponse;
  }
}
