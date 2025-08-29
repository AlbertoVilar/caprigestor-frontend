import axios from "axios";
import * as accessTokenRepository from "../localstorage/access-token-repository";

export const requestBackEnd = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
});

// Anexa o token quando existir
requestBackEnd.interceptors.request.use((config) => {
  const token = accessTokenRepository.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❗ Não redireciona para /login aqui. Deixe cada tela decidir.
requestBackEnd.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);
