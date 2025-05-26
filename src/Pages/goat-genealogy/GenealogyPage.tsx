import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";

const goatGenealogy: GoatGenealogyDTO = {
  goatName: "XEQUE V DO CAPRIL VILAR",
  goatRegistration: "1643218012",

  fatherName: "C.V.C SIGNOS PETROLEO",
  fatherRegistration: "1635717065",
  motherName: "NAIDE DO CRS",
  motherRegistration: "2114517012",

  paternalGrandfatherName: "PETRÓLEO CAPRIVAMAR",
  paternalGrandfatherRegistration: "1422915618",
  paternalGrandmotherName: "BÉLGICA DA CAPRIVAMAR",
  paternalGrandmotherRegistration: "1422913470",

  maternalGrandfatherName: "JOSA CAPRIMEL",
  maternalGrandfatherRegistration: "1650113018",
  maternalGrandmotherName: "PANTALONA DO CRS",
  maternalGrandmotherRegistration: "2114513061",

  paternalGreatGrandfather1Name: "BALU DA CAPRIVAMA",
  paternalGreatGrandfather1Registration: "1422911451",
  paternalGreatGrandmother1Name: "COROA DA CAPRIVAMA",
  paternalGreatGrandmother1Registration: "1422911408",

  paternalGreatGrandfather2Name: "SHERIFF SAVANA",
  paternalGreatGrandfather2Registration: "1412811133",
  paternalGreatGrandmother2Name: "JUCELISE DO JALILI",
  paternalGreatGrandmother2Registration: "1418513119",

  maternalGreatGrandfather1Name: "NATAL DO JACOMÉ",
  maternalGreatGrandfather1Registration: "1403110395",
  maternalGreatGrandmother1Name: "12018 CAPRIMEL",
  maternalGreatGrandmother1Registration: "1650112018",

  maternalGreatGrandfather2Name: "HERE DO ANGICANO",
  maternalGreatGrandfather2Registration: "2104406006",
  maternalGreatGrandmother2Name: "TOPÁZIO DO CRS",
  maternalGreatGrandmother2Registration: "2114510040",
};

export default function GenealogyPage() {
  return (
    <div className="genealogy-page">
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        🧬 Genealogia de XEQUE V DO CAPRIL VILAR
      </h2>
      <GoatGenealogyTree data={goatGenealogy} />
    </div>
  );
}
