import SearchInput from "../searchs/SearchInput";

import "../../index.css"
import "./welcome.css"

export default function WelcomeSection() {
    
    return (
      <section className="home-section">
        <p>🐐 Bem-vindo ao CapriGestor!
              Consulte dados de capris gratuitamente ou 
              registre-se para gerenciar o seu.
        </p>

        <div className="search-box">
          <SearchInput />
        </div>
      </section>
    );
}