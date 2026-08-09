export const DEFAULT_FARM_IMAGE = "/farm-placeholder.svg";
export const CAPRIL_VILAR_LOGO = "/farm-logos/capril-vilar.png";
export const CAPRIL_ALTO_PARAISO_LOGO = "/farm-logos/capril-alto-paraiso.jpg";

const LEGACY_FARM_LOGOS: Record<string, string> = {
  "https://raw.githubusercontent.com/AlbertoVilar/Imagens-Capris/main/590269883_836883355746160_72604593097600571_n.jpg": CAPRIL_VILAR_LOGO,
  "https://raw.githubusercontent.com/AlbertoVilar/Imagens-Capris/main/capril_alto_paraiso_n.jpg": CAPRIL_ALTO_PARAISO_LOGO,
};

const FARM_LOGOS_BY_NAME: Record<string, string> = {
  "capril vilar": CAPRIL_VILAR_LOGO,
  "capril alto paraiso": CAPRIL_ALTO_PARAISO_LOGO,
};

const normalizeFarmName = (farmName: string) =>
  farmName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const getFarmLogoByName = (farmName: string) =>
  FARM_LOGOS_BY_NAME[normalizeFarmName(farmName)];

export const resolveFarmLogoSource = (src: string | null | undefined, farmName: string) => {
  const trimmedSource = src?.trim();
  if (trimmedSource) return LEGACY_FARM_LOGOS[trimmedSource] || trimmedSource;
  return getFarmLogoByName(farmName) || DEFAULT_FARM_IMAGE;
};
