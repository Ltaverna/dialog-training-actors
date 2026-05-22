import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import Home from './page';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

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

beforeEach(() => {
  vi.clearAllMocks();
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

  it('saluda con el email cuando hay sesión', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        status: 'signedIn',
        user: { email: 'actor@example.com' } as AuthContextValue['user'],
      }),
    );
    render(<Home />);
    expect(screen.getByText(/actor@example\.com/)).toBeInTheDocument();
  });
});
