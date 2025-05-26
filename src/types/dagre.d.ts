declare module 'dagre' {
  export namespace graphlib {
    class Graph {
      setDefaultEdgeLabel(cb: () => Record<string, unknown>): void;
      setGraph(options: GraphOptions): void;
      setNode(id: string, node: { width: number; height: number }): void;
      setEdge(source: string, target: string): void;
      node(id: string): { x: number; y: number };
    }
    
    interface GraphOptions {
      rankdir?: 'TB' | 'LR';
      ranksep?: number;
      nodesep?: number;
    }
  }

  export function layout(graph: graphlib.Graph): void;
}