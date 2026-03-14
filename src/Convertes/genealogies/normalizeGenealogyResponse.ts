import type {
  GoatGenealogyDTO,
  GoatGenealogyIntegrationDTO,
  GoatGenealogyNodeDTO,
  GenealogyNodeSource,
} from "../../Models/goatGenealogyDTO";

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

const normalizeSource = (value: unknown): GenealogyNodeSource | undefined => {
  const source = toStringValue(value).toUpperCase().trim();
  if (source === "LOCAL" || source === "ABCC" || source === "AUSENTE") {
    return source as GenealogyNodeSource;
  }
  return undefined;
};

const toNode = (
  raw: unknown,
  fallbackRelationship: string,
  forceNode = false
): GoatGenealogyNodeDTO | undefined => {
  if (!raw || typeof raw !== "object") {
    if (!forceNode) {
      return undefined;
    }
    return {
      nome: "",
      registro: "",
      source: "AUSENTE",
      relationship: fallbackRelationship,
      localGoatId: null,
    };
  }

  const data = raw as Record<string, unknown>;
  const nome = toStringValue(data.name ?? data.nome);
  const registro = toStringValue(data.registrationNumber ?? data.registro);
  const source = normalizeSource(data.source) ?? (nome || registro ? "ABCC" : "AUSENTE");

  if (!forceNode && !nome && !registro && source === "AUSENTE") {
    return undefined;
  }

  return {
    nome,
    registro,
    source,
    localGoatId: toStringValue(data.localGoatId) || null,
    relationship: toStringValue(data.relationship) || fallbackRelationship,
  };
};

const toIntegration = (raw: unknown): GoatGenealogyIntegrationDTO | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const data = raw as Record<string, unknown>;
  const status = toStringValue(data.status).toUpperCase().trim();
  if (!status) {
    return undefined;
  }

  return {
    status: status as GoatGenealogyIntegrationDTO["status"],
    lookupKey: toStringValue(data.lookupKey),
    message: toStringValue(data.message),
  };
};

