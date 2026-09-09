import { Button } from "../../Components/ui";

interface GoatListActionsProps {
  canCreate: boolean;
  onCreate: () => void;
}

export default function GoatListActions({
  canCreate,
  onCreate,
}: GoatListActionsProps) {
  if (!canCreate) {
    return null;
  }

  return (
    <div className="goat-list-actions">
      <Button variant="primary" onClick={onCreate}>
        Cadastrar nova cabra
      </Button>
    </div>
  );
}
