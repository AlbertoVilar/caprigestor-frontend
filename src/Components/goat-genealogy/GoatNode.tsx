import type { TreeNode } from "../../Models/treeNode";

import "./goatGenealogy.css";

interface Props {
  node: TreeNode;
}

export default function GoatNode({ node }: Props) {
  return (
    <div className="goat-node">
      <div className="goat-node-relation">{node.relation}</div>
      <div className="goat-node-name">{node.name}</div>
      <div className="goat-node-reg">{node.registration}</div>
    </div>
  );
}
