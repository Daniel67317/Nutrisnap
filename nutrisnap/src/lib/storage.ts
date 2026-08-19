import type { AppState } from './types';

const KEY = 'nutrisnap:state';
const VERSION = 1;

export const INITIAL_STATE: AppState = {
  version: VERSION,
  onboarded: false,
  cameraPermission: 'sin-preguntar',
  profile: null,
  meals: [],
  streak: 0,
  weightLog: [],
  completedExercises: {},
  lastLoggedDate: null,
  suggestions: [],
};

/* ── Identificadores ───────────────────────────────────────────────────────
   `crypto.randomUUID()` sólo existe en contexto seguro (https o localhost).
   Probar en el móvil con `npm run dev -- --host` sirve la app por HTTP plano
   sobre una IP de red local: ahí `randomUUID` es undefined y guardar una
   comida revienta. Fallback obligatorio, no opcional.
   ------------------------------------------------------------------------ */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ── Persistencia ─────────────────────────────────────────────────────────
   localStorage puede fallar de verdad: modo privado en Safari, cuota llena,
   almacenamiento bloqueado. Nunca dejamos que eso tumbe la app.
   ------------------------------------------------------------------------ */

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return INITIAL_STATE;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    // Si el esquema cambió entre versiones, empezamos limpio en vez de
    // arrastrar datos incompatibles que rompan pantallas.
    if (parsed.version !== VERSION) return INITIAL_STATE;

    // Un JSON válido no garantiza una forma válida: una extensión, una
    // pestaña vieja o una escritura a medias pueden dejar `meals` como
    // objeto. Sin esta comprobación, `.filter` revienta en el primer render
    // y la app no arranca nunca más para esa persona.
    return {
      ...INITIAL_STATE,
      ...parsed,
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      weightLog: Array.isArray(parsed.weightLog) ? parsed.weightLog : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      completedExercises:
        parsed.completedExercises && typeof parsed.completedExercises === 'object'
          ? parsed.completedExercises
          : {},
    };
  } catch {
    return INITIAL_STATE;
  }
}

/**
 * Guarda el estado. Si la cuota revienta (localStorage son ~5 MB y las fotos
 * en base64 se los comen rápido), reintenta soltando las fotos de las comidas
 * más antiguas antes que perder el registro nutricional, que es lo que de
 * verdad importa.
 */
export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    try {
      const slim: AppState = {
        ...state,
        meals: state.meals.map((m, i) => (i < 8 ? m : { ...m, photo: undefined })),
      };
      localStorage.setItem(KEY, JSON.stringify(slim));
      return true;
    } catch {
      // Sin persistencia, pero la sesión actual sigue funcionando en memoria.
      return false;
    }
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Clave de día local (YYYY-MM-DD) — la usamos para rachas y "el día de hoy". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Racha vigente HOY. `state.streak` sólo se recalcula al guardar una comida,
 * así que tras varios días sin registrar seguiría mostrando el número viejo.
 * Todo lo que muestre la racha debe pasar por aquí.
 */
export function currentStreak(streak: number, lastLoggedDate: string | null): number {
  if (!lastLoggedDate) return 0;
  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  // Ayer todavía cuenta: aún estás a tiempo de mantenerla viva hoy.
  return lastLoggedDate === today || lastLoggedDate === yesterday ? streak : 0;
}

/** Racha: +1 si el último registro fue ayer, 1 si se rompió, igual si es hoy. */
export function nextStreak(current: number, lastLoggedDate: string | null): number {
  const today = dayKey();
  if (lastLoggedDate === today) return current;

  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  return lastLoggedDate === yesterday ? current + 1 : 1;
}
