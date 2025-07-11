import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { Node, Edge } from "reactflow";

// Gera IDs únicos para cada papel na árvore
function createNodeId(base: string | undefined, suffix: string): string {
  return (base?.trim() || "XXXX") + `-${suffix}`;
}

export function convertGenealogyDTOToReactFlowData(
  dto: GoatGenealogyDTO
): { nodes: Node[]; edges: Edge[] } {
  const createNode = (
    id: string,
    name: string | undefined,
    relation: string,
    registration: string | undefined
  ): Node => ({
    id,
    type: "customNode",
    data: {
      name: name?.trim() || "XXXX",
      relation,
      registration: registration?.trim() || "XXXX",
    },
    position: { x: 0, y: 0 },
  });

  const createEdge = (source: string, target: string): Edge => ({
    id: `e-${source}-${target}`,
    source,
    target,
  });

  // IDs principais
  const goatId = dto.goatRegistration;
  const fatherId = createNodeId(dto.fatherRegistration, "pai");
  const motherId = createNodeId(dto.motherRegistration, "mae");

  const nodes: Node[] = [
    createNode(goatId, dto.goatName, "Animal", dto.goatRegistration),

    createNode(fatherId, dto.fatherName, "Pai", dto.fatherRegistration),
    createNode(motherId, dto.motherName, "Mãe", dto.motherRegistration),

    createNode(createNodeId(dto.paternalGrandfatherRegistration, "avoP1"), dto.paternalGrandfatherName, "Avô Paterno", dto.paternalGrandfatherRegistration),
    createNode(createNodeId(dto.paternalGrandmotherRegistration, "avoP2"), dto.paternalGrandmotherName, "Avó Paterna", dto.paternalGrandmotherRegistration),
    createNode(createNodeId(dto.maternalGrandfatherRegistration, "avoM1"), dto.maternalGrandfatherName, "Avô Materno", dto.maternalGrandfatherRegistration),
    createNode(createNodeId(dto.maternalGrandmotherRegistration, "avoM2"), dto.maternalGrandmotherName, "Avó Materna", dto.maternalGrandmotherRegistration),

    createNode(createNodeId(dto.paternalGreatGrandfather1Registration, "bisP1"), dto.paternalGreatGrandfather1Name, "Bisavô Paterno", dto.paternalGreatGrandfather1Registration),
    createNode(createNodeId(dto.paternalGreatGrandmother1Registration, "bisP2"), dto.paternalGreatGrandmother1Name, "Bisavó Paterna", dto.paternalGreatGrandmother1Registration),
    createNode(createNodeId(dto.paternalGreatGrandfather2Registration, "bisP3"), dto.paternalGreatGrandfather2Name, "Bisavô Paterno", dto.paternalGreatGrandfather2Registration),
    createNode(createNodeId(dto.paternalGreatGrandmother2Registration, "bisP4"), dto.paternalGreatGrandmother2Name, "Bisavó Paterna", dto.paternalGreatGrandmother2Registration),

    createNode(createNodeId(dto.maternalGreatGrandfather1Registration, "bisM1"), dto.maternalGreatGrandfather1Name, "Bisavô Materno", dto.maternalGreatGrandfather1Registration),
    createNode(createNodeId(dto.maternalGreatGrandmother1Registration, "bisM2"), dto.maternalGreatGrandmother1Name, "Bisavó Materna", dto.maternalGreatGrandmother1Registration),
    createNode(createNodeId(dto.maternalGreatGrandfather2Registration, "bisM3"), dto.maternalGreatGrandfather2Name, "Bisavô Materno", dto.maternalGreatGrandfather2Registration),
    createNode(createNodeId(dto.maternalGreatGrandmother2Registration, "bisM4"), dto.maternalGreatGrandmother2Name, "Bisavó Materna", dto.maternalGreatGrandmother2Registration),
  ];

  const edges: Edge[] = [
    createEdge(goatId, fatherId),
    createEdge(goatId, motherId),

    createEdge(fatherId, createNodeId(dto.paternalGrandfatherRegistration, "avoP1")),
    createEdge(fatherId, createNodeId(dto.paternalGrandmotherRegistration, "avoP2")),
    createEdge(motherId, createNodeId(dto.maternalGrandfatherRegistration, "avoM1")),
    createEdge(motherId, createNodeId(dto.maternalGrandmotherRegistration, "avoM2")),

    createEdge(createNodeId(dto.paternalGrandfatherRegistration, "avoP1"), createNodeId(dto.paternalGreatGrandfather1Registration, "bisP1")),
    createEdge(createNodeId(dto.paternalGrandfatherRegistration, "avoP1"), createNodeId(dto.paternalGreatGrandmother1Registration, "bisP2")),

    createEdge(createNodeId(dto.paternalGrandmotherRegistration, "avoP2"), createNodeId(dto.paternalGreatGrandfather2Registration, "bisP3")),
    createEdge(createNodeId(dto.paternalGrandmotherRegistration, "avoP2"), createNodeId(dto.paternalGreatGrandmother2Registration, "bisP4")),

    createEdge(createNodeId(dto.maternalGrandfatherRegistration, "avoM1"), createNodeId(dto.maternalGreatGrandfather1Registration, "bisM1")),
    createEdge(createNodeId(dto.maternalGrandfatherRegistration, "avoM1"), createNodeId(dto.maternalGreatGrandmother1Registration, "bisM2")),

    createEdge(createNodeId(dto.maternalGrandmotherRegistration, "avoM2"), createNodeId(dto.maternalGreatGrandfather2Registration, "bisM3")),
    createEdge(createNodeId(dto.maternalGrandmotherRegistration, "avoM2"), createNodeId(dto.maternalGreatGrandmother2Registration, "bisM4")),
  ];

  return { nodes, edges };
}
