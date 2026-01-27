import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createArticle,
  getAdminArticleById,
  setArticleHighlight,
  setArticlePublish,
  updateArticle,
} from "../../../api/BlogAPI/adminArticles";
import type { ArticleAdminDTO, ArticleCreateRequestDTO } from "../../../Models/ArticleDTOs";
import { getApiErrorMessage, parseApiError } from "../../../utils/apiError";
import MarkdownRenderer from "../../../Components/blog/MarkdownRenderer";
import "./adminArticles.css";

type FormErrors = Partial<Record<keyof ArticleCreateRequestDTO, string>>;

export default function AdminArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [article, setArticle] = useState<ArticleAdminDTO | null>(null);
  const [form, setForm] = useState<ArticleCreateRequestDTO>({
    title: "",
    category: "",
    excerpt: "",
    coverImageUrl: "",
    contentMarkdown: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminArticleById(Number(id));
        setArticle(data);
        setForm({
          title: data.title,
          category: data.category || "",
          excerpt: data.excerpt,
          coverImageUrl: data.coverImageUrl || "",
          contentMarkdown: data.contentMarkdown,
        });
      } catch (err: any) {
        const parsed = parseApiError(err);
        if (parsed.status === 401) {
          navigate("/login");
          return;
        }
        if (parsed.status === 403) {
          setError("Sem permissão para acessar o editor.");
          return;
        }
        setError(getApiErrorMessage(parsed));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const validate = () => {
    const errors: FormErrors = {};
    if (!form.title.trim()) errors.title = "Título é obrigatório.";
    if (!form.category.trim()) errors.category = "Categoria é obrigatória.";
    if (!form.excerpt.trim()) errors.excerpt = "Resumo é obrigatório.";
    if (!form.contentMarkdown.trim()) errors.contentMarkdown = "Conteúdo é obrigatório.";
    if (form.coverImageUrl && !/^https?:\/\//i.test(form.coverImageUrl)) {
      errors.coverImageUrl = "Informe uma URL válida.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      if (id) {
        await updateArticle(Number(id), form);
      } else {
        const created = await createArticle(form);
        navigate(`/app/editor/articles/${created.id}/edit`, { replace: true });
      }
      navigate("/app/editor/articles");
    } catch (err: any) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        navigate("/login");
        return;
      }
      if (parsed.status === 403) {
        setError("Sem permissão para acessar o editor.");
        return;
      }
      if (parsed.status === 409 || parsed.status === 422) {
        setError(parsed.message || getApiErrorMessage(parsed));
      } else {
        setError(getApiErrorMessage(parsed));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!article) return;
    try {
      await setArticlePublish(article.id, article.status !== "PUBLISHED");
      const updated = await getAdminArticleById(article.id);
      setArticle(updated);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  const handleToggleHighlight = async () => {
    if (!article) return;
    try {
      await setArticleHighlight(article.id, !article.highlighted);
      const updated = await getAdminArticleById(article.id);
      setArticle(updated);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  if (loading) {
    return <div className="admin-empty">Carregando...</div>;
  }

  if (error) {
    return <div className="admin-empty">{error}</div>;
  }

  return (
    <div className="admin-articles-page">
      <section className="admin-hero">
        <div>
          <h1>{id ? "Editar artigo" : "Novo artigo"}</h1>
          <p>Preencha as informações e publique quando estiver pronto.</p>
        </div>
        <div className="admin-hero-actions">
          <button className="btn-outline" onClick={() => setShowPreview((prev) => !prev)}>
            {showPreview ? "Ocultar preview" : "Pré-visualizar"}
          </button>
          {article && (
            <>
              <button className="btn-outline" onClick={handleTogglePublish}>
                {article.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
              </button>
              <button className="btn-outline" onClick={handleToggleHighlight}>
                {article.highlighted ? "Remover destaque" : "Destacar"}
              </button>
            </>
          )}
        </div>
      </section>

      <div className="admin-form">
        <div className="admin-form-grid">
          <div>
            <label>Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            {formErrors.title && <p className="text-danger">{formErrors.title}</p>}
          </div>
          <div>
            <label>Categoria</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
            {formErrors.category && <p className="text-danger">{formErrors.category}</p>}
          </div>
          <div>
            <label>Resumo</label>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            />
            {formErrors.excerpt && <p className="text-danger">{formErrors.excerpt}</p>}
          </div>
          <div>
            <label>Cover Image (URL)</label>
            <input
              type="text"
              value={form.coverImageUrl || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
            />
            {formErrors.coverImageUrl && <p className="text-danger">{formErrors.coverImageUrl}</p>}
          </div>
          <div className="admin-form-markdown">
            <label>Conteúdo (Markdown)</label>
            <textarea
              rows={12}
              value={form.contentMarkdown}
              onChange={(e) => setForm((prev) => ({ ...prev, contentMarkdown: e.target.value }))}
            />
            {formErrors.contentMarkdown && <p className="text-danger">{formErrors.contentMarkdown}</p>}
          </div>
        </div>

        {showPreview && (
          <div className="admin-preview">
            <h3>Pré-visualização</h3>
            <MarkdownRenderer markdown={form.contentMarkdown} className="blog-markdown" />
          </div>
        )}

        <div className="admin-form-actions">
          <button className="btn-secondary" onClick={() => navigate("/app/editor/articles")}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
