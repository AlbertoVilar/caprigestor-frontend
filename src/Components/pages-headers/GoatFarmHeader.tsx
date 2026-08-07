// src/components/goat-farm-header/GoatFarmHeader.tsx

import "../../index.css"
import "./GoatFarmHeader.css";

interface Props {
  name: string;
  logoUrl?: string;
}

export default function GoatFarmHeader({
  name,
  logoUrl
}: Props) {
  return (
    <div className="goatfarm-header">
      {logoUrl ? (
        <img src={logoUrl} alt={`Logo ${name}`} className="farm-header-logo" />
      ) : (
        <span className="farm-header-icon">🐐</span>
      )}
      <div className="farm-header-content">
        <h2>{name}</h2>
      </div>

    </div>
  );
}
