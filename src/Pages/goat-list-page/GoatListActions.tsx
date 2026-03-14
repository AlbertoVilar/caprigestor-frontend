import { Button } from "../../Components/ui";

interface GoatListActionsProps {
  canCreate: boolean;
  onCreateManual: () => void;
  onImportAbcc: () => void;
}

export default function GoatListActions({
  canCreate,
  onCreateManual,
  onImportAbcc,
}: GoatListActionsProps) {
  if (!canCreate) {
    return null;
  }

  return (
    <div className="goat-list-actions">
      <Button variant="secondary" onClick={onImportAbcc}>
        Importar da ABCC
      </Button>
      <Button variant="primary" onClick={onCreateManual}>
        Cadastrar nova cabra
      </Button>
    </div>
  );
}
