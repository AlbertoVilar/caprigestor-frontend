import type {
  FarmGoatRegistryHistoricalGenealogyDTO,
  FarmGoatRegistryHistoricalGenealogyNodeDTO,
} from "../../../Models/FarmGoatHistoricalDossierDTOs";
import type { GoatGenealogyDTO, GoatGenealogyNodeDTO } from "../../../Models/goatGenealogyDTO";

function mapNode(
  node: FarmGoatRegistryHistoricalGenealogyNodeDTO | null | undefined,
  fallbackRelationship: string
): GoatGenealogyNodeDTO {
  if (!node) {
    return {
      nome: "",
      registro: "",
      source: "AUSENTE",
      relationship: fallbackRelationship,
      localGoatId: null,
    };
  }

  return {
    nome: node.name ?? "",
    registro: node.registrationNumber ?? "",
    source: node.source,
    relationship: node.relationship || fallbackRelationship,
    localGoatId: node.localTechnicalGoatId != null ? String(node.localTechnicalGoatId) : null,
  };
}

export function adaptHistoricalGenealogyToPresentational(
  dto: FarmGoatRegistryHistoricalGenealogyDTO
): GoatGenealogyDTO {
  const principal = mapNode(dto.animalPrincipal, "animalPrincipal");

  return {
    animalPrincipal: {
      nome: principal.nome,
      registro: principal.registro,
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
      source: principal.source,
      localGoatId: principal.localGoatId,
      relationship: principal.relationship,
    },
    pai: mapNode(dto.pai, "pai"),
    mae: mapNode(dto.mae, "mae"),
    avoPaterno: mapNode(dto.avoPaterno, "avoPaterno"),
    avoPaterna: mapNode(dto.avoPaterna, "avoPaterna"),
    avoMaterno: mapNode(dto.avoMaterno, "avoMaterno"),
    avoMaterna: mapNode(dto.avoMaterna, "avoMaterna"),
    bisavosPaternos: [
      mapNode(dto.bisavoPaternoPai, "Bisavô Paterno (pai)"),
      mapNode(dto.bisavoPaternaPai, "Bisavó Paterna (pai)"),
      mapNode(dto.bisavoPaternoMae, "Bisavô Paterno (mãe)"),
      mapNode(dto.bisavoPaternaMae, "Bisavó Paterna (mãe)"),
    ].map((n) => ({
      parentesco: n.relationship || "",
      nome: n.nome,
      registro: n.registro,
      source: n.source,
      localGoatId: n.localGoatId,
    })),
    bisavosMaternos: [
      mapNode(dto.bisavoMaternoPai, "Bisavô Materno (pai)"),
      mapNode(dto.bisavoMaternaPai, "Bisavó Materna (pai)"),
      mapNode(dto.bisavoMaternoMae, "Bisavô Materno (mãe)"),
      mapNode(dto.bisavoMaternaMae, "Bisavó Materna (mãe)"),
    ].map((n) => ({
      parentesco: n.relationship || "",
      nome: n.nome,
      registro: n.registro,
      source: n.source,
      localGoatId: n.localGoatId,
    })),
    integration: dto.integration
      ? {
          status: dto.integration.status,
          lookupKey: dto.integration.lookupKey ?? "",
          message: dto.integration.message ?? "",
        }
      : undefined,
  };
}
