import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { RegisterForm } from './RegisterForm';

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

describe('RegisterForm', () => {
  it('llama signUpWithEmail con email y contraseña válidos', async () => {
    const signUpWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'nuevo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() =>
      expect(signUpWithEmail).toHaveBeenCalledWith(
        'nuevo@example.com',
        'secret123',
      ),
    );
  });

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const signUpWithEmail = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'nuevo@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'corta');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it('muestra el error de Firebase traducido si el email ya existe', async () => {
    const signUpWithEmail = vi
      .fn()
      .mockRejectedValue({ code: 'auth/email-already-in-use' });
    mockedUseAuth.mockReturnValue(mockAuth({ signUpWithEmail }));
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'existe@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(
      await screen.findByText('Ya existe una cuenta con ese email.'),
    ).toBeInTheDocument();
  });
});
