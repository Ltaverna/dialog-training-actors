import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('muestra el título del guion de muestra y sus líneas', () => {
    render(<App />);

    expect(screen.getByText('Escena de práctica')).toBeTruthy();
    expect(
      screen.getByText('Ser o no ser, esa es la cuestión.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Mi señor, ¿cómo os encontráis?'),
    ).toBeTruthy();
  });
});
