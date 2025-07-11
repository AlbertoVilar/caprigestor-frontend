export interface GoatRequestDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  status: "ATIVO" | "INATIVO";
  category: string;
  toe: string;
  tod: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  farmId: number;
  ownerId: number;
}
