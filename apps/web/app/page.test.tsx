import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue, UseScriptsResult } from '@dialog/data';
import { useAuth, useScripts } from '@dialog/data';
import Home from './page';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn(), useScripts: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseScripts = vi.mocked(useScripts);

function mockAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null,
    status: 'signedOut',
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signInWithApple: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockScripts(): UseScriptsResult {
  return {
    scripts: [],
    status: 'ready',
    error: null,
    create: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseScripts.mockReturnValue(mockScripts());
});

describe('Home', () => {
  it('muestra "Cargando…" mientras el estado es loading', () => {
    mockedUseAuth.mockReturnValue(mockAuth({ status: 'loading' }));
    render(<Home />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('muestra la pantalla de autenticación cuando no hay sesión', () => {
    mockedUseAuth.mockReturnValue(mockAuth({ status: 'signedOut' }));
    render(<Home />);
    expect(screen.getByRole('tab', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('muestra "Mis guiones" cuando hay sesión', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        status: 'signedIn',
        user: {
          uid: 'uid-1',
          email: 'actor@example.com',
          emailVerified: true,
        } as AuthContextValue['user'],
      }),
    );
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: 'Mis guiones' }),
    ).toBeInTheDocument();
  });
});
