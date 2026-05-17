import type { LineId, Script } from './types';

export interface ValidationError {
  lineId: LineId;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Verifica la integridad referencial de un guion. Recorre las líneas en orden
 * y acumula un error por cada problema encontrado:
 * - una línea de diálogo sin personaje, o con un personaje inexistente;
 * - una acotación con personaje asignado;
 * - una línea cuya escena no existe;
 * - dos líneas con el mismo `order` dentro de una misma escena.
 */
export function validateScript(script: Script): ValidationResult {
  const characterIds = new Set(script.characters.map((c) => c.id));
  const sceneIds = new Set(script.scenes.map((s) => s.id));
  const seenOrderBySceneId = new Map<string, Set<number>>();
  const errors: ValidationError[] = [];

  for (const line of script.lines) {
    if (line.type === 'dialogue') {
      if (line.characterId === null) {
        errors.push({
          lineId: line.id,
          message: 'Una línea de diálogo debe tener un personaje asignado.',
        });
      } else if (!characterIds.has(line.characterId)) {
        errors.push({
          lineId: line.id,
          message: 'La línea referencia un personaje que no existe.',
        });
      }
    } else if (line.characterId !== null) {
      errors.push({
        lineId: line.id,
        message: 'Una acotación no debe tener un personaje asignado.',
      });
    }

    if (!sceneIds.has(line.sceneId)) {
      errors.push({
        lineId: line.id,
        message: 'La línea referencia una escena que no existe.',
      });
    }

    let seenOrders = seenOrderBySceneId.get(line.sceneId);
    if (seenOrders === undefined) {
      seenOrders = new Set<number>();
      seenOrderBySceneId.set(line.sceneId, seenOrders);
    }
    if (seenOrders.has(line.order)) {
      errors.push({
        lineId: line.id,
        message: 'Hay otra línea con el mismo order en la escena.',
      });
    } else {
      seenOrders.add(line.order);
    }
  }

  return { valid: errors.length === 0, errors };
}
