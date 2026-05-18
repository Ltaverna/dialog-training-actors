import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('muestra el título del guion de muestra y sus líneas', () => {
    render(<Home />);

    expect(screen.getByText('Escena de práctica')).toBeInTheDocument();
    expect(screen.getByText('Acto I')).toBeInTheDocument();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeInTheDocument();
  });
});
