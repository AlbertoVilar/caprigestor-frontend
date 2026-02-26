import { Link } from "react-router-dom";
import "./pageheader.css";

interface Props {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backButtonUrl?: string;
  rightButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({
  title,
  description,
  showBackButton,
  backButtonUrl,
  rightButton,
}: Props) {
  return (
    <div className="page-header">
      <div className="header-main-content">
        {showBackButton && backButtonUrl && (
          <Link to={backButtonUrl} className="back-button">
            &larr;
          </Link>
        )}
        <div className="header-text">
          <h2 className="header-title">{title}</h2>
          {description && <p className="header-description">{description}</p>}
        </div>
      </div>
      {rightButton && (
        <div className="header-actions">
          <button className="btn btn-primary" onClick={rightButton.onClick}>
            {rightButton.label}
          </button>
        </div>
      )}
    </div>
  );
}

