import type {
  BodyType,
  Food,
  Gender,
  Goal,
  LogFrequency,
  TrainingFrequency,
} from './types';

/* ── Base de alimentos ─────────────────────────────────────────────────────
   Valores por 100 g (crudo salvo que se indique "cocido"). Fuente de
   referencia: tablas USDA + tabla de composición de alimentos colombianos.
   Los `aliases` van sin tildes y en minúsculas: el parser normaliza la
   entrada antes de comparar.
   ------------------------------------------------------------------------ */
export const FOODS: Food[] = [
  // ── Proteínas ──
  { id: 'pollo-pechuga', name: 'Pechuga de pollo', aliases: ['pollo', 'pechuga', 'pollo asado', 'pollo a la plancha'], kcal: 165, protein: 31, carbs: 0, fat: 3.6, portionG: 150, emoji: '🍗', category: 'proteina' },
  { id: 'huevo', name: 'Huevo', aliases: ['huevo', 'huevos', 'huevo revuelto', 'huevos revueltos', 'huevo frito'], kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, portionG: 100, unitG: 50, emoji: '🥚', category: 'proteina' },
  { id: 'carne-res', name: 'Carne de res magra', aliases: ['carne', 'res', 'carne de res', 'bistec', 'lomo'], kcal: 187, protein: 26, carbs: 0, fat: 9, portionG: 150, emoji: '🥩', category: 'proteina' },
  { id: 'cerdo-lomo', name: 'Lomo de cerdo', aliases: ['cerdo', 'lomo de cerdo', 'chuleta'], kcal: 196, protein: 27, carbs: 0, fat: 9, portionG: 150, emoji: '🍖', category: 'proteina' },
  { id: 'salmon', name: 'Salmón', aliases: ['salmon'], kcal: 208, protein: 20, carbs: 0, fat: 13, portionG: 150, emoji: '🐟', category: 'proteina' },
  { id: 'tilapia', name: 'Tilapia', aliases: ['tilapia', 'pescado', 'mojarra'], kcal: 96, protein: 20, carbs: 0, fat: 1.7, portionG: 150, emoji: '🐟', category: 'proteina' },
  { id: 'atun', name: 'Atún en agua', aliases: ['atun', 'atun en agua', 'lata de atun'], kcal: 116, protein: 26, carbs: 0, fat: 1, portionG: 100, emoji: '🥫', category: 'proteina' },
  { id: 'frijoles', name: 'Fríjoles cocidos', aliases: ['frijol', 'frijoles', 'frisoles', 'frijoles rojos'], kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5, portionG: 150, emoji: '🫘', category: 'proteina' },
  { id: 'lentejas', name: 'Lentejas cocidas', aliases: ['lenteja', 'lentejas'], kcal: 116, protein: 9, carbs: 20, fat: 0.4, portionG: 150, emoji: '🫘', category: 'proteina' },
  { id: 'garbanzos', name: 'Garbanzos cocidos', aliases: ['garbanzo', 'garbanzos'], kcal: 164, protein: 8.9, carbs: 27, fat: 2.6, portionG: 150, emoji: '🫘', category: 'proteina' },
  { id: 'proteina-whey', name: 'Proteína en polvo', aliases: ['whey', 'proteina en polvo', 'batido de proteina', 'scoop'], kcal: 375, protein: 78, carbs: 8, fat: 3, portionG: 30, unitG: 30, emoji: '🥤', category: 'proteina' },

  // ── Carbohidratos ──
  { id: 'arroz-blanco', name: 'Arroz blanco cocido', aliases: ['arroz', 'arroz blanco'], kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, portionG: 180, emoji: '🍚', category: 'carbohidrato' },
  { id: 'arepa', name: 'Arepa de maíz', aliases: ['arepa', 'arepas'], kcal: 218, protein: 4.5, carbs: 45, fat: 2.4, portionG: 80, unitG: 80, emoji: '🫓', category: 'carbohidrato' },
  { id: 'papa-cocida', name: 'Papa cocida', aliases: ['papa', 'papas', 'papa cocida', 'papa salada'], kcal: 87, protein: 1.9, carbs: 20, fat: 0.1, portionG: 200, emoji: '🥔', category: 'carbohidrato' },
  { id: 'yuca', name: 'Yuca cocida', aliases: ['yuca'], kcal: 160, protein: 1.4, carbs: 38, fat: 0.3, portionG: 150, emoji: '🥔', category: 'carbohidrato' },
  { id: 'platano-maduro', name: 'Plátano maduro', aliases: ['platano', 'platano maduro', 'maduro', 'tajadas'], kcal: 122, protein: 1.3, carbs: 32, fat: 0.4, portionG: 120, emoji: '🍌', category: 'carbohidrato' },
  { id: 'patacon', name: 'Patacón', aliases: ['patacon', 'patacones', 'tostones'], kcal: 310, protein: 2, carbs: 46, fat: 13, portionG: 100, emoji: '🍟', category: 'carbohidrato' },
  { id: 'pasta', name: 'Pasta cocida', aliases: ['pasta', 'espagueti', 'spaghetti', 'macarrones', 'fideos'], kcal: 158, protein: 5.8, carbs: 31, fat: 0.9, portionG: 180, emoji: '🍝', category: 'carbohidrato' },
  { id: 'pan-integral', name: 'Pan integral', aliases: ['pan', 'pan integral', 'tostada', 'tostadas'], kcal: 247, protein: 13, carbs: 41, fat: 3.4, portionG: 60, unitG: 30, emoji: '🍞', category: 'carbohidrato' },
  { id: 'avena', name: 'Avena en hojuelas', aliases: ['avena', 'hojuelas de avena', 'oatmeal'], kcal: 389, protein: 16.9, carbs: 66, fat: 6.9, portionG: 50, emoji: '🥣', category: 'carbohidrato' },
  { id: 'quinua', name: 'Quinua cocida', aliases: ['quinua', 'quinoa'], kcal: 120, protein: 4.4, carbs: 21, fat: 1.9, portionG: 150, emoji: '🌾', category: 'carbohidrato' },
  { id: 'empanada', name: 'Empanada frita', aliases: ['empanada', 'empanadas'], kcal: 315, protein: 7, carbs: 33, fat: 17, portionG: 90, unitG: 90, emoji: '🥟', category: 'carbohidrato' },

  // ── Grasas ──
  { id: 'aguacate', name: 'Aguacate', aliases: ['aguacate', 'palta'], kcal: 160, protein: 2, carbs: 8.5, fat: 14.7, portionG: 70, emoji: '🥑', category: 'grasa' },
  { id: 'aceite-oliva', name: 'Aceite de oliva', aliases: ['aceite', 'aceite de oliva'], kcal: 884, protein: 0, carbs: 0, fat: 100, portionG: 10, emoji: '🫒', category: 'grasa' },
  { id: 'almendras', name: 'Almendras', aliases: ['almendra', 'almendras'], kcal: 579, protein: 21, carbs: 22, fat: 50, portionG: 30, emoji: '🌰', category: 'grasa' },
  { id: 'mani', name: 'Maní', aliases: ['mani', 'cacahuate', 'cacahuete'], kcal: 567, protein: 26, carbs: 16, fat: 49, portionG: 30, emoji: '🥜', category: 'grasa' },
  { id: 'mantequilla-mani', name: 'Mantequilla de maní', aliases: ['mantequilla de mani', 'crema de mani', 'peanut butter'], kcal: 588, protein: 25, carbs: 20, fat: 50, portionG: 20, emoji: '🥜', category: 'grasa' },

  // ── Lácteos ──
  { id: 'leche-entera', name: 'Leche entera', aliases: ['leche', 'leche entera'], kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, portionG: 200, emoji: '🥛', category: 'lacteo' },
  { id: 'leche-descremada', name: 'Leche descremada', aliases: ['leche descremada', 'leche deslactosada'], kcal: 34, protein: 3.4, carbs: 5, fat: 0.1, portionG: 200, emoji: '🥛', category: 'lacteo' },
  { id: 'yogur-griego', name: 'Yogur griego natural', aliases: ['yogur', 'yogurt', 'yogur griego'], kcal: 59, protein: 10, carbs: 3.6, fat: 0.4, portionG: 170, emoji: '🥣', category: 'lacteo' },
  { id: 'queso-campesino', name: 'Queso campesino', aliases: ['queso', 'queso campesino', 'queso fresco'], kcal: 264, protein: 18, carbs: 3, fat: 20, portionG: 50, emoji: '🧀', category: 'lacteo' },

  // ── Frutas ──
  { id: 'banano', name: 'Banano', aliases: ['banano', 'banana', 'guineo', 'cambur'], kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, portionG: 120, unitG: 120, emoji: '🍌', category: 'fruta' },
  { id: 'manzana', name: 'Manzana', aliases: ['manzana'], kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, portionG: 180, unitG: 180, emoji: '🍎', category: 'fruta' },
  { id: 'papaya', name: 'Papaya', aliases: ['papaya'], kcal: 43, protein: 0.5, carbs: 11, fat: 0.3, portionG: 150, emoji: '🍈', category: 'fruta' },
  { id: 'mango', name: 'Mango', aliases: ['mango'], kcal: 60, protein: 0.8, carbs: 15, fat: 0.4, portionG: 165, emoji: '🥭', category: 'fruta' },
  { id: 'fresas', name: 'Fresas', aliases: ['fresa', 'fresas', 'frutilla'], kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, portionG: 150, emoji: '🍓', category: 'fruta' },

  // ── Verduras ──
  { id: 'brocoli', name: 'Brócoli', aliases: ['brocoli'], kcal: 34, protein: 2.8, carbs: 7, fat: 0.4, portionG: 120, emoji: '🥦', category: 'verdura' },
  { id: 'ensalada-verde', name: 'Ensalada verde', aliases: ['ensalada', 'lechuga', 'ensalada verde'], kcal: 20, protein: 1.4, carbs: 3, fat: 0.2, portionG: 100, emoji: '🥗', category: 'verdura' },
  { id: 'tomate', name: 'Tomate', aliases: ['tomate'], kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, portionG: 100, emoji: '🍅', category: 'verdura' },
  { id: 'espinaca', name: 'Espinaca', aliases: ['espinaca', 'espinacas'], kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, portionG: 80, emoji: '🥬', category: 'verdura' },

  // ── Bebidas ──
  { id: 'cafe-negro', name: 'Café negro', aliases: ['cafe', 'tinto', 'cafe negro'], kcal: 2, protein: 0.1, carbs: 0, fat: 0, portionG: 200, emoji: '☕', category: 'bebida' },
  { id: 'cafe-con-leche', name: 'Café con leche', aliases: ['cafe con leche', 'perico', 'latte'], kcal: 42, protein: 2.2, carbs: 3.4, fat: 2.2, portionG: 200, emoji: '☕', category: 'bebida' },
  { id: 'jugo-naranja', name: 'Jugo de naranja', aliases: ['jugo', 'jugo de naranja', 'zumo'], kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, portionG: 250, emoji: '🧃', category: 'bebida' },
  { id: 'gaseosa', name: 'Gaseosa', aliases: ['gaseosa', 'refresco', 'coca cola', 'soda'], kcal: 42, protein: 0, carbs: 10.6, fat: 0, portionG: 330, emoji: '🥤', category: 'bebida' },
];

