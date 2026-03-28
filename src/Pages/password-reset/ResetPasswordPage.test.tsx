// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from './ResetPasswordPage';
import { confirmPasswordReset } from '../../services/auth-service';

vi.mock('../../services/auth-service', () => ({
  confirmPasswordReset: vi.fn(),
}));

const confirmPasswordResetMock = vi.mocked(confirmPasswordReset);
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ResetPasswordPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.history.pushState({}, '', '/reset-password?token=raw-token');
  });

  afterEach(async () => {
    confirmPasswordResetMock.mockReset();
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
    window.history.pushState({}, '', '/reset-password');
  });

  it('trata sucesso na redefinicao', async () => {
    confirmPasswordResetMock.mockResolvedValue({
      data: { message: 'Senha redefinida com sucesso.' },
    } as never);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<ResetPasswordPage />);
    });

    const inputs = container.querySelectorAll('input[type="password"]');
    const form = container.querySelector('form') as HTMLFormElement;

    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'NovaSenha123');
      setInputValue(inputs[1] as HTMLInputElement, 'NovaSenha123');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(confirmPasswordResetMock).toHaveBeenCalledWith({
      token: 'raw-token',
      newPassword: 'NovaSenha123',
      confirmPassword: 'NovaSenha123',
    });
    expect(container.textContent).toContain('Senha redefinida com sucesso.');
  });

  it('trata token expirado retornado pelo backend', async () => {
    confirmPasswordResetMock.mockRejectedValue({
      response: {
        data: {
          message: 'Token de redefinicao expirado.',
        },
      },
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<ResetPasswordPage />);
    });

    const inputs = container.querySelectorAll('input[type="password"]');
    const form = container.querySelector('form') as HTMLFormElement;

    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'NovaSenha123');
      setInputValue(inputs[1] as HTMLInputElement, 'NovaSenha123');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Token de redefinicao expirado.');
  });
});
