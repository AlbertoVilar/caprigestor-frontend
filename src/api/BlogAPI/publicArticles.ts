import axios from "axios";
import type { PaginatedResponse } from "../../types/api";
import type { ArticlePublicDTO, ArticlePublicDetailDTO } from "../../Models/ArticleDTOs";
import { resolvePublicBaseUrl } from "../../utils/apiConfig";

const getPublicBaseURL = () => {
  const base = resolvePublicBaseUrl();
  return base || "";
};

const publicBaseURL = getPublicBaseURL();
const publicClient = axios.create({
  baseURL: publicBaseURL ? `${publicBaseURL}/public` : "/public",
  timeout: 10000,
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
