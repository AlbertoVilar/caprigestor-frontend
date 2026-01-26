import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

export const convertGenealogyToGoat = (dto: GoatGenealogyDTO): GoatResponseDTO => ({
  farmId: 0,
  registrationNumber: dto.animalPrincipal.registro,
  name: dto.animalPrincipal.nome,
  gender: dto.animalPrincipal.sexo === "MALE" ? "MACHO" : "FÊMEA",
  breed: dto.animalPrincipal.raca,
  color: dto.animalPrincipal.pelagem,
  birthDate: dto.animalPrincipal.dataNasc,
  status: dto.animalPrincipal.situacao.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ATIVO",
  category: dto.animalPrincipal.categoria,
  tod: dto.animalPrincipal.tod,
  toe: dto.animalPrincipal.toe,
  fatherName: dto.pai?.nome,
  motherName: dto.mae?.nome,
  ownerName: dto.animalPrincipal.proprietario,
  farmName: dto.animalPrincipal.criador,
});
