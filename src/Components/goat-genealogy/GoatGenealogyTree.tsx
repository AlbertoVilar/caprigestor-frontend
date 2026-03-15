import React, { useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
  NodeProps,
} from 'reactflow';

import 'reactflow/dist/style.css';
import './goatGenealogyTree.css';

import { useLayoutedElements as layoutElements } from '../../Hooks/useLayoutedElements';
import type { GoatGenealogyDTO } from '../../Models/goatGenealogyDTO';
import { convertGenealogyDTOToReactFlowData } from '../../Convertes/genealogies/convertGenealogyDTOToReactFlowData';

interface GoatGenealogyNodeData {
  name: string;
  relation: string;
  registration: string;
  source?: 'LOCAL' | 'ABCC' | 'AUSENTE';
}

const sourceLabelMap: Record<'LOCAL' | 'ABCC' | 'AUSENTE', string> = {
  LOCAL: 'LOCAL',
  ABCC: 'ABCC',
  AUSENTE: 'AUSENTE',
};

const CustomNode = ({ data }: NodeProps<GoatGenealogyNodeData>) => (
  <div className={`custom-node custom-node--${(data.source || 'LOCAL').toLowerCase()}`}>
    <div className="custom-node__header">
      <strong>{data.relation}</strong>
      {data.source && (
        <span className={`custom-node__badge custom-node__badge--${data.source.toLowerCase()}`}>
          {sourceLabelMap[data.source]}
        </span>
      )}
    </div>
    <div>{data.name}</div>
    <small>{data.registration}</small>
  </div>
);

const nodeTypes = { customNode: CustomNode };

export default function GoatGenealogyTree({ data }: { data: GoatGenealogyDTO }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertGenealogyDTOToReactFlowData(data),
    [data]
  );

  const layoutedNodes = useMemo(
    () => layoutElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [layoutedNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({
        padding: 0.34,
        duration: 280,
        maxZoom: 1.15,
        minZoom: 0.28,
      });
    }, 40);

    return () => window.clearTimeout(timer);
  }, [nodes.length, edges.length, data]);

  return (
    <div className="genealogy-tree-shell">
      <div className="genealogy-tree__legend" aria-label="Legenda da origem dos dados">
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--local">LOCAL</span>
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--abcc">ABCC</span>
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--ausente">AUSENTE</span>
      </div>

      <div style={{ width: '100%', height: '76vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flowInstanceRef.current = instance;
          }}
          fitView
          fitViewOptions={{ padding: 0.34 }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          nodesDraggable={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
