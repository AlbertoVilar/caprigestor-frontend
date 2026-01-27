import axios from "axios";
import type { PaginatedResponse } from "../../types/api";
import type { ArticlePublicDTO, ArticlePublicDetailDTO } from "../../Models/ArticleDTOs";

const getPublicBaseURL = () => {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  if (envBaseURL) {
    return envBaseURL.replace(/\/api\/?$/, "");
  }
  return "http://localhost:8080";
};

const publicClient = axios.create({
  baseURL: `${getPublicBaseURL()}/public`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export async function getHighlightedArticles(): Promise<ArticlePublicDTO[]> {
  const { data } = await publicClient.get("/articles/highlights");
  return data;
}

export async function getPublicArticles(params: {
  page?: number;
  size?: number;
  category?: string;
  q?: string;
}): Promise<PaginatedResponse<ArticlePublicDTO>> {
  const { data } = await publicClient.get("/articles", { params });
  return data;
}

export async function getPublicArticleBySlug(slug: string): Promise<ArticlePublicDetailDTO> {
  const { data } = await publicClient.get(`/articles/${encodeURIComponent(slug)}`);
  return data;
}
