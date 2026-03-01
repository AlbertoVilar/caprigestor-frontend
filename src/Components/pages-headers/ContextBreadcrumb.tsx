import { Fragment } from "react";
import { Link } from "react-router-dom";
import "./ContextBreadcrumb.css";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface Props {
  items: BreadcrumbItem[];
}

export default function ContextBreadcrumb({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="context-breadcrumb" aria-label="Breadcrumb">
      <ol className="context-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li className="context-breadcrumb__item">
                {item.to && !isLast ? (
                  <Link to={item.to} className="context-breadcrumb__link">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`context-breadcrumb__label${
                      isLast ? " context-breadcrumb__label--current" : ""
                    }`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li className="context-breadcrumb__separator" aria-hidden="true">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
