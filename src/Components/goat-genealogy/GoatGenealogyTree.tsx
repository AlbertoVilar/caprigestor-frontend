import { useRef, useEffect, useState } from "react";
import FamilyTree from "react-family-tree";
import type { TreeNode } from "../../Models/treeNode";
import GoatNode from "./GoatNode";

import "./goatGenealogy.css"; // Crie um CSS para ajustar o layout

interface Props {
  nodes: TreeNode[];
}

export default function GoatGenealogyTree({ nodes }: Props) {
  const treeRef = useRef<HTMLDivElement>(null);
  const [rootId, setRootId] = useState<string | null>(null);

  useEffect(() => {
    // Define o nó raiz (a cabra principal)
    if (nodes.length > 0) {
      const root = nodes.find((node) => !node.parentId);
      setRootId(root?.id ?? null);
    }
  }, [nodes]);

  return (
    <div ref={treeRef} className="goat-tree-container">
      {rootId && (
        <FamilyTree
          nodes={nodes}
          rootId={rootId}
          width={220}
          height={100}
          gap={20}
          renderNode={(node) => <GoatNode node={node} />}
        />
      )}
    </div>
  );
}
