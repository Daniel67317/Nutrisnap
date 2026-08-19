import type {
  BodyType,
  Food,
  Gender,
  Goal,
  Macros,
  MealItem,
  NutritionTargets,
  TargetNote,
  TrainingFrequency,
  UserProfile,
} from './types';
import { FOODS_BY_ID } from './data';

/* ── Motor de objetivos calóricos ──────────────────────────────────────────
   Cadena: medidas → BMR (Mifflin-St Jeor) → TDEE (factor de actividad) →
   objetivo (déficit/superávit) → PISO DE SEGURIDAD → reparto de macros.

   Mifflin-St Jeor es el estándar clínico actual para estimar el metabolismo
   basal; la usamos en vez de Harris-Benedict porque tiene menor error en
   población con sobrepeso, que es buena parte de nuestro público.
   ------------------------------------------------------------------------ */

/** Rangos aceptados en los campos de perfil. Fuera de esto, el dato se
    considera un error de digitación y no un cuerpo humano plausible. */
export const LIMITS = {
  age: { min: 13, max: 100 },
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 120, max: 230 },
} as const;

export type LimitKey = keyof typeof LIMITS;

export function withinLimits(value: number, key: LimitKey): boolean {
  const { min, max } = LIMITS[key];
  return value >= min && value <= max;
}

/** Estimaciones cuando el usuario se salta los datos opcionales. */
const DEFAULT_MEASURES: Record<Gender, Record<BodyType, { weightKg: number; heightCm: number }>> = {
  hombre: {
    delgado: { weightKg: 65, heightCm: 175 },
    normal: { weightKg: 75, heightCm: 175 },
    sobrepeso: { weightKg: 90, heightCm: 175 },
  },
  mujer: {
    delgado: { weightKg: 52, heightCm: 162 },
    normal: { weightKg: 62, heightCm: 162 },
    sobrepeso: { weightKg: 76, heightCm: 162 },
  },
};

const DEFAULT_AGE = 28;

const ACTIVITY_FACTOR: Record<TrainingFrequency, number> = {
  ninguno: 1.2,
  '1-2': 1.375,
  '3-4': 1.465,
  '5-6': 1.55,
  diario: 1.65,
};

/** Ajuste calórico sobre el TDEE, por objetivo. */
const GOAL_MULTIPLIER: Record<Goal, number> = {
  'perder-grasa': 0.82, // déficit del 18% (rango pedido: 15-20%)
  mantener: 1,
  'ganar-musculo': 1.1, // superávit del 10%
};

/** Gramos de proteína por kg de peso corporal. */
const PROTEIN_PER_KG: Record<Goal, number> = {
  'perder-grasa': 2.0, // proteína alta protege masa magra en déficit
  mantener: 1.6,
  'ganar-musculo': 1.8,
};

/* ── Pisos de seguridad ───────────────────────────────────────────────────
   Un cálculo puede dar una cifra matemáticamente correcta y aun así ser una
   mala recomendación: persona pequeña + sedentaria + déficit agresivo puede
   caer por debajo de su propio metabolismo basal. La app nunca propone eso.

   Dos reglas, la que sea más alta manda:
     1. Nunca por debajo del BMR (el gasto en reposo).
     2. Nunca por debajo del mínimo general para adultos sin supervisión
        médica (referencia habitual: 1.500 kcal hombres / 1.200 mujeres).
   ------------------------------------------------------------------------ */
const ABSOLUTE_FLOOR: Record<Gender, number> = { hombre: 1500, mujer: 1200 };

/** Devuelve las medidas reales o las estimadas, y si hubo estimación. */
export function resolveMeasures(profile: UserProfile) {
  const fallback = DEFAULT_MEASURES[profile.gender][profile.bodyType];

  // Un valor fuera de rango se descarta en favor del promedio: preferimos una
  // estimación honesta antes que un cálculo basado en un dedazo.
  const valid = (v: number | undefined, k: LimitKey) =>
    v !== undefined && withinLimits(v, k) ? v : undefined;

  const weightKg = valid(profile.weightKg, 'weightKg') ?? fallback.weightKg;
  const heightCm = valid(profile.heightCm, 'heightCm') ?? fallback.heightCm;
  const age = valid(profile.age, 'age') ?? DEFAULT_AGE;

  const estimated =
    valid(profile.weightKg, 'weightKg') === undefined ||
    valid(profile.heightCm, 'heightCm') === undefined ||
    valid(profile.age, 'age') === undefined;

  return { weightKg, heightCm, age, estimated };
}

