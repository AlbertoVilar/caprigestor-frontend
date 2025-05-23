import ButtonPrimary from "../../buttons/ButtonPrimary";
import ButtonOutline from "../../buttons/buttonOutline";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  return (
    <header className="topbar">
      <h1>Bem-vindo ao CapriGestor</h1>

      <div className="button-group">
        <ButtonPrimary />
        <ButtonOutline
          to="/register"
          label="Cadastrar"
          icon="fa-solid fa-user-plus"
        />
      </div>
    </header>
  );
}
