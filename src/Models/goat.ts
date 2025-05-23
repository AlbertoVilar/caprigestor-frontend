export interface Goat {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: "MACHO" | "FÊMEA";
  birthDate: string;
  status: "ATIVO" | "INATIVO";
  category: string;
  toe: string;
  tod: string;
  farmName: string;
  ownerName: string;
  fatherName?: string;
  motherName?: string;
}

