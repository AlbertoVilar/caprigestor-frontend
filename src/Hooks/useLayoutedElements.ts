import * as dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;

export function useLayoutedElements(nodes: Node[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  
  // Configuração modificada para inverter a hierarquia
  graph.setGraph({
  rankdir: 'BT' as 'TB', // finge que é 'TB' apenas para satisfazer o TS
  ranksep: 60,
  nodesep: 20
}); 

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    });
  });

  edges.forEach((edge) => {
    // Inverte a direção das arestas
    graph.setEdge(edge.target, edge.source); // Note a inversão aqui
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH/2,
        y: nodeWithPosition.y - NODE_HEIGHT/2
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT
      }
    };
  });
}