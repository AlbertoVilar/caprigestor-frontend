import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

export function convertResponseToRequest(goat: GoatResponseDTO): GoatRequestDTO {
  // 🔁 Mapas para conversão
  const genderMap: Record<string, "MALE" | "FEMALE"> = {
    MACHO: "MALE",
    "FÊMEA": "FEMALE",
    MALE: "MALE",
    FEMALE: "FEMALE",
  };

  const statusMap: Record<string, GoatRequestDTO["status"]> = {
    ATIVO: "ATIVO",
    INATIVO: "INACTIVE",
    VENDIDO: "SOLD",
    MORTO: "DECEASED",
    INACTIVE: "INACTIVE",
    SOLD: "SOLD",
    DECEASED: "DECEASED",
  };

  return {
    registrationNumber: goat.registrationNumber,
    name: goat.name,
    breed: goat.breed,
    color: goat.color,
    gender: genderMap[goat.gender] ?? "FEMALE",
    birthDate: goat.birthDate,
    status: statusMap[goat.status] ?? "ATIVO",
    category: goat.category,
    toe: goat.toe,
    tod: goat.tod,
    farmId: goat.farmId,
    ownerId: (goat)["ownerId"] ?? 0, // temporário até refinar o tipo
    fatherRegistrationNumber: goat.fatherRegistrationNumber,
    motherRegistrationNumber: goat.motherRegistrationNumber,
  };
}
