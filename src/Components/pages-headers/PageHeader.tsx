import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui";
import "./pageheader.css";

interface Props {
  title: string;
  description?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonUrl?: string;
  backTo?: string;
  rightButton?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
    disabled?: boolean;
  };
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  subtitle,
  showBackButton,
  backButtonUrl,
  backTo,
  rightButton,
  actions,
}: Props) {
  const resolvedDescription = subtitle ?? description;
  const resolvedBackTo = backTo ?? backButtonUrl;

  return (
    <div className="page-header">
      <div className="header-main-content">
        {showBackButton && resolvedBackTo && (
          <Link
            to={resolvedBackTo}
            className="back-button"
            aria-label="Voltar para a página anterior"
            title="Voltar para a página anterior"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Voltar</span>
          </Link>
        )}
        <div className="header-text">
          <h2 className="header-title">{title}</h2>
          {resolvedDescription && <p className="header-description">{resolvedDescription}</p>}
        </div>
      </div>

      {(actions || rightButton) && (
        <div className="header-actions">
          {actions}
          {rightButton && (
            <Button
              variant={rightButton.variant ?? "primary"}
              onClick={rightButton.onClick}
              disabled={rightButton.disabled}
            >
              {rightButton.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
