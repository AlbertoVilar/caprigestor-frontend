import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatfarmCardInfo from "../../Components/goatfarms-cards/GoatfarmCardInfo";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchCapril from "../../Components/searchs/SearchInput";
import SidebarClient from "../../Components/sidebar/SidebarClient";
import Footer from "../../footer-compoent/Footer";


import "../../index.css";
import "./listfarms.css";

export default function ListFarms() {
  return (
    <div className="container">
      <SidebarClient />

      <div className="content">
        <PageHeader title="Lista de Fazendas" />

        <SearchCapril />

        <div className="goatfarm-list">
          <GoatfarmCardInfo />
          <GoatfarmCardInfo />
          <GoatfarmCardInfo />
        </div>

        <ButtonSeeMore />
        <Footer />
      </div>
    </div>
  );
}
