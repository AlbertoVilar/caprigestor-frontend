import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";

const emptyGenealogy: GoatGenealogyDTO = {
  animalPrincipal: {
    nome: "",
    registro: "",
    criador: "",
    proprietario: "",
    raca: "",
    pelagem: "",
    situacao: "",
    sexo: "",
    categoria: "",
    tod: "",
    toe: "",
    dataNasc: "",
  },
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
};

// Converte o response legado do backend para o GoatGenealogyDTO esperado pelo frontend
export function toGoatGenealogyDTO(raw: unknown): GoatGenealogyDTO {
  if (!raw || typeof raw !== "object") {
    return emptyGenealogy;
  }

  const data = raw as Record<string, unknown>;

  // Suporta variaÃ§Ãµes de nomes de campos (owner vs farmOwner)
  const owner = data.owner ?? data.farmOwner ?? "";

  const dto: GoatGenealogyDTO = {
    animalPrincipal: {
      nome: toStringValue(data.goatName ?? data.name),
      registro: toStringValue(data.goatRegistration ?? data.registrationNumber),
      criador: toStringValue(data.breeder ?? data.farmName),
      proprietario: toStringValue(owner),
      raca: toStringValue(data.breed),
      pelagem: toStringValue(data.color),
      situacao: toStringValue(data.status),
      sexo: toStringValue(data.gender),
      categoria: toStringValue(data.category),
      tod: toStringValue(data.tod),
      toe: toStringValue(data.toe),
      dataNasc: toStringValue(data.birthDate ?? data.birthdate),
    },
    pai:
      data.fatherName || data.fatherRegistration
        ? {
            nome: toStringValue(data.fatherName),
            registro: toStringValue(data.fatherRegistration),
          }
        : undefined,
    mae:
      data.motherName || data.motherRegistration
        ? {
            nome: toStringValue(data.motherName),
            registro: toStringValue(data.motherRegistration),
          }
        : undefined,
    avoPaterno:
      data.paternalGrandfatherName || data.paternalGrandfatherRegistration
        ? {
            nome: toStringValue(data.paternalGrandfatherName),
            registro: toStringValue(data.paternalGrandfatherRegistration),
          }
        : undefined,
    avoPaterna:
      data.paternalGrandmotherName || data.paternalGrandmotherRegistration
        ? {
            nome: toStringValue(data.paternalGrandmotherName),
            registro: toStringValue(data.paternalGrandmotherRegistration),
          }
        : undefined,
    avoMaterno:
      data.maternalGrandfatherName || data.maternalGrandfatherRegistration
        ? {
            nome: toStringValue(data.maternalGrandfatherName),
            registro: toStringValue(data.maternalGrandfatherRegistration),
          }
        : undefined,
    avoMaterna:
      data.maternalGrandmotherName || data.maternalGrandmotherRegistration
        ? {
            nome: toStringValue(data.maternalGrandmotherName),
            registro: toStringValue(data.maternalGrandmotherRegistration),
          }
        : undefined,
    bisavosPaternos: [
      {
        parentesco: "BisavÃ´ Paterno 1",
        nome: toStringValue(data.paternalGreatGrandfather1Name),
        registro: toStringValue(data.paternalGreatGrandfather1Registration),
      },
      {
        parentesco: "BisavÃ³ Paterna 1",
        nome: toStringValue(data.paternalGreatGrandmother1Name),
        registro: toStringValue(data.paternalGreatGrandmother1Registration),
      },
      {
        parentesco: "BisavÃ´ Paterno 2",
        nome: toStringValue(data.paternalGreatGrandfather2Name),
        registro: toStringValue(data.paternalGreatGrandfather2Registration),
      },
      {
        parentesco: "BisavÃ³ Paterna 2",
        nome: toStringValue(data.paternalGreatGrandmother2Name),
        registro: toStringValue(data.paternalGreatGrandmother2Registration),
      },
    ].filter((b) => b.nome),
    bisavosMaternos: [
      {
        parentesco: "BisavÃ´ Materno 1",
        nome: toStringValue(data.maternalGreatGrandfather1Name),
        registro: toStringValue(data.maternalGreatGrandfather1Registration),
      },
      {
        parentesco: "BisavÃ³ Materna 1",
        nome: toStringValue(data.maternalGreatGrandmother1Name),
        registro: toStringValue(data.maternalGreatGrandmother1Registration),
      },
      {
        parentesco: "BisavÃ´ Materno 2",
        nome: toStringValue(data.maternalGreatGrandfather2Name),
        registro: toStringValue(data.maternalGreatGrandfather2Registration),
      },
      {
        parentesco: "BisavÃ³ Materna 2",
        nome: toStringValue(data.maternalGreatGrandmother2Name),
        registro: toStringValue(data.maternalGreatGrandmother2Registration),
      },
    ].filter((b) => b.nome),
  };

  return dto;
}
