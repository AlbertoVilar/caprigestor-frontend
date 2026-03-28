// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';
import { requestPasswordReset } from '../../services/auth-service';

vi.mock('../../services/auth-service', () => ({
  requestPasswordReset: vi.fn(),
}));

const requestPasswordResetMock = vi.mocked(requestPasswordReset);
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ForgotPasswordPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    requestPasswordResetMock.mockReset();
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('renderiza e envia a solicitacao exibindo a mensagem neutra', async () => {
    requestPasswordResetMock.mockResolvedValue({
      data: { message: 'Se existir uma conta com esse email, enviaremos um link de redefinicao.' },
    } as never);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<ForgotPasswordPage />);
    });

    const input = container.querySelector('input[type="email"]') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    await act(async () => {
      setInputValue(input, 'qa.reset@example.com');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(requestPasswordResetMock).toHaveBeenCalledWith({ email: 'qa.reset@example.com' });
    expect(container.textContent).toContain('Se existir uma conta com esse email, enviaremos um link de redefinicao.');
  });
});
