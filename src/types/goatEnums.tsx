// Enums para cabras

export enum GoatCategoryEnum {
  PO = "PO", // Puro de Origem (Purebred)
  PA = "PA", // Puro por Avaliação (Pure by Evaluation)
  PC = "PC", // Puro por Cruza (Crossbred)
}

export enum GoatStatusEnum {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO", 
  MORTO = "MORTO",
  VENDIDO = "VENDIDO",
}

export enum GoatGenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// Labels para exibição
export const categoryLabels: Record<GoatCategoryEnum, string> = {
  [GoatCategoryEnum.PO]: "PO - Puro de Origem",
  [GoatCategoryEnum.PA]: "PA - Puro por Avaliação", 
  [GoatCategoryEnum.PC]: "PC - Puro por Cruza",
};

export const statusLabels: Record<GoatStatusEnum, string> = {
  [GoatStatusEnum.ATIVO]: "Ativo",
  [GoatStatusEnum.INATIVO]: "Inativo",
  [GoatStatusEnum.MORTO]: "Morto",
  [GoatStatusEnum.VENDIDO]: "Vendido",
};

export const genderLabels: Record<GoatGenderEnum, string> = {
  [GoatGenderEnum.MALE]: "Macho",
  [GoatGenderEnum.FEMALE]: "Fêmea",
};