import { Button } from "./Button";
import "./EmptyState.css";
import "./ErrorState.css";

interface ErrorStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title,
  description,
  retryLabel = "Tentar novamente",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="gf-state gf-state--error" role="alert">
      <div className="gf-state__icon" aria-hidden="true">
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
      </div>
      <h3 className="gf-state__title">{title}</h3>
      <p className="gf-state__description">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
