import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildStarterScript } from '@/lib/demoScript';
import { ScriptViewer } from './ScriptViewer';

describe('ScriptViewer', () => {
  it('renderiza el título, la escena y las líneas con su personaje', () => {
    const script = buildStarterScript('owner-1');
    render(<ScriptViewer script={script} />);

    expect(
      screen.getByRole('heading', { name: 'Escena de práctica' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acto I' })).toBeInTheDocument();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeInTheDocument();
    expect(screen.getByText('Hamlet:')).toBeInTheDocument();
    expect(screen.getByText('Ofelia:')).toBeInTheDocument();
  });
});
