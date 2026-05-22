import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue, UseScriptsResult } from '@dialog/data';
import { useAuth, useScripts } from '@dialog/data';
import { MyScriptsScreen } from './MyScriptsScreen';

vi.mock('@dialog/data', () => ({ useAuth: vi.fn(), useScripts: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseScripts = vi.mocked(useScripts);

function mockAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: {
      uid: 'uid-1',
      email: 'actor@example.com',
      emailVerified: true,
    } as AuthContextValue['user'],
    status: 'signedIn',
    signUpWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithEmail: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signInWithApple: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockScripts(
  overrides: Partial<UseScriptsResult> = {},
): UseScriptsResult {
  return {
    scripts: [],
    status: 'ready',
    error: null,
    create: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MyScriptsScreen', () => {
  it('muestra el email del usuario y un estado vacío sin guiones', () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(mockScripts({ scripts: [] }));
    render(<MyScriptsScreen />);
    expect(screen.getByText('actor@example.com')).toBeInTheDocument();
    expect(screen.getByText(/todavía no tenés guiones/i)).toBeInTheDocument();
  });

  it('lista los guiones con enlaces para abrir', () => {
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({ scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }] }),
    );
    render(<MyScriptsScreen />);
    expect(screen.getByText('Hamlet')).toBeInTheDocument();
    const open = screen.getByRole('link', { name: 'Abrir' });
    expect(open).toHaveAttribute('href', '/scripts/s1');
  });

  it('crea un guion del usuario al hacer click en "+ Nuevo guion"', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(mockScripts({ create }));
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: /nuevo guion/i }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect((create.mock.calls[0] as [{ ownerUid: string }])[0].ownerUid).toBe('uid-1');
  });

  it('borra un guion tras confirmar', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({
        scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }],
        remove,
      }),
    );
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('s1'));
  });

  it('no borra si el usuario cancela la confirmación', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockedUseAuth.mockReturnValue(mockAuth());
    mockedUseScripts.mockReturnValue(
      mockScripts({
        scripts: [{ id: 's1', title: 'Hamlet', updatedAt: 1 }],
        remove,
      }),
    );
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(remove).not.toHaveBeenCalled();
  });

  it('cierra sesión al hacer click en "Cerrar sesión"', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue(mockAuth({ signOut }));
    mockedUseScripts.mockReturnValue(mockScripts());
    render(<MyScriptsScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it('muestra el banner de email no verificado solo si corresponde', () => {
    mockedUseAuth.mockReturnValue(
      mockAuth({
        user: {
          uid: 'uid-1',
          email: 'actor@example.com',
          emailVerified: false,
        } as AuthContextValue['user'],
      }),
    );
    mockedUseScripts.mockReturnValue(mockScripts());
    render(<MyScriptsScreen />);
    expect(screen.getByText(/verificá tu email/i)).toBeInTheDocument();
  });
});
