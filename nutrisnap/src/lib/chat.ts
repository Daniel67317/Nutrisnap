import { FOODS } from './data';
import { formatNumber, macrosFor, sumMeal } from './nutrition';
import { getTodaySession } from './training';
import { checkAccess } from './access';
import type { Food, Macros, MealItem, NutritionTargets, UserProfile } from './types';

/* ── Nutri: parser y motor de respuestas ───────────────────────────────────
   Todo ocurre en el navegador con reglas, sin modelo de lenguaje. Cuando se
   conecte uno de verdad, este archivo se convierte en el fallback: si la API
   falla o tarda, el usuario sigue pudiendo registrar comida.
   ------------------------------------------------------------------------ */

/** Sin tildes y en minúsculas. "platano" debe encontrar "plátano". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const NUMBER_WORDS: Record<string, number> = {
  medio: 0.5, media: 0.5,
  un: 1, una: 1, uno: 1,
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, doce: 12,
};

/** Unidades de medida → gramos. `null` = usar la ración del alimento. */
const UNITS: Record<string, number | null> = {
  g: 1, gr: 1, gramo: 1, gramos: 1,
  kg: 1000, kilo: 1000, kilos: 1000,
  ml: 1, mililitros: 1,
  taza: 200, tazas: 200,
  vaso: 200, vasos: 200,
  pocillo: 180, pocillos: 180,
  cucharada: 15, cucharadas: 15,
  cucharadita: 5, cucharaditas: 5,
  rebanada: 30, rebanadas: 30,
  plato: null, platos: null,
  porcion: null, porciones: null,
  racion: null, raciones: null,
};

/* Alias ordenados de más largo a más corto: sin esto, "café con leche"
   se detectaría como "café" y perderíamos la leche. */
const ALIAS_INDEX: { alias: string; food: Food }[] = FOODS.flatMap((food) =>
  [food.name, ...food.aliases].map((alias) => ({ alias: normalize(alias), food })),
).sort((a, b) => b.alias.length - a.alias.length);

interface ParsedFood {
  food: Food;
  grams: number;
  /** Posición en el texto, para conservar el orden en que se mencionaron. */
  at: number;
}

/**
 * Busca la cantidad en las ~5 palabras anteriores al alimento.
 * "dos huevos" → 2 unidades. "150 g de pollo" → 150 g. "arroz" → una ración.
 */
function quantityBefore(text: string, index: number, food: Food): number {
  const before = text.slice(Math.max(0, index - 40), index);
  const words = before.split(/[\s,]+/).filter(Boolean).slice(-5);

  let amount: number | null = null;
  let unitGrams: number | null | undefined;

  for (const raw of words) {
    const w = raw.replace(/[^\wáéíóúñ.]/gi, '');
    if (!w) continue;

    const asNumber = parseFloat(w.replace(',', '.'));
    if (Number.isFinite(asNumber) && asNumber > 0) {
      amount = asNumber;
      continue;
    }
    if (w in NUMBER_WORDS) {
      amount = NUMBER_WORDS[w];
      continue;
    }
    if (w in UNITS) unitGrams = UNITS[w];
  }

  // "150 g", "2 tazas"
  if (unitGrams != null) return Math.round((amount ?? 1) * unitGrams);
  // "una porción", "un plato"
  if (unitGrams === null) return Math.round((amount ?? 1) * food.portionG);
  // "dos huevos" → el alimento se cuenta por unidades
  if (amount != null && food.unitG) return Math.round(amount * food.unitG);
  // "dos arroces" no significa nada útil: lo tratamos como raciones
  if (amount != null) return Math.round(amount * food.portionG);

  return food.portionG;
}

