import type { GoatGenealogyDTO, GenealogyNodeSource } from "../../Models/goatGenealogyDTO";
import type { Node, Edge } from "reactflow";

// Gera IDs únicos para cada papel na árvore
function createNodeId(base: string | undefined, suffix: string): string {
  return (base?.trim() || "XXXX") + `-${suffix}`;
}

function getNodeDisplayName(name: string | undefined, source?: GenealogyNodeSource): string {
  const normalized = name?.trim();
  if (normalized) {
    return normalized;
  }
  return source === "AUSENTE" ? "Não informado" : "XXXX";
}

function getNodeDisplayRegistration(registration: string | undefined, source?: GenealogyNodeSource): string {
  const normalized = registration?.trim();
  if (normalized) {
    return normalized;
  }
  return source === "AUSENTE" ? "-" : "XXXX";
}

function getRelationLabel(relation: string | undefined): string {
  const raw = (relation || "").trim();
  if (!raw) {
    return "";
  }

  const relationMap: Record<string, string> = {
    animalPrincipal: "Animal principal",
    pai: "Pai",
    mae: "Mãe",
    avoPaterno: "Avô paterno",
    avoPaterna: "Avó paterna",
    avoMaterno: "Avô materno",
    avoMaterna: "Avó materna",
    bisavoPaternoPai: "Bisavô paterno (pai)",
    bisavoPaternaPai: "Bisavó paterna (pai)",
    bisavoPaternoMae: "Bisavô paterno (mãe)",
    bisavoPaternaMae: "Bisavó paterna (mãe)",
    bisavoMaternoPai: "Bisavô materno (pai)",
    bisavoMaternaPai: "Bisavó materna (pai)",
    bisavoMaternoMae: "Bisavô materno (mãe)",
    bisavoMaternaMae: "Bisavó materna (mãe)",
  };

  return relationMap[raw] ?? raw;
}

