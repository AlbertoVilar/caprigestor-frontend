import { Button } from "./Button";
import "./EmptyState.css";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="gf-state gf-state--empty" role="status">
      <div className="gf-state__icon" aria-hidden="true">
        <i className="fa-regular fa-circle-dot" aria-hidden="true"></i>
      </div>
      <h3 className="gf-state__title">{title}</h3>
      <p className="gf-state__description">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
