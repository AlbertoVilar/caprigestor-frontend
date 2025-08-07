const TOKEN_KEY = "authToken";

// Salva o token no localStorage
export function save(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Busca o token
export function get(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Remove o token
export function remove() {
  localStorage.removeItem(TOKEN_KEY);
}
