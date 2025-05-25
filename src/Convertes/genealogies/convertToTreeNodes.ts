import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { TreeNode } from "../../Models/treeNode";

export function convertToTreeNodes(dto: GoatGenealogyDTO): TreeNode[] {
  return [
    {
      id: dto.goatRegistration,
      name: dto.goatName,
      registration: dto.goatRegistration,
      relation: "Animal",
    },
    {
      id: dto.fatherRegistration,
      name: dto.fatherName,
      registration: dto.fatherRegistration,
      relation: "Pai",
      parentId: dto.goatRegistration,
    },
    {
      id: dto.motherRegistration,
      name: dto.motherName,
      registration: dto.motherRegistration,
      relation: "Mãe",
      parentId: dto.goatRegistration,
    },
    {
      id: dto.paternalGrandfatherRegistration,
      name: dto.paternalGrandfatherName,
      registration: dto.paternalGrandfatherRegistration,
      relation: "Avô Paterno",
      parentId: dto.fatherRegistration,
    },
    {
      id: dto.paternalGrandmotherRegistration,
      name: dto.paternalGrandmotherName,
      registration: dto.paternalGrandmotherRegistration,
      relation: "Avó Paterna",
      parentId: dto.fatherRegistration,
    },
    {
      id: dto.maternalGrandfatherRegistration,
      name: dto.maternalGrandfatherName,
      registration: dto.maternalGrandfatherRegistration,
      relation: "Avô Materno",
      parentId: dto.motherRegistration,
    },
    {
      id: dto.maternalGrandmotherRegistration,
      name: dto.maternalGrandmotherName,
      registration: dto.maternalGrandmotherRegistration,
      relation: "Avó Materna",
      parentId: dto.motherRegistration,
    },

    // Bisavós paternos (lado 1)
    {
      id: dto.paternalGreatGrandfather1Registration,
      name: dto.paternalGreatGrandfather1Name,
      registration: dto.paternalGreatGrandfather1Registration,
      relation: "Bisavô Paterno 1",
      parentId: dto.paternalGrandfatherRegistration,
    },
    {
      id: dto.paternalGreatGrandmother1Registration,
      name: dto.paternalGreatGrandmother1Name,
      registration: dto.paternalGreatGrandmother1Registration,
      relation: "Bisavó Paterna 1",
      parentId: dto.paternalGrandfatherRegistration,
    },

    // Bisavós paternos (lado 2)
    {
      id: dto.paternalGreatGrandfather2Registration,
      name: dto.paternalGreatGrandfather2Name,
      registration: dto.paternalGreatGrandfather2Registration,
      relation: "Bisavô Paterno 2",
      parentId: dto.paternalGrandmotherRegistration,
    },
    {
      id: dto.paternalGreatGrandmother2Registration,
      name: dto.paternalGreatGrandmother2Name,
      registration: dto.paternalGreatGrandmother2Registration,
      relation: "Bisavó Paterna 2",
      parentId: dto.paternalGrandmotherRegistration,
    },

    // Bisavós maternos (lado 1)
    {
      id: dto.maternalGreatGrandfather1Registration,
      name: dto.maternalGreatGrandfather1Name,
      registration: dto.maternalGreatGrandfather1Registration,
      relation: "Bisavô Materno 1",
      parentId: dto.maternalGrandfatherRegistration,
    },
    {
      id: dto.maternalGreatGrandmother1Registration,
      name: dto.maternalGreatGrandmother1Name,
      registration: dto.maternalGreatGrandmother1Registration,
      relation: "Bisavó Materna 1",
      parentId: dto.maternalGrandfatherRegistration,
    },

    // Bisavós maternos (lado 2)
    {
      id: dto.maternalGreatGrandfather2Registration,
      name: dto.maternalGreatGrandfather2Name,
      registration: dto.maternalGreatGrandfather2Registration,
      relation: "Bisavô Materno 2",
      parentId: dto.maternalGrandmotherRegistration,
    },
    {
      id: dto.maternalGreatGrandmother2Registration,
      name: dto.maternalGreatGrandmother2Name,
      registration: dto.maternalGreatGrandmother2Registration,
      relation: "Bisavó Materna 2",
      parentId: dto.maternalGrandmotherRegistration,
    },
  ];
}
