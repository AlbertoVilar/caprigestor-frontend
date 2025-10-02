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

  // IDs principais usando a nova estrutura
  const goatId = dto.animalPrincipal.registro;
  const fatherId = createNodeId(dto.pai?.registro, "pai");
  const motherId = createNodeId(dto.mae?.registro, "mae");

  const nodes: Node[] = [
    createNode(goatId, dto.animalPrincipal.nome, "Animal", dto.animalPrincipal.registro),
  ];

  // Adiciona pais se existirem
  if (dto.pai) {
    nodes.push(createNode(fatherId, dto.pai.nome, "Pai", dto.pai.registro));
  }
  if (dto.mae) {
    nodes.push(createNode(motherId, dto.mae.nome, "Mãe", dto.mae.registro));
  }

  // Adiciona avós se existirem
  if (dto.avoPaterno) {
    const avoPaternoId = createNodeId(dto.avoPaterno.registro, "avoP1");
    nodes.push(createNode(avoPaternoId, dto.avoPaterno.nome, "Avô Paterno", dto.avoPaterno.registro));
  }
  if (dto.avoPaterna) {
    const avoPaternaId = createNodeId(dto.avoPaterna.registro, "avoP2");
    nodes.push(createNode(avoPaternaId, dto.avoPaterna.nome, "Avó Paterna", dto.avoPaterna.registro));
  }
  if (dto.avoMaterno) {
    const avoMaternoId = createNodeId(dto.avoMaterno.registro, "avoM1");
    nodes.push(createNode(avoMaternoId, dto.avoMaterno.nome, "Avô Materno", dto.avoMaterno.registro));
  }
  if (dto.avoMaterna) {
    const avoMaternaId = createNodeId(dto.avoMaterna.registro, "avoM2");
    nodes.push(createNode(avoMaternaId, dto.avoMaterna.nome, "Avó Materna", dto.avoMaterna.registro));
  }

  // Adiciona bisavós paternos se existirem
  if (dto.bisavosPaternos) {
    dto.bisavosPaternos.forEach((bisavo, index) => {
      const bisavoId = createNodeId(bisavo.registro, `bisP${index + 1}`);
      nodes.push(createNode(bisavoId, bisavo.nome, bisavo.parentesco, bisavo.registro));
    });
  }

  // Adiciona bisavós maternos se existirem
  if (dto.bisavosMaternos) {
    dto.bisavosMaternos.forEach((bisavo, index) => {
      const bisavoId = createNodeId(bisavo.registro, `bisM${index + 1}`);
      nodes.push(createNode(bisavoId, bisavo.nome, bisavo.parentesco, bisavo.registro));
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

  // Conecta avós aos bisavós
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

  return { nodes, edges };
}
