import './home-components.css';

const BLOG_POSTS = [
    {
        id: 1,
        title: "Nutrição de Precisão em Caprinos",
        excerpt: "Como o equilíbrio nutricional pode aumentar a longevidade e saúde do seu rebanho.",
        image: "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=600&auto=format&fit=crop",
        tag: "Nutrição"
    },
    {
        id: 2,
        title: "Produção de Leite: Fatores de Sucesso",
        excerpt: "Dicas essenciais para maximizar a produtividade leiteira com foco em qualidade.",
        image: "https://images.unsplash.com/photo-1621460244018-9366df41c2c3?q=80&w=600&auto=format&fit=crop",
        tag: "Produção"
    },
    {
        id: 3,
        title: "Cuidados Zootécnicos no Manejo",
        excerpt: "O impacto do manejo adequado no desenvolvimento genético e bem-estar animal.",
        image: "https://images.unsplash.com/photo-1549468057-5b64301ba69a?q=80&w=600&auto=format&fit=crop",
        tag: "Zootecnia"
    }
];

export default function BlogSection() {
    return (
        <section className="blog-section">
            <div className="section-header">
                <h2 className="section-title">Mundo das Cabras</h2>
                <p className="section-subtitle">Fique por dentro das novidades e técnicas do agronegócio.</p>
            </div>

            <div className="blog-grid">
                {BLOG_POSTS.map((post) => (
                    <article key={post.id} className="blog-card">
                        <div className="blog-card-image">
                            <img src={post.image} alt={post.title} />
                            <span className="blog-tag">{post.tag}</span>
                        </div>
                        <div className="blog-card-content">
                            <h3>{post.title}</h3>
                            <p>{post.excerpt}</p>
                            <button className="read-more-btn">
                                Ler mais <i className="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
