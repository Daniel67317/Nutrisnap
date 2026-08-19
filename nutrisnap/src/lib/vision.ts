import { FOODS, FOODS_BY_ID } from './data';
import type { BoundingBox, Food, MealItem } from './types';
import type { PreparedImage } from './image';
import { checkAccess } from './access';

/* ── Adaptador de visión ───────────────────────────────────────────────────
   La UI del analizador NUNCA llama a una API. Llama a un `VisionProvider`.
   Hoy hay uno simulado; mañana habrá uno que hable con un backend propio.
   El cambio es una línea en `activeProvider` y ni un componente se entera.

   Por qué un backend y no llamar a la API desde el navegador: una clave de
   API en el frontend es una clave pública. Cualquiera abre las herramientas
   de desarrollo, la copia y consume la cuota. No hay forma de ofuscarla.
   ------------------------------------------------------------------------ */

export type { BoundingBox };

export interface Detection {
  foodId: string;
  grams: number;
  /** 0-1. Por debajo de 0.5 la UI debe pedir confirmación explícita. */
  confidence: number;
  box: BoundingBox;
}

export interface VisionProvider {
  readonly id: string;
  analyze(image: PreparedImage, signal?: AbortSignal): Promise<Detection[]>;
}

export class VisionError extends Error {
  constructor(
    message: string,
    readonly kind: 'cancelado' | 'red' | 'sin-comida' | 'desconocido',
  ) {
    super(message);
    this.name = 'VisionError';
  }
}

/* ── Proveedor simulado ────────────────────────────────────────────────────
   No devuelve alimentos al azar. Compone un plato plausible (una proteína,
   un carbohidrato y un acompañamiento) porque una demo que junta "café +
   almendras + gaseosa" se lee inmediatamente como falsa.
   ------------------------------------------------------------------------ */

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const byCategory = (c: Food['category']) => FOODS.filter((f) => f.category === c);

/** Varía la ración ±30% para que dos escaneos nunca den lo mismo. */
function plausibleGrams(food: Food): number {
  const jitter = 0.7 + Math.random() * 0.6;
  const grams = food.portionG * jitter;
  return Math.max(10, Math.round(grams / 5) * 5);
}

/** Reparte cajas sin solaparlas: un plato leído en cuadrantes. */
function layoutBoxes(count: number): BoundingBox[] {
  const slots: BoundingBox[] = [
    { x: 12, y: 16, w: 40, h: 38 },
    { x: 54, y: 22, w: 34, h: 34 },
    { x: 20, y: 58, w: 36, h: 30 },
    { x: 60, y: 60, w: 28, h: 26 },
  ];
  return slots.slice(0, count).map((b) => ({
    x: b.x + (Math.random() * 6 - 3),
    y: b.y + (Math.random() * 6 - 3),
    w: b.w,
    h: b.h,
  }));
}

export class MockVisionProvider implements VisionProvider {
  readonly id = 'mock';

  async analyze(_image: PreparedImage, signal?: AbortSignal): Promise<Detection[]> {
    // 2-3 s: el tiempo real de un modelo de visión sobre una foto de 720 px.
    await new Promise<void>((resolve, reject) => {
      const delay = 2000 + Math.random() * 1000;
      const timer = setTimeout(resolve, delay);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new VisionError('Análisis cancelado.', 'cancelado'));
      });
    });

    const plate: Food[] = [
      pick(byCategory('proteina')),
      pick(byCategory('carbohidrato')),
      pick([...byCategory('verdura'), ...byCategory('grasa')]),
    ];
    // A veces aparece un cuarto elemento, como en un plato real.
    if (Math.random() > 0.45) plate.push(pick(byCategory('fruta')));

    const boxes = layoutBoxes(plate.length);

    return plate.map((food, i) => ({
      foodId: food.id,
      grams: plausibleGrams(food),
      confidence: 0.62 + Math.random() * 0.33,
      box: boxes[i],
    }));
  }
}

/* ── Punto de intercambio ────────────────────────────────────────────────── */

let activeProvider: VisionProvider = new MockVisionProvider();

/** Para conectar la API real: `setVisionProvider(new ApiVisionProvider())`. */
export function setVisionProvider(provider: VisionProvider): void {
  activeProvider = provider;
}

/**
 * Único camino de entrada al análisis de foto.
 * Comprueba el acceso, delega en el proveedor activo y traduce el resultado
 * a los `MealItem` que ya entiende el resto de la app.
 */
export async function analyzeMeal(
  image: PreparedImage,
  signal?: AbortSignal,
): Promise<MealItem[]> {
  const access = checkAccess('analisis-foto');
  if (!access.allowed) throw new VisionError(access.reason, 'desconocido');

  const detections = await activeProvider.analyze(image, signal);

  if (detections.length === 0) {
    throw new VisionError(
      'No reconocimos comida en esta foto. Prueba con más luz o descríbela en el chat.',
      'sin-comida',
    );
  }

  return detections.flatMap<MealItem>((d) => {
    const food = FOODS_BY_ID[d.foodId];
    if (!food) return [];
    return [
      {
        foodId: food.id,
        name: food.name,
        emoji: food.emoji,
        grams: d.grams,
        box: d.box,
        confidence: d.confidence,
      },
    ];
  });
}