/** Extrae todos los alimentos mencionados, sin repetir ni solapar. */
export function parseFoods(message: string): ParsedFood[] {
  const text = normalize(message);
  const claimed: boolean[] = new Array(text.length).fill(false);
  const found: ParsedFood[] = [];
  const seen = new Set<string>();

  for (const { alias, food } of ALIAS_INDEX) {
    if (seen.has(food.id)) continue;

    // \b no funciona con caracteres acentuados en todos los motores; el
    // texto ya viene normalizado, así que basta con delimitar por espacios.
    const pattern = new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es)?($|\\s|[.,!?])`);
    const match = pattern.exec(text);
    if (!match) continue;

    const start = match.index + match[1].length;
    const end = start + alias.length;
    // Un alias más corto contenido en uno ya detectado no cuenta.
    if (claimed.slice(start, end).some(Boolean)) continue;

    for (let i = start; i < end; i++) claimed[i] = true;
    seen.add(food.id);
    found.push({ food, grams: quantityBefore(text, start, food), at: start });
  }

  return found.sort((a, b) => a.at - b.at);
}

function toItems(parsed: ParsedFood[]): MealItem[] {
  return parsed.map((p) => ({
    foodId: p.food.id,
    name: p.food.name,
    emoji: p.food.emoji,
    grams: p.grams,
  }));
}

/* ── Intenciones ──────────────────────────────────────────────────────────── */

type Intent = 'consulta' | 'sugerir-comida' | 'sugerir-ejercicio' | 'registrar' | 'ayuda';

const RE = {
  consulta: /\b(cuant[oa]s?|que tiene|tiene|cuanto)\b.*\b(caloria|kcal|proteina|macro|grasa|carbo)/,
  sugerirComida: /\b(recomienda|recomiendame|sugiere|sugiereme|que (como|meriendo|ceno|desayuno|almuerzo)|tengo hambre|antojo|idea de)\b/,
  sugerirEjercicio: /\b(ejercicio|rutina|entren|entrenamiento|gimnasio|pesas|cardio|calistenia)\b/,
};

function detectIntent(text: string, foods: ParsedFood[]): Intent {
  if (RE.sugerirEjercicio.test(text)) return 'sugerir-ejercicio';
  if (RE.sugerirComida.test(text)) return 'sugerir-comida';
  if (RE.consulta.test(text) || (text.includes('?') && foods.length > 0)) return 'consulta';
  if (foods.length > 0) return 'registrar';
  return 'ayuda';
}

/* ── Respuesta ────────────────────────────────────────────────────────────── */

export interface ChatReply {
  text: string;
  /** Si viene, la burbuja ofrece el botón "Guardar en mi diario". */
  meal?: { items: MealItem[]; totals: Macros };
}

function macroLine(m: Macros): string {
  return `Proteína ${Math.round(m.protein)} g · Carbos ${Math.round(m.carbs)} g · Grasas ${Math.round(m.fat)} g`;
}

function foodLine(items: MealItem[]): string {
  return items.map((i) => `${i.emoji} ${i.name} (${i.grams} g)`).join(' + ');
}

/** Elige alimentos que encajen en las calorías que quedan y en el objetivo. */
function suggestSnack(remaining: number, profile: UserProfile): string {
  if (remaining < 80) {
    return 'Ya casi cierras tu objetivo del día. Si tienes hambre de verdad, algo con volumen y pocas calorías: verduras crudas, una infusión o un yogur natural pequeño. El hambre real merece comida.';
  }

  const preferProtein = profile.goal !== 'perder-grasa' || remaining > 250;
  const pool = FOODS.filter((f) => {
    if (f.category === 'bebida') return false;
    const kcal = macrosFor(f, f.portionG).calories;
    return kcal <= remaining * 0.85 && kcal >= 40;
  });

  const scored = pool
    .map((f) => {
      const m = macrosFor(f, f.portionG);
      // Densidad de proteína por caloría: lo que hace que una merienda
      // sirva de algo en vez de sólo llenar el hueco.
      const score = preferProtein ? m.protein / Math.max(m.calories, 1) : -m.calories;
      return { f, m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    return `Te quedan ≈${formatNumber(remaining)} kcal, pero es un margen raro. Dime qué tienes a mano y lo ajustamos.`;
  }

  const lines = scored
    .map(({ f, m }) => `• ${f.emoji} ${f.name} (${f.portionG} g) ≈ ${Math.round(m.calories)} kcal, ${Math.round(m.protein)} g de proteína`)
    .join('\n');

  return `Te quedan ≈${formatNumber(remaining)} kcal. Tres opciones que encajan:\n\n${lines}\n\nDime cuál eliges y te la registro.`;
}

function suggestExercise(profile: UserProfile): string {
  const session = getTodaySession(profile);
  const mode = profile.workoutMode === 'calistenia' ? 'calistenia' : 'gimnasio';

  if (session.type === 'descanso') {
    return 'Hoy tu plan marca descanso. Camina, estira y duerme bien: el músculo crece fuera del entreno, no dentro.';
  }

  const byGoal: Record<UserProfile['goal'], string> = {
    'perder-grasa': 'Mantén la fuerza como base y deja el cardio al final. En déficit, la fuerza es lo que protege la masa magra.',
    mantener: 'Alterna fuerza y algo de cardio suave. Constancia por encima de intensidad.',
    'ganar-musculo': 'Prioriza los compuestos pesados y descansa 2-3 min entre series. Progresa en peso o repeticiones cada semana.',
  };

  return `Hoy te toca **${session.title}** — ${session.focus}, unos ${session.durationMin} min en ${mode}.\n\n${byGoal[profile.goal]}\n\nEn Planes tienes la rutina completa con series y esfuerzo objetivo.`;
}

/**
 * Punto único de entrada del chat.
 * Es `async` a propósito: cuando esto hable con un modelo real, la firma no
 * cambia y ni la pantalla ni las burbujas se enteran.
 */
export async function processChatMessage(
  message: string,
  profile: UserProfile,
  targets: NutritionTargets,
  consumedToday: Macros,
): Promise<ChatReply> {
  // Misma puerta que el análisis de foto: cuando esto hable con un modelo
  // real, el control de acceso ya está en su sitio.
  const access = checkAccess('chat-nutri');
  if (!access.allowed) return { text: access.reason };

  const text = normalize(message);
  const parsed = parseFoods(message);
  const intent = detectIntent(text, parsed);
  const remaining = Math.max(targets.calories - consumedToday.calories, 0);

  switch (intent) {
    case 'sugerir-ejercicio':
      return { text: suggestExercise(profile) };

    case 'sugerir-comida':
      return { text: suggestSnack(remaining, profile) };

    case 'consulta': {
      if (parsed.length === 0) {
        return {
          text: 'Dime de qué alimento y te doy los números. Por ejemplo: "¿cuántas calorías tiene un plato de arroz con pollo?".',
        };
      }
      const items = toItems(parsed);
      const totals = sumMeal(items);
      return {
        text: `${foodLine(items)}\n\n≈ ${formatNumber(totals.calories)} kcal\n${macroLine(totals)}\n\nSi te lo comiste, te lo registro.`,
        meal: { items, totals },
      };
    }

    case 'registrar': {
      const items = toItems(parsed);
      const totals = sumMeal(items);
      const after = remaining - totals.calories;

      const tail =
        after > 0
          ? `Después de esto te quedarían ≈${formatNumber(after)} kcal.`
          : `Con esto cierras tu objetivo del día. Sin drama: mañana sigue el plan.`;

      return {
        text: `${foodLine(items)}\n\n≈ ${formatNumber(totals.calories)} kcal\n${macroLine(totals)}\n\n${tail}`,
        meal: { items, totals },
      };
    }

    case 'ayuda':
    default:
      return {
        text: [
          'Puedo ayudarte con tres cosas:',
          '',
          '• Cuéntame qué comiste — "dos huevos con una tostada y café con leche"',
          '• Pregúntame por un alimento — "¿cuántas calorías tiene el aguacate?"',
          '• Pídeme ideas — "tengo hambre, ¿qué merienda me recomiendas?"',
          '',
          'Todo lo que calculo son estimaciones a partir de porciones típicas.',
        ].join('\n'),
      };
  }
}

/** Sugerencias de arranque, adaptadas al momento del día. */
export function starterPrompts(hour: number): string[] {
  const meal =
    hour < 11 ? 'Desayuné huevos con arepa' : hour < 16 ? 'Almorcé arroz con pollo' : 'Cené atún con ensalada';
  return [meal, '¿Qué merienda me recomiendas?', '¿Qué ejercicio me toca hoy?'];
}
