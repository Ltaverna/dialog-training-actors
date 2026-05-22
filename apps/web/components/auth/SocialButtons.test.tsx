import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@dialog/data';
import { useAuth } from '@dialog/data';
import { toast } from 'sonner';
import { SocialButtons } from './SocialButtons';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn() }));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

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

describe('SocialButtons', () => {
  it('llama signInWithGoogle al hacer click en el botón de Google', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('llama signInWithApple al hacer click en el botón de Apple', async () => {
    const signInWithApple = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithApple }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /apple/i }));
    expect(signInWithApple).toHaveBeenCalledTimes(1);
  });

  it('ignora silenciosamente el popup cancelado (no muestra toast)', async () => {
    const signInWithGoogle = vi
      .fn()
      .mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('muestra un toast con el mensaje traducido ante otros errores', async () => {
    const signInWithGoogle = vi
      .fn()
      .mockRejectedValue({ code: 'auth/network-request-failed' });
    mockedUseAuth.mockReturnValue(mockAuth({ signInWithGoogle }));
    render(<SocialButtons />);
    await userEvent.click(screen.getByRole('button', { name: /google/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Sin conexión. Probá de nuevo.'),
    );
  });
});