/** Metabolismo basal — Mifflin-St Jeor. */
export function calcBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'hombre' ? base + 5 : base - 161;
}

/** Objetivos diarios completos a partir del perfil. */
export function calcTargets(profile: UserProfile): NutritionTargets {
  const { weightKg, heightCm, age, estimated } = resolveMeasures(profile);
  const notes: TargetNote[] = [];

  const bmr = calcBMR(profile.gender, weightKg, heightCm, age);
  const tdee = bmr * ACTIVITY_FACTOR[profile.trainingFrequency];

  // Menores de edad: en crecimiento, un déficit calórico dirigido por una app
  // no es apropiado. Mantenemos calorías de mantenimiento y lo decimos.
  const isMinor = age < 18;
  const multiplier = isMinor ? 1 : GOAL_MULTIPLIER[profile.goal];
  if (isMinor && profile.goal !== 'mantener') notes.push('menor-de-edad');

  const raw = tdee * multiplier;
  const floor = Math.max(bmr, ABSOLUTE_FLOOR[profile.gender]);
  const safe = Math.max(raw, floor);
  if (safe > raw + 1) notes.push('minimo-seguro');

  const calories = Math.round(safe / 10) * 10;

  // Si forzamos mantenimiento, la proteína también debe seguir mantenimiento:
  // dejar 2 g/kg de "perder grasa" sobre calorías de mantenimiento produce un
  // reparto que no corresponde a ningún objetivo real.
  const effectiveGoal = isMinor ? 'mantener' : profile.goal;

  // Proteína por peso corporal, pero nunca por encima del 40% de las calorías.
  // Sin este tope, un peso alto en el extremo del rango genera objetivos de
  // proteína que no caben en el presupuesto calórico y dejan los carbos en 0.
  const proteinByWeight = weightKg * PROTEIN_PER_KG[effectiveGoal];
  const protein = Math.round(Math.min(proteinByWeight, (calories * 0.4) / 4));

  // Grasa: 25% de las calorías, con piso de 0.7 g/kg por salud hormonal y
  // techo del 35% para que siempre quede presupuesto de carbohidratos.
  const fatFromPct = (calories * 0.25) / 9;
  const fat = Math.round(
    Math.min(Math.max(fatFromPct, weightKg * 0.7), (calories * 0.35) / 9),
  );

  // Carbohidratos: lo que sobra. Con los topes anteriores, siempre > 0.
  const remaining = calories - protein * 4 - fat * 9;
  const carbs = Math.max(Math.round(remaining / 4), 0);

  if (estimated) notes.push('estimado');

  return { calories, protein, carbs, fat, notes };
}

/** Copy asociado a cada aviso. Vive junto al cálculo para que no se
    desincronice de la lógica que lo dispara. */
export const TARGET_NOTE_COPY: Record<TargetNote, string> = {
  estimado:
    'Calculado con valores promedio. Agrega tu peso y estatura en Perfil para afinarlo.',
  'minimo-seguro':
    'Ajustamos tu objetivo hacia arriba: bajar de aquí no es recomendable sin acompañamiento profesional.',
  'menor-de-edad':
    'Como aún estás en crecimiento, usamos calorías de mantenimiento. Para cambiar de objetivo, háblalo antes con un profesional de la salud.',
};

/* ── Suma de macros ───────────────────────────────────────────────────────── */

export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Macros de un alimento para una cantidad concreta en gramos. */
export function macrosFor(food: Food, grams: number): Macros {
  const k = grams / 100;
  return {
    calories: food.kcal * k,
    protein: food.protein * k,
    carbs: food.carbs * k,
    fat: food.fat * k,
  };
}

/** Total de una lista de items, redondeado una sola vez al final. */
export function sumMeal(items: MealItem[]): Macros {
  const total = items.reduce<Macros>((acc, item) => {
    const food = FOODS_BY_ID[item.foodId];
    if (!food) return acc;
    const m = macrosFor(food, item.grams);
    return {
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    };
  }, EMPTY_MACROS);

  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

/* ── Utilidades de formato ────────────────────────────────────────────────── */

/** 1450 → "1.450"  (separador de miles en español) */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('es-CO');
}

/** Todo dato nutricional se muestra como aproximación. Nunca prometemos exactitud. */
export function formatKcal(n: number): string {
  return `≈ ${formatNumber(n)} kcal`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
