// src/Pages/goat/GoatCreatePage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import GoatCreateForm from "../../Components/goat-create-form/GoatCreateForm";
import PageHeader from "../../Components/pages-headers/PageHeader";
import "../../styles/forms.css"; // Import the shared form styles

export default function GoatCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tokenPayload } = useAuth();

  const farmId = Number(searchParams.get("farmId"));
  const tod = searchParams.get("tod") || undefined;
  const userId = tokenPayload?.userId ? Number(tokenPayload.userId) : undefined;

  const handleGoatCreated = () => {
    // Navigate to the list of animals for the specific farm
    if (farmId) {
      navigate(`/fazendas/${farmId}/animais`);
    } else {
      // Fallback to the general list of goats
      navigate("/cabras");
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Cadastrar Nova Cabra"
        description={`Preencha os dados para adicionar uma nova cabra na fazenda.`}
        showBackButton={true}
        backButtonUrl={farmId ? `/fazendas/${farmId}/animais` : "/cabras"}
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