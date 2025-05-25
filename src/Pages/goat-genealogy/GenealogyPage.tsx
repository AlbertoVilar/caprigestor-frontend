import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";

export default function GenealogyPage() {
  const treeStructure = {
    name: "XEQUE V DO CAPRIL VILAR\n1643218012",
    children: [
      {
        name: "Pai: C.V.C SIGNOS PETROLEO\n1635717065",
        children: [
          {
            name: "Avô Paterno: PETRÓLEO CAPRIVAMAR\n1422915618",
            children: [
              { name: "Bisavô Paterno: BALU DA CAPRIVAMA\n1422911451" },
              { name: "Bisavó Paterna: COROA DA CAPRIVAMA\n1422911408" }
            ]
          },
          {
            name: "Avó Paterna: BÉLGICA DA CAPRIVAMAR\n1422913470",
            children: [
              { name: "Bisavô Paterno: SHERIFF SAVANA\n1412811133" },
              { name: "Bisavó Paterna: JUCELISE DO JALILI\n1418513119" }
            ]
          }
        ]
      },
      {
        name: "Mãe: NAIDE DO CRS\n2114517012",
        children: [
          {
            name: "Avô Materno: JOSA CAPRIMEL\n1650113018",
            children: [
              { name: "Bisavô Materno: NATAL DO JACOMÉ\n1403110395" },
              { name: "Bisavó Materna: 12018 CAPRIMEL\n1650112018" }
            ]
          },
          {
            name: "Avó Materna: PANTALONA DO CRS\n2114513061",
            children: [
              { name: "Bisavô Materno: HERE DO ANGICANO\n2104406006" },
              { name: "Bisavó Materna: TOPÁZIO DO CRS\n2114510040" }
            ]
          }
        ]
      }
    ]
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        padding: "1rem",
        overflowX: "auto", // permite rolagem horizontal
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        🧬 Genealogia de XEQUE V DO CAPRIL VILAR
      </h2>
      <div style={{ minWidth: "1200px", height: "100%" }}>
        <GoatGenealogyTree data={treeStructure} />
      </div>
    </div>
  );
}
