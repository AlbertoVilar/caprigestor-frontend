import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

export function convertResponseToRequest(goat: GoatResponseDTO): GoatRequestDTO {
  return {
    registrationNumber: goat.registrationNumber,
    name: goat.name,
    breed: goat.breed,
    color: goat.color,
    gender: goat.gender === "MACHO" ? "MALE" : goat.gender === "FÊMEA" ? "FEMALE" : goat.gender,
    birthDate: goat.birthDate,
    status: goat.status,
    category: goat.category,
    toe: goat.toe,
    tod: goat.tod,
    farmId: goat.farmId,
    ownerId: 0, // ❗precisa ser preenchido de alguma forma (busca adicional, etc.)
    fatherRegistrationNumber: goat.fatherRegistrationNumber,
    motherRegistrationNumber: goat.motherRegistrationNumber,
  };
}