/** Índice por id — evita recorrer el array en cada cálculo. */
export const FOODS_BY_ID: Record<string, Food> = Object.fromEntries(
  FOODS.map((f) => [f.id, f]),
);

/* ── Catálogos de opciones del onboarding ─────────────────────────────────
   Viven aquí (y no dentro de los componentes) para que Perfil y Ajustes
   reutilicen exactamente las mismas etiquetas. Una sola verdad = cero
   inconsistencias de copy entre pantallas.
   ------------------------------------------------------------------------ */

export const GENDER_OPTIONS: {
  value: Gender;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: 'hombre', label: 'Hombre', emoji: '👨', hint: 'Enfoque en fuerza y volumen' },
  { value: 'mujer', label: 'Mujer', emoji: '👩', hint: 'Enfoque en tono y composición' },
];

export const BODY_TYPE_OPTIONS: {
  value: BodyType;
  label: string;
  description: string;
}[] = [
  { value: 'delgado', label: 'Delgado', description: 'Me cuesta ganar peso' },
  { value: 'normal', label: 'Normal', description: 'Peso más o menos estable' },
  { value: 'sobrepeso', label: 'Con sobrepeso', description: 'Quiero reducir grasa' },
];

export const GOAL_OPTIONS: {
  value: Goal;
  label: string;
  description: string;
  icon: 'flame' | 'scale' | 'dumbbell';
}[] = [
  { value: 'perder-grasa', label: 'Perder grasa', description: 'Déficit moderado, proteína alta', icon: 'flame' },
  { value: 'mantener', label: 'Mantener peso', description: 'Calorías de mantenimiento', icon: 'scale' },
  { value: 'ganar-musculo', label: 'Ganar músculo', description: 'Superávit controlado, fuerza', icon: 'dumbbell' },
];

export const LOG_FREQUENCY_OPTIONS: { value: LogFrequency; label: string }[] = [
  { value: 'una-vez', label: '1 vez al día' },
  { value: 'dos-tres', label: '2-3 veces al día' },
  { value: 'cuando-coma', label: 'Solo cuando coma' },
  { value: 'cada-comida', label: 'Cada comida' },
];

export const TRAINING_FREQUENCY_OPTIONS: {
  value: TrainingFrequency;
  label: string;
}[] = [
  { value: 'ninguno', label: 'No entreno' },
  { value: '1-2', label: '1-2 días' },
  { value: '3-4', label: '3-4 días' },
  { value: '5-6', label: '5-6 días' },
  { value: 'diario', label: 'Todos los días' },
];

/** Ejemplos rotatorios para el campo libre de objetivos de dieta. */
export const DIET_NOTE_EXAMPLES = [
  'Quiero bajar los carbohidratos en la noche',
  'Necesito subir la proteína, me cuesta llegar',
  'Quiero mejorar mi digestión',
  'Sin lactosa, me cae mal',
  'Como fuera de casa casi todos los días',
];
