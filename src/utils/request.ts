import axios from "axios";

export const requestBackEnd = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080", // ajuste conforme seu backend
});
