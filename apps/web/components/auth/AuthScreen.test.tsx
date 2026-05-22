import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { AuthScreen } from './AuthScreen';

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
  mockedUseAuth.mockReturnValue(mockAuth());
});

describe('AuthScreen', () => {
  it('muestra las pestañas de ingresar y crear cuenta', () => {
    render(<AuthScreen />);
    expect(screen.getByRole('tab', { name: 'Ingresar' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Crear cuenta' }),
    ).toBeInTheDocument();
  });

  it('cambia a la vista de reseteo y vuelve', async () => {
    render(<AuthScreen />);
    await userEvent.click(
      screen.getByRole('button', { name: /olvidaste tu contraseña/i }),
    );
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Ingresar' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('tab', { name: 'Ingresar' })).toBeInTheDocument();
  });
});
