import FarmLogoImage from "../farm-logo/FarmLogoImage";
import "./GoatFarmHeader.css";

interface Props {
  name: string;
  logoUrl?: string;
}

export default function GoatFarmHeader({ name, logoUrl }: Props) {
  return (
    <div className="farm-context-header">
      <FarmLogoImage
        src={logoUrl}
        farmName={name}
        className="farm-context-header__logo"
      />
      <div className="farm-context-header__content">
        <h2>{name}</h2>
      </div>
    </div>
  );
}
