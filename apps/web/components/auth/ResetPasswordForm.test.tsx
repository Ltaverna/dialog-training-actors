import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { ResetPasswordForm } from './ResetPasswordForm';

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

describe('ResetPasswordForm', () => {
  it('llama sendPasswordReset y muestra el mensaje de éxito', async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ sendPasswordReset }));
    render(<ResetPasswordForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'actor@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() =>
      expect(sendPasswordReset).toHaveBeenCalledWith('actor@example.com'),
    );
    expect(
      await screen.findByText(/te enviamos un link/i),
    ).toBeInTheDocument();
  });

  it('valida el email antes de enviar', async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ sendPasswordReset }));
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'no-es-email');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });
});
