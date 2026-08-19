/* ── Dominio NutriSnap ─────────────────────────────────────────────────────
   Una sola fuente de verdad para las formas de datos. Todo lo que se guarda
   en localStorage pasa por aquí.
   ------------------------------------------------------------------------ */

/** Caja delimitadora en porcentaje (0-100). */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Gender = 'hombre' | 'mujer';

export type BodyType = 'delgado' | 'normal' | 'sobrepeso';

export type Goal = 'perder-grasa' | 'mantener' | 'ganar-musculo';

export type LogFrequency = 'una-vez' | 'dos-tres' | 'cuando-coma' | 'cada-comida';

export type TrainingFrequency = 'ninguno' | '1-2' | '3-4' | '5-6' | 'diario';

export type WorkoutMode = 'gimnasio' | 'calistenia';

/** Perfil construido en el onboarding y editable desde Ajustes. */
export interface UserProfile {
  gender: Gender;
  bodyType: BodyType;
  goal: Goal;
  /** Texto libre: "quiero bajar carbohidratos", "mejorar digestión"… */
  dietNotes: string;
  logFrequency: LogFrequency;
  trainingFrequency: TrainingFrequency;
  workoutMode: WorkoutMode;

  /** Opcionales — si faltan, se usan estimaciones por género + tipo de cuerpo. */
  name?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;

  createdAt: string;
}

/**
 * Avisos que acompañan a un objetivo calculado.
 * Son códigos y no texto: el copy vive en `TARGET_NOTE_COPY` y la UI decide
 * dónde mostrarlo. Así el motor de cálculo no sabe nada de redacción.
 */
export type TargetNote =
  /** Se usaron promedios porque faltan peso, estatura o edad. */
  | 'estimado'
  /** El objetivo se elevó hasta un mínimo seguro. */
  | 'minimo-seguro'
  /** Perfil menor de 18: se fuerzan calorías de mantenimiento. */
  | 'menor-de-edad';

/** Los 4 números que la app calcula, muestra y persigue todo el día. */
export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: TargetNote[];
}

/** Alimento en la base local (valores SIEMPRE por 100 g). */
export interface Food {
  id: string;
  name: string;
  /** Términos que el parser del chat debe reconocer. En minúsculas y sin tildes. */
  aliases: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Ración típica en gramos, para cuando el usuario no dice cantidad. */
  portionG: number;
  /** Peso de 1 unidad, si el alimento se cuenta ("2 huevos", "1 arepa"). */
  unitG?: number;
  emoji: string;
  category: FoodCategory;
}

export type FoodCategory =
  | 'proteina'
  | 'carbohidrato'
  | 'grasa'
  | 'fruta'
  | 'verdura'
  | 'lacteo'
  | 'bebida';

/** Un alimento ya cuantificado dentro de una comida. */
export interface MealItem {
  foodId: string;
  name: string;
  emoji: string;
  grams: number;
  /**
   * Caja delimitadora del detector, en % (0-100) sobre la imagen YA
   * preparada por `lib/image.ts` — no sobre la foto original. Si se miden
   * sobre el original y se pintan sobre la reducida, las cajas se desplazan.
   */
  box?: BoundingBox;
  /**
   * 0-1. Ausente = lo añadió la persona a mano, así que no hay nada que
   * dudar. Por debajo de 0.7 la UI dibuja la caja punteada con "?".
   */
  confidence?: number;
}

export type MealSource = 'foto' | 'chat' | 'manual';

export interface Meal {
  id: string;
  /** ISO date-time del registro. */
  loggedAt: string;
  source: MealSource;
  items: MealItem[];
  /** Data URL de la foto, si vino de la cámara. */
  photo?: string;
  totals: Macros;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Estado completo persistido en localStorage. */
export interface AppState {
  version: number;
  onboarded: boolean;
  cameraPermission: 'concedido' | 'denegado' | 'sin-preguntar';
  profile: UserProfile | null;
  meals: Meal[];
  /** Días consecutivos con al menos un registro. */
  streak: number;
  /** Historial de peso para la gráfica de Progreso. */
  weightLog: { date: string; kg: number }[];
  /** Ejercicios marcados por día: `{ '2026-08-17': ['sentadilla', ...] }`. */
  completedExercises: Record<string, string[]>;
  lastLoggedDate: string | null;
  suggestions: { text: string; sentAt: string }[];
}
