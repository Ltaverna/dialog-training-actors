// `crypto` es un global disponible en Node 19+, navegadores y Hermes (React
// Native). Se declara acotado acá para no tener que sumar la lib `DOM` —
// que rompería el carácter agnóstico de plataforma de este paquete.
declare const crypto: { randomUUID(): string };

/** Genera un identificador único (UUID v4). */
export function generateId(): string {
  return crypto.randomUUID();
}
