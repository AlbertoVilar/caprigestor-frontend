import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHighlightedArticles } from "../../api/BlogAPI/publicArticles";
import type { ArticlePublicDTO } from "../../Models/ArticleDTOs";
import "./home-components.css";

const fallbackCover = "/hero-goat.png";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
};

export default function BlogSection() {
  const [articles, setArticles] = useState<ArticlePublicDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHighlightedArticles()
      .then((data) => setArticles((data || []).slice(0, 3)))
      .catch((error) => {
        console.error("Erro ao carregar destaques do blog", error);
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="blog-section">
      <div className="section-header">
        <h2 className="section-title">Mundo das Cabras</h2>
        <p className="section-subtitle">
          Fique por dentro das novidades e técnicas do agronegócio.
        </p>
        <Link to="/blog" className="blog-all-link">
          Ver todos <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </div>

      {loading ? (
        <div className="blog-empty">Carregando artigos...</div>
      ) : articles.length === 0 ? (
        <div className="blog-empty">Ainda não há artigos publicados.</div>
      ) : (
        <div className="blog-grid">
          {articles.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-image">
                <img
                  src={post.coverImageUrl || fallbackCover}
                  alt={post.title}
                />
                {post.category && <span className="blog-tag">{post.category}</span>}
              </div>
              <div className="blog-card-content">
                <div className="blog-card-meta">
                  {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} className="read-more-btn">
                  Ler mais <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
