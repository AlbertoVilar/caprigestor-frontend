
import "./buttonCards.css";

interface ButtonCardProps {
  name: string;
  className?: string;
}

export default function ButtonCard({ name, className = "" }: ButtonCardProps) {
  return (
    <button className={`btn-card ${className}`}>
      {name}
    </button>
  );
}

