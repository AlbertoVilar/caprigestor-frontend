import SearchCapril from "../searchs/SearchCapril";

export default function WelcomeSection() {
    
    return (
        <section className="home-section">
        <p>Este é um sistema gratuito para gestão de genealogia, capris e eventos. Explore capris já cadastrados ou registre o seu!</p>

        <div className="search-box">
          <SearchCapril />
        </div>
      </section>
    );
}