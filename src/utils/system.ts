// Removido BASE_URL absoluta - usar requestBackEnd do request.ts
// export const BASE_URL = "http://localhost:8080";
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
export const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET;
export const TOKEN_KEY = "authToken";

console.log("CLIENT_ID:", CLIENT_ID);
console.log("CLIENT_SECRET:", CLIENT_SECRET);
