// src/Pages/goat/GoatCreatePage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import GoatCreateForm from "../../Components/goat-create-form/GoatCreateForm";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { buildFarmGoatsPath } from "../../utils/appRoutes";
import "../../styles/forms.css"; // Import the shared form styles

export default function GoatCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tokenPayload } = useAuth();

  const parsedFarmId = Number(searchParams.get("farmId"));
  const farmId = Number.isSafeInteger(parsedFarmId) && parsedFarmId > 0 ? parsedFarmId : undefined;
  const tod = searchParams.get("tod") || undefined;
  const userId = tokenPayload?.userId ? Number(tokenPayload.userId) : undefined;

  const handleGoatCreated = () => {
    navigate(farmId ? buildFarmGoatsPath(farmId) : "/fazendas");
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Cadastrar Nova Cabra"
        description={`Preencha os dados para adicionar uma nova cabra na fazenda.`}
        showBackButton={true}
        backButtonUrl={farmId ? buildFarmGoatsPath(farmId) : "/fazendas"}
      />
      <div className="form-wrapper">
        <GoatCreateForm
          onGoatCreated={handleGoatCreated}
          defaultFarmId={farmId}
          defaultUserId={userId}
          defaultTod={tod}
          mode="create"
        />
      </div>
    </div>
  );
}
