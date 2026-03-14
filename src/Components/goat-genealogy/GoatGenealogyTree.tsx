import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  NodeProps,
} from 'reactflow';

import 'reactflow/dist/style.css';
import './goatGenealogyTree.css';

import { useLayoutedElements } from '../../Hooks/useLayoutedElements';
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

  const layoutedNodes = useLayoutedElements(initialNodes, initialEdges);
  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="genealogy-tree-shell">
      <div className="genealogy-tree__legend" aria-label="Legenda da origem dos dados">
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--local">LOCAL</span>
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--abcc">ABCC</span>
        <span className="genealogy-tree__legend-item genealogy-tree__legend-item--ausente">AUSENTE</span>
      </div>

      <div style={{ width: '100%', height: '80vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
