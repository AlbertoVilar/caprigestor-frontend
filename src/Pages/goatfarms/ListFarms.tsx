import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatfarmCardInfo from "../../Components/goatfarms-cards/GoatfarmCardInfo";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchCapril from "../../Components/searchs/SearchInput";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../footer-compoent/Footer";
import "../../index.css";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import "./listfarms.css";

const farm: GoatFarmDTO = {
  id: 1,
  name: "Capril Vilar",
  tod: "16432",
  createdAt: "2025-05-21T14:15:04.580987",
  updatedAt: "2025-05-21T14:15:04.580987",
  ownerId: 1,
  ownerName: "Alberto Vilar",
  addressId: 1,
  street: "Sítio São Felix",
  district: "Zona Rural",
  city: "Santo Andre",
  state: "Paraíba",
  cep: "58670-000",
  phones: [
    {
      id: 1,
      ddd: "21",
      number: "98988-2934",
    },
    {
      id: 2,
      ddd: "21",
      number: "97588-2922",
    },
  ],
};

export default function ListFarms() {
  return (
    <div className="container">
      <SidebarClient />

      <div className="content">
        <PageHeader title="Lista de Fazendas" />

        <SearchCapril />

        <div className="goatfarm-list">
          <GoatfarmCardInfo farm={farm}/>
          <GoatfarmCardInfo farm={farm}/>
          <GoatfarmCardInfo farm={farm}/>
        </div>

        <ButtonSeeMore />
        
        <Footer />
      </div>
    </div>
  );
}
