import "../../index.css";
import "./buttonseemore.css";

interface Props {
  onClick: () => void;
}

export default function ButtonSeeMore({ onClick }: Props) {
  return (
    <div className="see-more-container">
      <button id="ver-mais-btn" className="btn-primary" onClick={onClick}>
        <i className="fa-solid fa-angle-down"></i> Ver mais
      </button>
    </div>
  );
}
