import { Button } from "../ui";
import "./buttonseemore.css";

interface Props {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ButtonSeeMore({
  onClick,
  disabled = false,
  loading = false,
}: Props) {
  return (
    <div className="see-more-container">
      <Button
        onClick={onClick}
        variant="secondary"
        loading={loading}
        disabled={disabled}
      >
        <i className="fa-solid fa-angle-down" aria-hidden="true"></i>
        Ver mais
      </Button>
    </div>
  );
}