// Converte o response legado do backend para o GoatGenealogyDTO esperado pelo frontend
export function toGoatGenealogyDTO(raw: unknown): GoatGenealogyDTO {
  if (!raw || typeof raw !== "object") {
    return emptyGenealogy;
  }

  const data = raw as Record<string, unknown>;

  const isHybridResponse =
    typeof data.animalPrincipal === "object" &&
    data.animalPrincipal !== null &&
    (Object.prototype.hasOwnProperty.call(data, "integration") ||
      Object.prototype.hasOwnProperty.call(data, "bisavoPaternoPai") ||
      Object.prototype.hasOwnProperty.call(data, "pai"));

  if (isHybridResponse) {
    const principalNode = toNode(data.animalPrincipal, "animalPrincipal", true);

    return {
      animalPrincipal: {
        nome: principalNode?.nome ?? "",
        registro: principalNode?.registro ?? "",
        criador: toStringValue((data.animalPrincipal as Record<string, unknown>).criador),
        proprietario: toStringValue((data.animalPrincipal as Record<string, unknown>).proprietario),
        raca: toStringValue((data.animalPrincipal as Record<string, unknown>).raca),
        pelagem: toStringValue((data.animalPrincipal as Record<string, unknown>).pelagem),
        situacao: toStringValue((data.animalPrincipal as Record<string, unknown>).situacao),
        sexo: toStringValue((data.animalPrincipal as Record<string, unknown>).sexo),
        categoria: toStringValue((data.animalPrincipal as Record<string, unknown>).categoria),
        tod: toStringValue((data.animalPrincipal as Record<string, unknown>).tod),
        toe: toStringValue((data.animalPrincipal as Record<string, unknown>).toe),
        dataNasc: toStringValue((data.animalPrincipal as Record<string, unknown>).dataNasc),
        source: principalNode?.source,
        localGoatId: principalNode?.localGoatId,
        relationship: principalNode?.relationship,
      },
      pai: toNode(data.pai, "pai", true),
      mae: toNode(data.mae, "mae", true),
      avoPaterno: toNode(data.avoPaterno, "avoPaterno", true),
      avoPaterna: toNode(data.avoPaterna, "avoPaterna", true),
      avoMaterno: toNode(data.avoMaterno, "avoMaterno", true),
      avoMaterna: toNode(data.avoMaterna, "avoMaterna", true),
      bisavosPaternos: [
        toNode(data.bisavoPaternoPai, "Bisavô Paterno (pai)", true),
        toNode(data.bisavoPaternaPai, "Bisavó Paterna (pai)", true),
        toNode(data.bisavoPaternoMae, "Bisavô Paterno (mãe)", true),
        toNode(data.bisavoPaternaMae, "Bisavó Paterna (mãe)", true),
      ].map((node) => ({
        parentesco: node?.relationship || "",
        nome: node?.nome || "",
        registro: node?.registro || "",
        source: node?.source,
        localGoatId: node?.localGoatId,
      })),
      bisavosMaternos: [
        toNode(data.bisavoMaternoPai, "Bisavô Materno (pai)", true),
        toNode(data.bisavoMaternaPai, "Bisavó Materna (pai)", true),
        toNode(data.bisavoMaternoMae, "Bisavô Materno (mãe)", true),
        toNode(data.bisavoMaternaMae, "Bisavó Materna (mãe)", true),
      ].map((node) => ({
        parentesco: node?.relationship || "",
        nome: node?.nome || "",
        registro: node?.registro || "",
        source: node?.source,
        localGoatId: node?.localGoatId,
      })),
      integration: toIntegration(data.integration),
    };
  }

  // Suporta variações de nomes de campos (owner vs farmOwner)
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
      source: "LOCAL",
      localGoatId: toStringValue(data.goatRegistration ?? data.registrationNumber),
      relationship: "animalPrincipal",
    },
    pai:
      data.fatherName || data.fatherRegistration
        ? {
            nome: toStringValue(data.fatherName),
            registro: toStringValue(data.fatherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.fatherRegistration) || null,
            relationship: "pai",
          }
        : undefined,
    mae:
      data.motherName || data.motherRegistration
        ? {
            nome: toStringValue(data.motherName),
            registro: toStringValue(data.motherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.motherRegistration) || null,
            relationship: "mae",
          }
        : undefined,
    avoPaterno:
      data.paternalGrandfatherName || data.paternalGrandfatherRegistration
        ? {
            nome: toStringValue(data.paternalGrandfatherName),
            registro: toStringValue(data.paternalGrandfatherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.paternalGrandfatherRegistration) || null,
            relationship: "avoPaterno",
          }
        : undefined,
    avoPaterna:
      data.paternalGrandmotherName || data.paternalGrandmotherRegistration
        ? {
            nome: toStringValue(data.paternalGrandmotherName),
            registro: toStringValue(data.paternalGrandmotherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.paternalGrandmotherRegistration) || null,
            relationship: "avoPaterna",
          }
        : undefined,
    avoMaterno:
      data.maternalGrandfatherName || data.maternalGrandfatherRegistration
        ? {
            nome: toStringValue(data.maternalGrandfatherName),
            registro: toStringValue(data.maternalGrandfatherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.maternalGrandfatherRegistration) || null,
            relationship: "avoMaterno",
          }
        : undefined,
    avoMaterna:
      data.maternalGrandmotherName || data.maternalGrandmotherRegistration
        ? {
            nome: toStringValue(data.maternalGrandmotherName),
            registro: toStringValue(data.maternalGrandmotherRegistration),
            source: "LOCAL",
            localGoatId: toStringValue(data.maternalGrandmotherRegistration) || null,
            relationship: "avoMaterna",
          }
        : undefined,
    bisavosPaternos: [
      {
        parentesco: "Bisavô Paterno 1",
        nome: toStringValue(data.paternalGreatGrandfather1Name),
        registro: toStringValue(data.paternalGreatGrandfather1Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.paternalGreatGrandfather1Registration) || null,
      },
      {
        parentesco: "Bisavó Paterna 1",
        nome: toStringValue(data.paternalGreatGrandmother1Name),
        registro: toStringValue(data.paternalGreatGrandmother1Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.paternalGreatGrandmother1Registration) || null,
      },
      {
        parentesco: "Bisavô Paterno 2",
        nome: toStringValue(data.paternalGreatGrandfather2Name),
        registro: toStringValue(data.paternalGreatGrandfather2Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.paternalGreatGrandfather2Registration) || null,
      },
      {
        parentesco: "Bisavó Paterna 2",
        nome: toStringValue(data.paternalGreatGrandmother2Name),
        registro: toStringValue(data.paternalGreatGrandmother2Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.paternalGreatGrandmother2Registration) || null,
      },
    ].filter((b) => b.nome),
    bisavosMaternos: [
      {
        parentesco: "Bisavô Materno 1",
        nome: toStringValue(data.maternalGreatGrandfather1Name),
        registro: toStringValue(data.maternalGreatGrandfather1Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.maternalGreatGrandfather1Registration) || null,
      },
      {
        parentesco: "Bisavó Materna 1",
        nome: toStringValue(data.maternalGreatGrandmother1Name),
        registro: toStringValue(data.maternalGreatGrandmother1Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.maternalGreatGrandmother1Registration) || null,
      },
      {
        parentesco: "Bisavô Materno 2",
        nome: toStringValue(data.maternalGreatGrandfather2Name),
        registro: toStringValue(data.maternalGreatGrandfather2Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.maternalGreatGrandfather2Registration) || null,
      },
      {
        parentesco: "Bisavó Materna 2",
        nome: toStringValue(data.maternalGreatGrandmother2Name),
        registro: toStringValue(data.maternalGreatGrandmother2Registration),
        source: "LOCAL",
        localGoatId: toStringValue(data.maternalGreatGrandmother2Registration) || null,
      },
    ].filter((b) => b.nome),
  };

  return dto;
}
