import type { Gender, Goal, Macros, NutritionTargets, TrainingFrequency, UserProfile } from './types';

/* ── Motor de entrenamiento ────────────────────────────────────────────────
   Genera el split semanal y la sesión de hoy. La misma función alimenta la
   tarjeta del Dashboard y (más adelante) la pantalla de Planes: una sola
   verdad, cero riesgo de que el Dashboard sugiera "Pierna" y Planes muestre
   otra cosa el mismo día.
   ------------------------------------------------------------------------ */

export type SessionType =
  | 'empuje'
  | 'tiron'
  | 'pierna'
  | 'full-body'
  | 'cardio'
  | 'hiit'
  | 'movilidad'
  | 'descanso';

export interface Session {
  type: SessionType;
  /** Nombre corto para la tarjeta: "Empuje", "Pierna", "HIIT". */
  title: string;
  /** Músculos o intención de la sesión. */
  focus: string;
  durationMin: number;
  intensity: 'suave' | 'moderada' | 'alta';
}

/** Índice 0 = lunes. Coincide con el calendario horizontal L·M·X·J·V·S·D. */
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/* Plantillas base por frecuencia declarada en el onboarding. */
const TEMPLATES: Record<TrainingFrequency, SessionType[]> = {
  ninguno: ['movilidad', 'descanso', 'cardio', 'descanso', 'movilidad', 'descanso', 'descanso'],
  '1-2': ['full-body', 'descanso', 'descanso', 'full-body', 'descanso', 'descanso', 'descanso'],
  '3-4': ['empuje', 'tiron', 'descanso', 'pierna', 'descanso', 'full-body', 'descanso'],
  '5-6': ['empuje', 'tiron', 'pierna', 'empuje', 'tiron', 'pierna', 'descanso'],
  diario: ['empuje', 'tiron', 'pierna', 'empuje', 'tiron', 'pierna', 'movilidad'],
};

/**
 * El objetivo no cambia el esqueleto del split, sólo reasigna la última
 * sesión "comodín". Cambiar el split entero por objetivo produce planes
 * incoherentes cuando alguien pasa de definir a mantener.
 */
function applyGoal(week: SessionType[], goal: Goal): SessionType[] {
  const out = [...week];
  const wildcard = out.lastIndexOf('full-body');

  if (goal === 'perder-grasa') {
    // Un bloque de alta intensidad, sin sacrificar días de fuerza: en déficit,
    // la fuerza es lo que protege la masa magra.
    if (wildcard !== -1) out[wildcard] = 'hiit';
    else {
      const rest = out.indexOf('descanso');
      if (rest !== -1) out[rest] = 'hiit';
    }
  } else if (goal === 'mantener' && wildcard === -1) {
    const rest = out.indexOf('descanso');
    if (rest !== -1) out[rest] = 'cardio';
  }
  // ganar-musculo: se queda como está. El descanso también entrena.

  return out;
}

/** El énfasis cambia; los grupos musculares no. */
function focusFor(type: SessionType, gender: Gender): string {
  switch (type) {
    case 'empuje':
      return 'Pecho, hombro y tríceps';
    case 'tiron':
      return 'Espalda, dorsal y bíceps';
    case 'pierna':
      return gender === 'mujer'
        ? 'Glúteo, isquios y cuádriceps'
        : 'Cuádriceps, isquios y glúteo';
    case 'full-body':
      return 'Cuerpo completo, compuestos';
    case 'cardio':
      return 'Zona 2, ritmo conversable';
    case 'hiit':
      return 'Intervalos cortos, alta intensidad';
    case 'movilidad':
      return 'Cadera, columna y hombro';
    case 'descanso':
      return 'Recuperación';
  }
}

const SESSION_META: Record<SessionType, { title: string; durationMin: number; intensity: Session['intensity'] }> = {
  empuje: { title: 'Empuje', durationMin: 55, intensity: 'alta' },
  tiron: { title: 'Tirón', durationMin: 55, intensity: 'alta' },
  pierna: { title: 'Pierna', durationMin: 60, intensity: 'alta' },
  'full-body': { title: 'Cuerpo completo', durationMin: 50, intensity: 'moderada' },
  cardio: { title: 'Cardio', durationMin: 35, intensity: 'suave' },
  hiit: { title: 'HIIT', durationMin: 20, intensity: 'alta' },
  movilidad: { title: 'Movilidad', durationMin: 20, intensity: 'suave' },
  descanso: { title: 'Descanso', durationMin: 0, intensity: 'suave' },
};

function toSession(type: SessionType, gender: Gender): Session {
  const meta = SESSION_META[type];
  return { type, ...meta, focus: focusFor(type, gender) };
}

/** Split de los 7 días, empezando en lunes. */
export function getWeekPlan(profile: UserProfile): Session[] {
  const week = applyGoal(TEMPLATES[profile.trainingFrequency], profile.goal);
  return week.map((t) => toSession(t, profile.gender));
}

/** Sesión de hoy. `getDay()` devuelve 0=domingo, así que lo rotamos a lunes. */
export function getTodaySession(profile: UserProfile, date = new Date()): Session {
  const index = (date.getDay() + 6) % 7;
  return getWeekPlan(profile)[index];
}

/* ── Nota del entrenador ───────────────────────────────────────────────────
   La parte "IA" visible: una frase que conecta lo que pasó ayer con lo que
   toca hoy. Prioridad estricta — sólo se muestra una, y gana la más
   accionable. Tres avisos a la vez no es coaching, es ruido.
   ------------------------------------------------------------------------ */
export function getCoachNote(
  profile: UserProfile,
  targets: NutritionTargets,
  yesterday: Macros | null,
  session: Session,
): string {
  if (session.type === 'descanso') {
    return 'Hoy toca recuperar. Camina, duerme bien y llega entero al próximo entreno.';
  }

  if (yesterday && yesterday.calories > 0) {
    const proteinRatio = yesterday.protein / targets.protein;
    const calorieRatio = yesterday.calories / targets.calories;

    if (proteinRatio < 0.8) {
      return `Ayer cerraste con ${Math.round(yesterday.protein)} g de proteína de ${targets.protein}. Súmale una serie a cada ejercicio principal y apunta a la proteína desde el desayuno.`;
    }
    if (calorieRatio > 1.1 && profile.goal !== 'ganar-musculo') {
      const excess = Math.round(yesterday.calories - targets.calories);
      return `Ayer quedaste ≈${excess} kcal por encima. Cierra hoy con 12 min de intervalos y sigue tu plan normal.`;
    }
    if (proteinRatio >= 1 && calorieRatio <= 1.05) {
      return 'Ayer diste en el blanco con proteína y calorías. Hoy puedes subir el peso o una repetición en el primer ejercicio.';
    }
  }

  // Sin datos de ayer: la nota se apoya en el perfil.
  if (profile.bodyType === 'delgado' && profile.goal === 'ganar-musculo') {
    return 'Prioriza compuestos pesados y no te saltes comidas: en tu caso el estímulo sirve de poco sin el superávit.';
  }
  if (profile.bodyType === 'sobrepeso' && profile.goal === 'perder-grasa') {
    return 'Mantén la fuerza como base y deja el cardio para el final de la sesión. Constancia sobre intensidad.';
  }
  return `${session.durationMin} minutos bien hechos valen más que dos horas a medias. Empieza por lo pesado.`;
}
