import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { LoginForm } from './LoginForm';

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

describe('LoginForm', () => {
  it('llama signInWithEmail con las credenciales ingresadas', async () => {
    const signInWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithEmail }));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(signInWithEmail).toHaveBeenCalledWith(
        'actor@example.com',
        'secret123',
      ),
    );
  });

  it('muestra un error de validación si el email es inválido', async () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'no-es-email');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
  });

  it('muestra el error de Firebase traducido cuando el login falla', async () => {
    const signInWithEmail = vi
      .fn()
      .mockRejectedValue({ code: 'auth/invalid-credential' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithEmail }));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(
      await screen.findByText('Email o contraseña incorrectos.'),
    ).toBeInTheDocument();
  });
});
