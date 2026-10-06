// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const loginMock = vi.hoisted(() => vi.fn());
const loginRequestMock = vi.hoisted(() => vi.fn());
const getAccessTokenPayloadMock = vi.hoisted(() => vi.fn());
const managedFarmsMock = vi.hoisted(() => vi.fn());

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    tokenPayload: null,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

vi.mock('../../services/auth-service', () => ({
  loginRequest: loginRequestMock,
  getAccessTokenPayload: getAccessTokenPayloadMock,
}));

vi.mock('../../api/GoatFarmAPI/goatFarm', () => ({
  getManagedFarmsPaginated: managedFarmsMock,
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('LoginPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    loginMock.mockReset();
    loginRequestMock.mockReset();
    getAccessTokenPayloadMock.mockReset();
    managedFarmsMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('exibe o link de esqueci minha senha no login', () => {
    act(() => {
      root.render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
      );
    });

    expect(container.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it('retorna para a rota protegida original preservando search e hash', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });

    await act(async () => {
      root.render(
        <MemoryRouter
          initialEntries={[{
            pathname: '/login',
            state: {
              from: {
                pathname: '/app/goatfarms/1/commercial',
                search: '?tab=finance',
                hash: '#receivables',
              },
            },
          }]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const form = container.querySelector('form') as HTMLFormElement;
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      setInputValue(inputs[0] as HTMLInputElement, 'owner@example.com');
      setInputValue(inputs[1] as HTMLInputElement, 'secret');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(loginRequestMock).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'secret' });
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe(
      '/app/goatfarms/1/commercial?tab=finance#receivables'
    );
  });

  it('usa o fallback seguro no login direto ou com destino externo', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue(undefined);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: 'https://evil.example' } }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/fazendas');
  });

  it('leva FARM_OWNER com uma única fazenda diretamente ao dashboard', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue({ authorities: ['ROLE_FARM_OWNER'] });
    managedFarmsMock.mockResolvedValue({ content: [{ id: 7, name: 'Capril', tod: '14008' }], page: { totalElements: 1 } });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
    });
    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });

    expect(managedFarmsMock).toHaveBeenCalledWith(0, 2);
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/app/goatfarms/7/dashboard');
  });

  it('leva FARM_OWNER sem fazendas gerenciáveis ao seletor privado', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue({ authorities: ['ROLE_FARM_OWNER'] });
    managedFarmsMock.mockResolvedValue({ content: [], page: { totalElements: 0 } });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
    });
    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });

    expect(managedFarmsMock).toHaveBeenCalledWith(0, 2);
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/app/goatfarms');
  });

  it('leva OPERATOR com múltiplas fazendas gerenciáveis ao seletor privado', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue({ authorities: ['ROLE_OPERATOR'] });
    managedFarmsMock.mockResolvedValue({
      content: [{ id: 7 }, { id: 19 }],
      page: { totalElements: 2 },
    });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
    });
    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });

    expect(managedFarmsMock).toHaveBeenCalledWith(0, 2);
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/app/goatfarms');
  });

  it('leva ADMIN sempre ao seletor sem consultar fazendas', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue({ authorities: ['ROLE_ADMIN'] });

    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
    });
    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });

    expect(managedFarmsMock).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/app/goatfarms');
  });

  it('mantém o usuário no seletor quando a descoberta falha após login', async () => {
    loginRequestMock.mockResolvedValue({ data: { accessToken: 'token' } });
    getAccessTokenPayloadMock.mockReturnValue({ authorities: ['ROLE_OPERATOR'] });
    managedFarmsMock.mockRejectedValue(new Error('offline'));

    await act(async () => {
      root.render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<LocationProbe />} /></Routes></MemoryRouter>);
    });
    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await Promise.resolve(); });

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe('/app/goatfarms');
    expect(container.textContent).not.toContain('Falha no login');
  });

  it('não navega quando a autenticação falha', async () => {
    loginRequestMock.mockRejectedValue(new Error('invalid credentials'));

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/app/goatfarms/1/dashboard' } } }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const form = container.querySelector('form') as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="location"]')).toBeNull();
    expect(container.textContent).toContain('Falha no login');
  });
});
