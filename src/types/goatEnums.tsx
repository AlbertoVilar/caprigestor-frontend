// Enums para cabras

export enum GoatCategoryEnum {
  PO = "PO", // Puro de Origem (Purebred)
  PA = "PA", // Puro por Avaliação (Pure by Evaluation)
  PC = "PC", // Puro por Cruza (Crossbred)
}

export enum GoatStatusEnum {
  ATIVO = "ATIVO",
  INACTIVE = "INACTIVE",
  DECEASED = "DECEASED",
  SOLD = "SOLD",
}

export enum GoatGenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum GoatBreedEnum {
  ALPINA = "ALPINA",
  ALPINA_AMERICANA = "ALPINA_AMERICANA",
  ALPINA_BRITANICA = "ALPINA_BRITANICA",
  ANGLO_NUBIANA = "ANGLO_NUBIANA",
  ANGORA = "ANGORA",
  BHUJ = "BHUJ",
  BOER = "BOER",
  CANINDE = "CANINDE",
  JAMNAPARI = "JAMNAPARI",
  KALAHARI = "KALAHARI",
  MAMBRINA = "MAMBRINA",
  MESTICA = "MESTICA",
  MOXOTO = "MOXOTO",
  MURCIANA = "MURCIANA",
  MURCIANA_GRANADINA = "MURCIANA_GRANADINA",
  SAANEN = "SAANEN",
  SAVANA = "SAVANA",
  SRD = "SRD",
  TOGGENBURG = "TOGGENBURG",
}

// Labels para exibição
export const categoryLabels: Record<GoatCategoryEnum, string> = {
  [GoatCategoryEnum.PO]: "PO - Puro de Origem",
  [GoatCategoryEnum.PA]: "PA - Puro por Avaliação",
  [GoatCategoryEnum.PC]: "PC - Puro por Cruza",
};

export const statusLabels: Record<GoatStatusEnum, string> = {
  [GoatStatusEnum.ATIVO]: "Ativo",
  [GoatStatusEnum.INACTIVE]: "Inativo",
  [GoatStatusEnum.DECEASED]: "Morto",
  [GoatStatusEnum.SOLD]: "Vendido",
};

export const genderLabels: Record<GoatGenderEnum, string> = {
  [GoatGenderEnum.MALE]: "Macho",
  [GoatGenderEnum.FEMALE]: "Fêmea",
};

export const breedLabels: Record<GoatBreedEnum, string> = {
  [GoatBreedEnum.ALPINA]: "Alpina",
  [GoatBreedEnum.ALPINA_AMERICANA]: "Alpina Americana",
  [GoatBreedEnum.ALPINA_BRITANICA]: "Alpina Britânica",
  [GoatBreedEnum.ANGLO_NUBIANA]: "Anglo Nubiana",
  [GoatBreedEnum.ANGORA]: "Angorá",
  [GoatBreedEnum.BHUJ]: "Bhuj",
  [GoatBreedEnum.BOER]: "Boer",
  [GoatBreedEnum.CANINDE]: "Canindé",
  [GoatBreedEnum.JAMNAPARI]: "Jamnapari",
  [GoatBreedEnum.KALAHARI]: "Kalahari",
  [GoatBreedEnum.MAMBRINA]: "Mambrina",
  [GoatBreedEnum.MESTICA]: "Mestiça",
  [GoatBreedEnum.MOXOTO]: "Moxotó",
  [GoatBreedEnum.MURCIANA]: "Murciana",
  [GoatBreedEnum.MURCIANA_GRANADINA]: "Murciana Granadina",
  [GoatBreedEnum.SAANEN]: "Saanen",
  [GoatBreedEnum.SAVANA]: "Savana",
  [GoatBreedEnum.SRD]: "SRD",
  [GoatBreedEnum.TOGGENBURG]: "Toggenburg",
};
