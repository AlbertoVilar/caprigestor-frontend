import { useEffect, useState } from "react";

export const DEFAULT_FARM_IMAGE = "/farm-placeholder.svg";

interface FarmLogoImageProps {
  farmName: string;
  src?: string | null;
  className?: string;
}

const getInitialSource = (src?: string | null) => src?.trim() || DEFAULT_FARM_IMAGE;

export default function FarmLogoImage({
  farmName,
  src,
  className,
}: FarmLogoImageProps) {
  const [resolvedSource, setResolvedSource] = useState(getInitialSource(src));
  const isFallback = resolvedSource === DEFAULT_FARM_IMAGE;

  useEffect(() => {
    setResolvedSource(getInitialSource(src));
  }, [src]);

  return (
    <img
      src={resolvedSource}
      alt={isFallback ? `Imagem padrão da fazenda ${farmName}` : `Logo da fazenda ${farmName}`}
      className={className}
      data-fallback={isFallback}
      onError={() => {
        if (!isFallback) setResolvedSource(DEFAULT_FARM_IMAGE);
      }}
    />
  );
}
