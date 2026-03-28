import { describe, expect, it, vi } from 'vitest';
import { confirmPasswordReset, isPublicEndpoint, requestPasswordReset } from './auth-service';
import { requestBackEnd } from '../utils/request';

vi.mock('../utils/request', () => ({
  requestBackEnd: vi.fn(),
}));

describe('auth-service password reset', () => {
  it('marca os endpoints de recuperacao de senha como publicos', () => {
    expect(isPublicEndpoint('/auth/password-reset/request', 'POST')).toBe(true);
    expect(isPublicEndpoint('/auth/password-reset/confirm', 'POST')).toBe(true);
  });

  it('envia a solicitacao de reset para o endpoint publico correto', () => {
    requestPasswordReset({ email: 'qa.reset@example.com' });

    expect(requestBackEnd).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/password-reset/request',
      data: { email: 'qa.reset@example.com' },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('envia a confirmacao de reset para o endpoint publico correto', () => {
    confirmPasswordReset({
      token: 'raw-token',
      newPassword: 'NovaSenha123',
      confirmPassword: 'NovaSenha123',
    });

    expect(requestBackEnd).toHaveBeenCalledWith({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      data: {
        token: 'raw-token',
        newPassword: 'NovaSenha123',
        confirmPassword: 'NovaSenha123',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });
});