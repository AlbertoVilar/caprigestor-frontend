import { useEffect, useState } from "react";
import {
  DEFAULT_FARM_IMAGE,
  getFarmLogoByName,
  resolveFarmLogoSource,
} from "./farmLogoSources";

interface FarmLogoImageProps {
  farmName: string;
  src?: string | null;
  className?: string;
}

export default function FarmLogoImage({
  farmName,
  src,
  className,
}: FarmLogoImageProps) {
  const [resolvedSource, setResolvedSource] = useState(resolveFarmLogoSource(src, farmName));
  const isFallback = resolvedSource === DEFAULT_FARM_IMAGE;

  useEffect(() => {
    setResolvedSource(resolveFarmLogoSource(src, farmName));
  }, [farmName, src]);

  return (
    <img
      src={resolvedSource}
      alt={isFallback ? `Imagem padrão da fazenda ${farmName}` : `Logo da fazenda ${farmName}`}
      className={className}
      data-fallback={isFallback}
      onError={() => {
        const farmLogo = getFarmLogoByName(farmName);
        if (farmLogo && resolvedSource !== farmLogo) {
          setResolvedSource(farmLogo);
        } else if (!isFallback) {
          setResolvedSource(DEFAULT_FARM_IMAGE);
        }
      }}
    />
  );
}
