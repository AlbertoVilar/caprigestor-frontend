import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatDTO } from "../../Models/goatResponseDTO";

export const convertGenealogyToGoat = (dto: GoatGenealogyDTO): GoatDTO => ({
  registrationNumber: dto.goatRegistration,
  name: dto.goatName,
  gender: dto.gender === "MALE" ? "MACHO" : "FÊMEA",
  breed: dto.breed,
  color: dto.color,
  birthDate: dto.birthDate,
  status: dto.status.toUpperCase() === "INATIVO" ? "INATIVO" : "ATIVO", // 👈 Aqui!
  category: dto.category,
  tod: dto.tod,
  toe: dto.toe,
  fatherName: dto.fatherName,
  motherName: dto.motherName,
  ownerName: dto.owner,       // ✅ Alberto Vilar
  farmName: dto.breeder,
});
