import type { ReactNode } from "react";
import "./Card.css";

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({
  title,
  description,
  actions,
  footer,
  children,
  className = "",
}: CardProps) {
  return (
    <section className={["gf-card", className].filter(Boolean).join(" ")}>
      {(title || description || actions) && (
        <header className="gf-card__header">
          <div className="gf-card__heading">
            {title && <h3 className="gf-card__title">{title}</h3>}
            {description && <p className="gf-card__description">{description}</p>}
          </div>
          {actions && <div className="gf-card__actions">{actions}</div>}
        </header>
      )}

      <div className="gf-card__body">{children}</div>

      {footer && <footer className="gf-card__footer">{footer}</footer>}
    </section>
  );
}
