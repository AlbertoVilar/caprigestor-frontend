import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { Node, Edge } from "reactflow";

export function convertGenealogyDTOToReactFlowData(
  dto: GoatGenealogyDTO
): { nodes: Node[]; edges: Edge[] } {
  
  const createNode = (
    id: string,
    name: string,
    relation: string,
    registration: string
  ): Node => ({
    id,
    type: "customNode",
    data: { name, relation, registration },
    position: { x: 0, y: 0 }
  });

  const createEdge = (source: string, target: string): Edge => ({
    id: `e-${source}-${target}`,
    source,
    target
  });

  // Nodes (mantém a mesma estrutura)
  const nodes: Node[] = [
    createNode(dto.goatRegistration, dto.goatName, "Animal", dto.goatRegistration),
    createNode(dto.fatherRegistration, dto.fatherName, "Pai", dto.fatherRegistration),
    createNode(dto.motherRegistration, dto.motherName, "Mãe", dto.motherRegistration),
    createNode(dto.paternalGrandfatherRegistration, dto.paternalGrandfatherName, "Avô Paterno", dto.paternalGrandfatherRegistration),
    createNode(dto.paternalGrandmotherRegistration, dto.paternalGrandmotherName, "Avó Paterna", dto.paternalGrandmotherRegistration),
    createNode(dto.maternalGrandfatherRegistration, dto.maternalGrandfatherName, "Avô Materno", dto.maternalGrandfatherRegistration),
    createNode(dto.maternalGrandmotherRegistration, dto.maternalGrandmotherName, "Avó Materna", dto.maternalGrandmotherRegistration),
    createNode(dto.paternalGreatGrandfather1Registration, dto.paternalGreatGrandfather1Name, "Bisavô Paterno", dto.paternalGreatGrandfather1Registration),
    createNode(dto.paternalGreatGrandmother1Registration, dto.paternalGreatGrandmother1Name, "Bisavó Paterna", dto.paternalGreatGrandmother1Registration),
    createNode(dto.paternalGreatGrandfather2Registration, dto.paternalGreatGrandfather2Name, "Bisavô Paterno", dto.paternalGreatGrandfather2Registration),
    createNode(dto.paternalGreatGrandmother2Registration, dto.paternalGreatGrandmother2Name, "Bisavó Paterna", dto.paternalGreatGrandmother2Registration),
    createNode(dto.maternalGreatGrandfather1Registration, dto.maternalGreatGrandfather1Name, "Bisavô Materno", dto.maternalGreatGrandfather1Registration),
    createNode(dto.maternalGreatGrandmother1Registration, dto.maternalGreatGrandmother1Name, "Bisavó Materna", dto.maternalGreatGrandmother1Registration),
    createNode(dto.maternalGreatGrandfather2Registration, dto.maternalGreatGrandfather2Name, "Bisavô Materno", dto.maternalGreatGrandfather2Registration),
    createNode(dto.maternalGreatGrandmother2Registration, dto.maternalGreatGrandmother2Name, "Bisavó Materna", dto.maternalGreatGrandmother2Registration)
  ];

  // Edges invertidas (agora apontam para cima)
  const edges: Edge[] = [
    // Animal conecta aos pais (invertido)
    createEdge(dto.goatRegistration, dto.fatherRegistration),
    createEdge(dto.goatRegistration, dto.motherRegistration),

    // Pais conectam aos avós
    createEdge(dto.fatherRegistration, dto.paternalGrandfatherRegistration),
    createEdge(dto.fatherRegistration, dto.paternalGrandmotherRegistration),
    createEdge(dto.motherRegistration, dto.maternalGrandfatherRegistration),
    createEdge(dto.motherRegistration, dto.maternalGrandmotherRegistration),

    // Avós conectam aos bisavós
    createEdge(dto.paternalGrandfatherRegistration, dto.paternalGreatGrandfather1Registration),
    createEdge(dto.paternalGrandfatherRegistration, dto.paternalGreatGrandmother1Registration),
    createEdge(dto.paternalGrandmotherRegistration, dto.paternalGreatGrandfather2Registration),
    createEdge(dto.paternalGrandmotherRegistration, dto.paternalGreatGrandmother2Registration),
    createEdge(dto.maternalGrandfatherRegistration, dto.maternalGreatGrandfather1Registration),
    createEdge(dto.maternalGrandfatherRegistration, dto.maternalGreatGrandmother1Registration),
    createEdge(dto.maternalGrandmotherRegistration, dto.maternalGreatGrandfather2Registration),
    createEdge(dto.maternalGrandmotherRegistration, dto.maternalGreatGrandmother2Registration)
  ];

  return { nodes, edges };
}