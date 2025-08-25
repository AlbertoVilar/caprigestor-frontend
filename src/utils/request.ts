// src/utils/request.ts
import axios from "axios";
import { getAccessToken } from "../services/auth-service";

// Instância base do Axios para o backend
export const requestBackEnd = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
});

// Interceptor: injeta o Authorization: Bearer <token> automaticamente
requestBackEnd.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
