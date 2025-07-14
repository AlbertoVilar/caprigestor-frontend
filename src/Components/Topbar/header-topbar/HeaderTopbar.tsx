import ButtonPrimary from "../../buttons/ButtonPrimary";
import ButtonOutline from "../../buttons/ButtonOutline";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  return (
    <header className="topbar">
      <h1>Bem-vindo ao CapriGestor</h1>

      <div className="button-group">
        <ButtonPrimary
          label="Entrar"
          icon="fa-solid fa-sign-in-alt" // ou qualquer ícone do FontAwesome
          onClick={() => console.log("Entrar clicado")} // ou uma função real
        />
        <ButtonOutline
          to="/fazendas/novo" // ✅ Rota corrigida aqui!
          label="Cadastrar"
          icon="fa-solid fa-user-plus"
        />
      </div>
    </header>
  );
}
