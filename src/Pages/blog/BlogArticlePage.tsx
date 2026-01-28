import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicArticleBySlug } from "../../api/BlogAPI/publicArticles";
import type { ArticlePublicDetailDTO } from "../../Models/ArticleDTOs";
import MarkdownRenderer from "../../Components/blog/MarkdownRenderer";
import "./blog.css";

const fallbackCover = "/hero-goat.png";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
};

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticlePublicDetailDTO | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Artigo não encontrado.");
      setLoading(false);
      return;
    }
    getPublicArticleBySlug(slug)
      .then((data) => {
        setArticle(data);
        setError(null);
      })
      .catch((err: any) => {
        console.error("Erro ao carregar artigo", err);
        if (err?.response?.status === 404) {
          setError("Artigo não encontrado.");
        } else {
          setError("Erro ao carregar artigo.");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="blog-empty">Carregando...</div>;
  }

  if (error || !article) {
    return (
      <div className="blog-empty">
        {error || "Artigo não encontrado."}
        <div style={{ marginTop: "1rem" }}>
          <Link to="/blog" className="btn-outline">
            Voltar para o blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-article">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/blog" className="btn-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gf-color-text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
          <i className="ph ph-arrow-left"></i> Voltar para o blog
        </Link>
      </div>

      <div className="blog-article-hero">
        <img
          src={article.coverImageUrl || fallbackCover}
          alt={article.title}
          loading="lazy"
        />
      </div>
      <div className="blog-article-content">
        <div className="blog-article-meta">
          {article.category && <span className="blog-tag">{article.category}</span>}
          {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
        </div>
        <h1>{article.title}</h1>
        <MarkdownRenderer markdown={article.contentMarkdown || ""} className="blog-markdown" />
        <div className="blog-article-footer">
          <Link to="/blog" className="btn-outline">
            Voltar para o blog
          </Link>
        </div>
      </div>
    </div>
  );
}
