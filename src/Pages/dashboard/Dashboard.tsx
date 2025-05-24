import { useSearchParams } from "react-router-dom";
import GoatActionPanel from "../../Components/dash-animal-info/GoatActionPanel";
import GoatInfoCard from "../../Components/goat-info-card/GoatInfoCard";
import PageHeader from "../../Components/pages-headers/PageHeader";
import SearchInput from "../../Components/searchs/SearchInputBox";

import "../../index.css";
import "./animalDashboard.css";

export default function AnimalDashboard() {
  const [searchParams] = useSearchParams();
  const registrationNumber = searchParams.get("goat");

  return (
    <div className="content-in">
      <PageHeader title="Cabras" />
      <SearchInput />

      <div className="goat-panel">
        <div className="goat-info-card">
          <GoatInfoCard registrationNumber={registrationNumber} />
        </div>
        <div className="goat-action-panel">
          <GoatActionPanel registrationNumber={registrationNumber} />
        </div>
      </div>
    </div>
  );
}
