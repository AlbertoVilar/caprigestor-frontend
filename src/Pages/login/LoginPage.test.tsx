import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    tokenPayload: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../services/auth-service', () => ({
  loginRequest: vi.fn(),
}));

describe('LoginPage', () => {
  it('exibe o link de esqueci minha senha no login', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(html).toContain('href="/forgot-password"');
  });
});