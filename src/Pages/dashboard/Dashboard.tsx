import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInput from "../../Components/searchs/SearchInput";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  return (
    <div className="content-in">
      <PageHeader title="Cabras" />
      <SearchInput />

      <div className="goat-panel">
        <div className="goat-info-card">
          <GoatInfoCard />
        </div>
        <div className="goat-action-panel">
          <GoatActionPanel />
        </div>
      </div>
    </div>
  );
}
