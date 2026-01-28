import { requestBackEnd } from "../../utils/request";
import type { PaginatedResponse } from "../../types/api";
import type {
  ArticleAdminDTO,
  ArticleCreateRequestDTO,
  ArticleUpdateRequestDTO,
} from "../../Models/ArticleDTOs";

export async function getAdminArticles(params: {
  page?: number;
  size?: number;
  category?: string;
  q?: string;
}): Promise<PaginatedResponse<ArticleAdminDTO>> {
  const { data } = await requestBackEnd.get("/articles", { params });
  return data;
}

export async function getAdminArticleById(id: number): Promise<ArticleAdminDTO> {
  const { data } = await requestBackEnd.get(`/articles/${id}`);
  return data;
}

export async function createArticle(payload: ArticleCreateRequestDTO): Promise<ArticleAdminDTO> {
  const { data } = await requestBackEnd.post("/articles", payload);
  return data;
}

export async function updateArticle(
  id: number,
  payload: ArticleUpdateRequestDTO
): Promise<ArticleAdminDTO> {
  const { data } = await requestBackEnd.put(`/articles/${id}`, payload);
  return data;
}

export async function setArticlePublish(
  id: number,
  publish: boolean
): Promise<ArticleAdminDTO> {
  const { data } = await requestBackEnd.patch(`/articles/${id}/publish`, {
    published: publish,
  });
  return data;
}

export async function setArticleHighlight(
  id: number,
  highlight: boolean
): Promise<ArticleAdminDTO> {
  const { data } = await requestBackEnd.patch(`/articles/${id}/highlight`, {
    highlighted: highlight,
  });
  return data;
}
