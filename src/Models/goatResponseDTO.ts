export interface GoatResponseDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: "MALE" | "FEMALE" | "MACHO" | "FÊMEA";
  birthDate: string;
  status: "ATIVO" | "INATIVO";
  category: string;
  toe: string;
  tod: string;
  farmId: number;
  farmName: string;
  ownerName: string;
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
}
