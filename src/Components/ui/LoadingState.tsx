import "./LoadingState.css";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = "Carregando informações...",
}: LoadingStateProps) {
  return (
    <div className="gf-loading-state" role="status" aria-live="polite">
      <div className="gf-loading-state__skeleton gf-loading-state__skeleton--title" />
      <div className="gf-loading-state__skeleton" />
      <div className="gf-loading-state__skeleton" />
      <div className="gf-loading-state__skeleton gf-loading-state__skeleton--short" />
      <span className="gf-loading-state__label">{label}</span>
    </div>
  );
}
