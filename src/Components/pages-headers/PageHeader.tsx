import "./PageHeader.css";

interface Props {
  title: string;
  rightButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function PageHeader({ title, rightButton }: Props) {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {rightButton && (
        <button className="btn-primary" onClick={rightButton.onClick}>
          {rightButton.label}
        </button>
      )}
    </div>
  );
}
