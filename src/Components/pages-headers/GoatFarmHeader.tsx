// src/components/goat-farm-header/GoatFarmHeader.tsx

import "../../index.css"
import "./GoatFarmHeader.css";

interface Props {
  name: string;
}

export default function GoatFarmHeader({ name }: Props) {
  return (
    <div className=".content goatfarm-header">
      <h2>🐐 {name}</h2>
    </div>
  );
}
