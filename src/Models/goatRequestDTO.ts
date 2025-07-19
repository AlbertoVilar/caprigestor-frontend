export interface GoatRequestDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;

  // 🔄 agora aceita todos os valores que o backend entende
  status: "ATIVO" | "INACTIVE" | "DECEASED" | "SOLD";

  category: string;
  toe: string;
  tod: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  farmId: number;
  ownerId: number;
}
