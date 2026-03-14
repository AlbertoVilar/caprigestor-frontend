export type GenealogyNodeSource = "LOCAL" | "ABCC" | "AUSENTE";

export interface GoatGenealogyNodeDTO {
  nome: string;
  registro: string;
  source?: GenealogyNodeSource;
  localGoatId?: string | null;
  relationship?: string;
}

export interface GoatGenealogyIntegrationDTO {
  status: "FOUND" | "NOT_FOUND" | "UNAVAILABLE" | "INSUFFICIENT_DATA";
  lookupKey: string;
  message: string;
}

// Nova estrutura de dados da genealogia após refatoração do backend
export interface GoatGenealogyDTO {
  // Animal principal
  animalPrincipal: {
    nome: string;
    registro: string;
    criador: string;
    proprietario: string;
    raca: string;
    pelagem: string;
    situacao: string;
    sexo: string;
    categoria: string;
    tod: string;
    toe: string;
    dataNasc: string;
    source?: GenealogyNodeSource;
    localGoatId?: string | null;
    relationship?: string;
  };

  // Pais (objetos diretos)
  pai?: GoatGenealogyNodeDTO;
  mae?: GoatGenealogyNodeDTO;

  // Avós (objetos diretos)
  avoPaterno?: GoatGenealogyNodeDTO;
  avoPaterna?: GoatGenealogyNodeDTO;
  avoMaterno?: GoatGenealogyNodeDTO;
  avoMaterna?: GoatGenealogyNodeDTO;

  // Bisavós (arrays com tipo de parentesco)
  bisavosPaternos?: Array<{
    parentesco: string;
    nome: string;
    registro: string;
    source?: GenealogyNodeSource;
    localGoatId?: string | null;
  }>;

  bisavosMaternos?: Array<{
    parentesco: string;
    nome: string;
    registro: string;
    source?: GenealogyNodeSource;
    localGoatId?: string | null;
  }>;

  integration?: GoatGenealogyIntegrationDTO;
}

// Interface para compatibilidade com a estrutura antiga (deprecated)
export interface GoatGenealogyDTOLegacy {
  goatName: string;
  goatRegistration: string;
  breeder: string;
  owner: string;
  breed: string;
  color: string;
  status: string;
  gender: string;
  category: string;
  tod: string;
  toe: string;
  birthDate: string;

  fatherName: string;
  fatherRegistration: string;
  motherName: string;
  motherRegistration: string;

  paternalGrandfatherName: string;
  paternalGrandfatherRegistration: string;
  paternalGrandmotherName: string;
  paternalGrandmotherRegistration: string;

  maternalGrandfatherName: string;
  maternalGrandfatherRegistration: string;
  maternalGrandmotherName: string;
  maternalGrandmotherRegistration: string;

  paternalGreatGrandfather1Name: string;
  paternalGreatGrandfather1Registration: string;
  paternalGreatGrandmother1Name: string;
  paternalGreatGrandmother1Registration: string;

  paternalGreatGrandfather2Name: string;
  paternalGreatGrandfather2Registration: string;
  paternalGreatGrandmother2Name: string;
  paternalGreatGrandmother2Registration: string;

  maternalGreatGrandfather1Name: string;
  maternalGreatGrandfather1Registration: string;
  maternalGreatGrandmother1Name: string;
  maternalGreatGrandmother1Registration: string;

  maternalGreatGrandfather2Name: string;
  maternalGreatGrandfather2Registration: string;
  maternalGreatGrandmother2Name: string;
  maternalGreatGrandmother2Registration: string;
}
