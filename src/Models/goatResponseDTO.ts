export interface GoatResponseDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: "MALE" | "FEMALE" | "MACHO" | "FÊMEA";
  birthDate: string;

  // ✅ Adicione os status em inglês
  status: "ATIVO" | "INATIVO" | "VENDIDO" | "MORTO" | "INACTIVE" | "SOLD" | "DECEASED";

  category: string;
  toe: string;
  tod: string;
  farmId: number;
  farmName: string;
  ownerName: string;
  ownerId?: number; // ✅ adicione isso!
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
}
