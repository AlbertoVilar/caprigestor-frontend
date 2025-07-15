import FarmCreateForm from "../../Components/farm/FarmCreateForm";
import "./FarmCreatePage.css"; // certifique-se de criar/importar esse CSS

export default function FarmCreatePage() {
  return (
    <main>
      <h1 className="page-title">Cadastro de Nova Fazenda</h1>
      <div className="form-wrapper">
        <FarmCreateForm />
      </div>
    </main>
  );
}
