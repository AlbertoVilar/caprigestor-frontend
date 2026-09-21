import { Link, useLocation } from "react-router-dom";
import { buildFarmGoatRegistryPath, buildFarmGoatsPath } from "../../utils/appRoutes";
import "./FarmAnimalViewSwitcher.css";

interface Props {
  farmId: number;
}

/**
 * Keeps the current herd and the farm's historical registry discoverable
 * without merging their domain meaning into one dataset.
 */
export default function FarmAnimalViewSwitcher({ farmId }: Props) {
  const location = useLocation();
  const currentHerdPath = buildFarmGoatsPath(farmId);
  const registryPath = buildFarmGoatRegistryPath(farmId);
  const showingRegistry = location.pathname === registryPath;

  return (
    <nav className="farm-animal-view-switcher" aria-label="Visões dos animais">
      <Link
        to={currentHerdPath}
        className={`farm-animal-view-switcher__link ${!showingRegistry ? "is-active" : ""}`}
        aria-current={!showingRegistry ? "page" : undefined}
      >
        <span className="farm-animal-view-switcher__label">Rebanho atual</span>
        <span className="farm-animal-view-switcher__description">
          Animais atualmente pertencentes a esta fazenda
        </span>
      </Link>
      <Link
        to={registryPath}
        className={`farm-animal-view-switcher__link ${showingRegistry ? "is-active" : ""}`}
        aria-current={showingRegistry ? "page" : undefined}
      >
        <span className="farm-animal-view-switcher__label">Registro da fazenda</span>
        <span className="farm-animal-view-switcher__description">
          Inclui animais vendidos, transferidos e históricos
        </span>
      </Link>
    </nav>
  );
}
