import { useNavigate } from "react-router-dom";
import ButtonPrimary from "../../buttons/ButtonPrimary";
import ButtonOutline from "../../buttons/ButtonOutline";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <h1>Bem-vindo ao CapriGestor</h1>

      <div className="button-group-into">
        <ButtonPrimary
          label="Entrar"
          icon="fa-solid fa-sign-in-alt"
          onClick={() => navigate("/login")}
        />
        <ButtonOutline
          to="/fazendas/novo"
          label="Cadastrar"
          icon="fa-solid fa-user-plus"
        />
      </div>
    </header>
  );
}
