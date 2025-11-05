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
}

const CustomNode = ({ data }: NodeProps<GoatGenealogyNodeData>) => (
  <div className="custom-node">
    <strong>{data.relation}</strong>
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
    <div style={{ width: '100%', height: '80vh' }}>  {/* Reduzido de 100vh para 80vh */}
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
        {/* <MiniMap />  ❌ Removido para não atrapalhar a visualização */}
        <Controls />
      </ReactFlow>
    </div>
  );
}
