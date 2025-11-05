import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";

// Converte o response legado do backend para o GoatGenealogyDTO esperado pelo frontend
export function toGoatGenealogyDTO(raw: any): GoatGenealogyDTO {
  if (!raw || typeof raw !== "object") {
    // Retorna estrutura mínima para evitar que o conversor quebre
    return {
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
  }

  // Suporta variações de nomes de campos (owner vs farmOwner)
  const owner = raw.owner ?? raw.farmOwner ?? "";

  const dto: GoatGenealogyDTO = {
    animalPrincipal: {
      nome: raw.goatName ?? raw.name ?? "",
      registro: raw.goatRegistration ?? raw.registrationNumber ?? "",
      criador: raw.breeder ?? raw.farmName ?? "",
      proprietario: owner,
      raca: raw.breed ?? "",
      pelagem: raw.color ?? "",
      situacao: raw.status ?? "",
      sexo: raw.gender ?? "",
      categoria: raw.category ?? "",
      tod: raw.tod ?? "",
      toe: raw.toe ?? "",
      dataNasc: raw.birthDate ?? raw.birthdate ?? "",
    },
    pai: raw.fatherName || raw.fatherRegistration ? {
      nome: raw.fatherName ?? "",
      registro: raw.fatherRegistration ?? "",
    } : undefined,
    mae: raw.motherName || raw.motherRegistration ? {
      nome: raw.motherName ?? "",
      registro: raw.motherRegistration ?? "",
    } : undefined,
    avoPaterno: raw.paternalGrandfatherName || raw.paternalGrandfatherRegistration ? {
      nome: raw.paternalGrandfatherName ?? "",
      registro: raw.paternalGrandfatherRegistration ?? "",
    } : undefined,
    avoPaterna: raw.paternalGrandmotherName || raw.paternalGrandmotherRegistration ? {
      nome: raw.paternalGrandmotherName ?? "",
      registro: raw.paternalGrandmotherRegistration ?? "",
    } : undefined,
    avoMaterno: raw.maternalGrandfatherName || raw.maternalGrandfatherRegistration ? {
      nome: raw.maternalGrandfatherName ?? "",
      registro: raw.maternalGrandfatherRegistration ?? "",
    } : undefined,
    avoMaterna: raw.maternalGrandmotherName || raw.maternalGrandmotherRegistration ? {
      nome: raw.maternalGrandmotherName ?? "",
      registro: raw.maternalGrandmotherRegistration ?? "",
    } : undefined,
    bisavosPaternos: [
      {
        parentesco: "Bisavô Paterno 1",
        nome: raw.paternalGreatGrandfather1Name ?? "",
        registro: raw.paternalGreatGrandfather1Registration ?? "",
      },
      {
        parentesco: "Bisavó Paterna 1",
        nome: raw.paternalGreatGrandmother1Name ?? "",
        registro: raw.paternalGreatGrandmother1Registration ?? "",
      },
      {
        parentesco: "Bisavô Paterno 2",
        nome: raw.paternalGreatGrandfather2Name ?? "",
        registro: raw.paternalGreatGrandfather2Registration ?? "",
      },
      {
        parentesco: "Bisavó Paterna 2",
        nome: raw.paternalGreatGrandmother2Name ?? "",
        registro: raw.paternalGreatGrandmother2Registration ?? "",
      },
    ].filter(b => b.nome),
    bisavosMaternos: [
      {
        parentesco: "Bisavô Materno 1",
        nome: raw.maternalGreatGrandfather1Name ?? "",
        registro: raw.maternalGreatGrandfather1Registration ?? "",
      },
      {
        parentesco: "Bisavó Materna 1",
        nome: raw.maternalGreatGrandmother1Name ?? "",
        registro: raw.maternalGreatGrandmother1Registration ?? "",
      },
      {
        parentesco: "Bisavô Materno 2",
        nome: raw.maternalGreatGrandfather2Name ?? "",
        registro: raw.maternalGreatGrandfather2Registration ?? "",
      },
      {
        parentesco: "Bisavó Materna 2",
        nome: raw.maternalGreatGrandmother2Name ?? "",
        registro: raw.maternalGreatGrandmother2Registration ?? "",
      },
    ].filter(b => b.nome),
  };

  return dto;
}