export function convertGenealogyDTOToReactFlowData(
  dto: GoatGenealogyDTO
): { nodes: Node[]; edges: Edge[] } {
  const createNode = (
    id: string,
    name: string | undefined,
    relation: string,
    registration: string | undefined,
    source?: GenealogyNodeSource,
    extraData?: Record<string, unknown>
  ): Node => ({
    id,
    type: "customNode",
    data: {
      name: getNodeDisplayName(name, source),
      relation: getRelationLabel(relation),
      registration: getNodeDisplayRegistration(registration, source),
      source,
      ...extraData,
    },
    position: { x: 0, y: 0 },
  });

  const createEdge = (source: string, target: string): Edge => ({
    id: `e-${source}-${target}`,
    source,
    target,
  });

  // Validação segura e IDs principais com fallback
  if (!dto || !dto.animalPrincipal) {
    return { nodes: [], edges: [] };
  }

  const goatId = createNodeId(dto.animalPrincipal?.registro, "principal");
  const fatherId = dto.pai ? createNodeId(dto.pai?.registro, "pai") : createNodeId(undefined, "pai");
  const motherId = dto.mae ? createNodeId(dto.mae?.registro, "mae") : createNodeId(undefined, "mae");

  const nodes: Node[] = [
    createNode(
      goatId,
      dto.animalPrincipal.nome,
      "Animal Principal",
      dto.animalPrincipal.registro,
      dto.animalPrincipal.source,
      {
        criador: dto.animalPrincipal.criador,
        proprietario: dto.animalPrincipal.proprietario,
        raca: dto.animalPrincipal.raca,
        pelagem: dto.animalPrincipal.pelagem,
        situacao: dto.animalPrincipal.situacao,
        sexo: dto.animalPrincipal.sexo,
        categoria: dto.animalPrincipal.categoria,
        tod: dto.animalPrincipal.tod,
        toe: dto.animalPrincipal.toe,
        dataNasc: dto.animalPrincipal.dataNasc,
      }
    ),
  ];

  // Adiciona pais se existirem
  if (dto.pai) {
    nodes.push(createNode(fatherId, dto.pai.nome, "Pai", dto.pai.registro, dto.pai.source));
  }
  if (dto.mae) {
    nodes.push(createNode(motherId, dto.mae.nome, "Mãe", dto.mae.registro, dto.mae.source));
  }

  // Adiciona avós se existirem
  if (dto.avoPaterno) {
    const avoPaternoId = createNodeId(dto.avoPaterno.registro, "avoP1");
    nodes.push(createNode(avoPaternoId, dto.avoPaterno.nome, "Avô Paterno", dto.avoPaterno.registro, dto.avoPaterno.source));
  }
  if (dto.avoPaterna) {
    const avoPaternaId = createNodeId(dto.avoPaterna.registro, "avoP2");
    nodes.push(createNode(avoPaternaId, dto.avoPaterna.nome, "Avó Paterna", dto.avoPaterna.registro, dto.avoPaterna.source));
  }
  if (dto.avoMaterno) {
    const avoMaternoId = createNodeId(dto.avoMaterno.registro, "avoM1");
    nodes.push(createNode(avoMaternoId, dto.avoMaterno.nome, "Avô Materno", dto.avoMaterno.registro, dto.avoMaterno.source));
  }
  if (dto.avoMaterna) {
    const avoMaternaId = createNodeId(dto.avoMaterna.registro, "avoM2");
    nodes.push(createNode(avoMaternaId, dto.avoMaterna.nome, "Avó Materna", dto.avoMaterna.registro, dto.avoMaterna.source));
  }

  // Adiciona bisavós paternos se existirem
  if (dto.bisavosPaternos) {
    dto.bisavosPaternos.forEach((bisavo, index) => {
      const bisavoId = createNodeId(bisavo.registro, `bisP${index + 1}`);
      nodes.push(createNode(bisavoId, bisavo.nome, bisavo.parentesco, bisavo.registro, bisavo.source));
    });
  }

  // Adiciona bisavós maternos se existirem
  if (dto.bisavosMaternos) {
    dto.bisavosMaternos.forEach((bisavo, index) => {
      const bisavoId = createNodeId(bisavo.registro, `bisM${index + 1}`);
      nodes.push(createNode(bisavoId, bisavo.nome, bisavo.parentesco, bisavo.registro, bisavo.source));
    });
  }

  // Cria as conexões (edges)
  const edges: Edge[] = [];

  // Conecta animal principal aos pais
  if (dto.pai) {
    edges.push(createEdge(goatId, fatherId));
  }
  if (dto.mae) {
    edges.push(createEdge(goatId, motherId));
  }

  // Conecta pais aos avós
  if (dto.pai && dto.avoPaterno) {
    edges.push(createEdge(fatherId, createNodeId(dto.avoPaterno.registro, "avoP1")));
  }
  if (dto.pai && dto.avoPaterna) {
    edges.push(createEdge(fatherId, createNodeId(dto.avoPaterna.registro, "avoP2")));
  }
  if (dto.mae && dto.avoMaterno) {
    edges.push(createEdge(motherId, createNodeId(dto.avoMaterno.registro, "avoM1")));
  }
  if (dto.mae && dto.avoMaterna) {
    edges.push(createEdge(motherId, createNodeId(dto.avoMaterna.registro, "avoM2")));
  }

  const hasFixedBisavos = Boolean(dto.integration && dto.bisavosPaternos?.length === 4 && dto.bisavosMaternos?.length === 4);

  if (hasFixedBisavos) {
    if (dto.avoPaterno && dto.bisavosPaternos) {
      const avoPaterno = createNodeId(dto.avoPaterno.registro, "avoP1");
      edges.push(createEdge(avoPaterno, createNodeId(dto.bisavosPaternos[0]?.registro, "bisP1")));
      edges.push(createEdge(avoPaterno, createNodeId(dto.bisavosPaternos[1]?.registro, "bisP2")));
    }
    if (dto.avoPaterna && dto.bisavosPaternos) {
      const avoPaterna = createNodeId(dto.avoPaterna.registro, "avoP2");
      edges.push(createEdge(avoPaterna, createNodeId(dto.bisavosPaternos[2]?.registro, "bisP3")));
      edges.push(createEdge(avoPaterna, createNodeId(dto.bisavosPaternos[3]?.registro, "bisP4")));
    }
    if (dto.avoMaterno && dto.bisavosMaternos) {
      const avoMaterno = createNodeId(dto.avoMaterno.registro, "avoM1");
      edges.push(createEdge(avoMaterno, createNodeId(dto.bisavosMaternos[0]?.registro, "bisM1")));
      edges.push(createEdge(avoMaterno, createNodeId(dto.bisavosMaternos[1]?.registro, "bisM2")));
    }
    if (dto.avoMaterna && dto.bisavosMaternos) {
      const avoMaterna = createNodeId(dto.avoMaterna.registro, "avoM2");
      edges.push(createEdge(avoMaterna, createNodeId(dto.bisavosMaternos[2]?.registro, "bisM3")));
      edges.push(createEdge(avoMaterna, createNodeId(dto.bisavosMaternos[3]?.registro, "bisM4")));
    }
  } else {
    // Compatibilidade com estrutura antiga
    if (dto.avoPaterno && dto.bisavosPaternos) {
      const avoPaterno = createNodeId(dto.avoPaterno.registro, "avoP1");
      dto.bisavosPaternos.forEach((bisavo, index) => {
        if (bisavo.parentesco.includes("Paterno")) {
          edges.push(createEdge(avoPaterno, createNodeId(bisavo.registro, `bisP${index + 1}`)));
        }
      });
    }

    if (dto.avoPaterna && dto.bisavosPaternos) {
      const avoPaterna = createNodeId(dto.avoPaterna.registro, "avoP2");
      dto.bisavosPaternos.forEach((bisavo, index) => {
        if (bisavo.parentesco.includes("Paterna")) {
          edges.push(createEdge(avoPaterna, createNodeId(bisavo.registro, `bisP${index + 1}`)));
        }
      });
    }

    if (dto.avoMaterno && dto.bisavosMaternos) {
      const avoMaterno = createNodeId(dto.avoMaterno.registro, "avoM1");
      dto.bisavosMaternos.forEach((bisavo, index) => {
        if (bisavo.parentesco.includes("Materno")) {
          edges.push(createEdge(avoMaterno, createNodeId(bisavo.registro, `bisM${index + 1}`)));
        }
      });
    }

    if (dto.avoMaterna && dto.bisavosMaternos) {
      const avoMaterna = createNodeId(dto.avoMaterna.registro, "avoM2");
      dto.bisavosMaternos.forEach((bisavo, index) => {
        if (bisavo.parentesco.includes("Materna")) {
          edges.push(createEdge(avoMaterna, createNodeId(bisavo.registro, `bisM${index + 1}`)));
        }
      });
    }
  }

  return { nodes, edges };
}
