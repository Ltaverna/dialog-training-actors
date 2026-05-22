import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AuthContextValue } from '@dialog/data';
import { useAuth, useFirebase, getScript } from '@dialog/data';
import { buildStarterScript } from '@/lib/demoScript';
import ScriptPage from './page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'script-1' }) }));
vi.mock('@dialog/data', () => ({
  useAuth: vi.fn(),
  useFirebase: vi.fn(),
  getScript: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseFirebase = vi.mocked(useFirebase);
const mockedGetScript = vi.mocked(getScript);

function signedInAuth(): AuthContextValue {
  return {
    user: { uid: 'uid-1', email: 'a@example.com' } as AuthContextValue['user'],
    status: 'signedIn',
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
    sendPasswordReset: vi.fn(),
    signOut: vi.fn(),
  } as AuthContextValue;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseFirebase.mockReturnValue({
    app: {},
    auth: {},
    db: {},
  } as ReturnType<typeof useFirebase>);
});

describe('ScriptPage', () => {
  it('carga y renderiza el guion', async () => {
    mockedUseAuth.mockReturnValue(signedInAuth());
    mockedGetScript.mockResolvedValue(buildStarterScript('uid-1'));
    render(<ScriptPage />);
    expect(
      await screen.findByRole('heading', { name: 'Escena de práctica' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver/i })).toBeInTheDocument();
  });

  it('muestra "no encontrado" si el guion no existe', async () => {
    mockedUseAuth.mockReturnValue(signedInAuth());
    mockedGetScript.mockResolvedValue(null);
    render(<ScriptPage />);
    expect(
      await screen.findByText(/no encontramos ese guion/i),
    ).toBeInTheDocument();
  });

  it('pide iniciar sesión si no hay sesión', () => {
    mockedUseAuth.mockReturnValue({
      ...signedInAuth(),
      status: 'signedOut',
      user: null,
    });
    render(<ScriptPage />);
    expect(screen.getByText(/iniciá sesión/i)).toBeInTheDocument();
    expect(mockedGetScript).not.toHaveBeenCalled();
  });

  it('muestra un mensaje de error si getScript rechaza', async () => {
    mockedUseAuth.mockReturnValue(signedInAuth());
    mockedGetScript.mockRejectedValue(new Error('boom'));
    render(<ScriptPage />);
    expect(
      await screen.findByText(/no pudimos cargar el guion/i),
    ).toBeInTheDocument();
  });

  it('no llama getScript mientras la sesión está cargando', () => {
    mockedUseAuth.mockReturnValue({
      ...signedInAuth(),
      status: 'loading',
      user: null,
    });
    render(<ScriptPage />);
    expect(mockedGetScript).not.toHaveBeenCalled();
  });
});
