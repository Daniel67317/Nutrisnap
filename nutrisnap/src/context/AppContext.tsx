import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, Macros, Meal, NutritionTargets, UserProfile } from '../lib/types';
import {
  INITIAL_STATE,
  clearState,
  createId,
  currentStreak,
  dayKey,
  loadState,
  nextStreak,
  saveState,
} from '../lib/storage';
import { EMPTY_MACROS, addMacros, calcTargets } from '../lib/nutrition';

interface AppContextValue {
  state: AppState;
  /** Objetivos diarios, o null si aún no hay perfil. */
  targets: NutritionTargets | null;
  /** Macros ya consumidos hoy. */
  consumedToday: Macros;
  /** Comidas registradas hoy, de la más reciente a la más antigua. */
  mealsToday: Meal[];
  /**
   * Macros de un día relativo a hoy: `0` hoy, `-1` ayer, `-7` hace una semana.
   * Devuelve null si ese día no tiene registros — no es lo mismo "comió 0 kcal"
   * que "no registró nada", y el entrenador necesita distinguirlo.
   */
  macrosOn: (offsetDays: number) => Macros | null;

  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setCameraPermission: (value: AppState['cameraPermission']) => void;
  addMeal: (meal: Omit<Meal, 'id' | 'loggedAt'>) => void;
  removeMeal: (id: string) => void;
  addSuggestion: (text: string) => void;
  logWeight: (kg: number) => void;
  toggleExercise: (exerciseId: string) => void;
  /** Ejercicios marcados hoy. */
  completedToday: string[];
  /** Racha vigente hoy — `state.streak` puede estar caducada. */
  streak: number;
  resetApp: () => void;
}

/**
 * Cuántas comidas recientes conservan su foto.
 * 20 × ~85 KB ≈ 1,7 MB, con margen de sobra dentro de los ~5 MB de
 * localStorage para el resto del estado.
 */
const PHOTO_RETENTION = 20;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Lectura perezosa: leemos localStorage una sola vez, en el primer render.
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    setState((s) => ({ ...s, profile, onboarded: true }));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s));
  }, []);

  const setCameraPermission = useCallback((value: AppState['cameraPermission']) => {
    setState((s) => ({ ...s, cameraPermission: value }));
  }, []);

  const addMeal = useCallback((meal: Omit<Meal, 'id' | 'loggedAt'>) => {
    setState((s) => {
      const entry: Meal = {
        ...meal,
        id: createId(),
        loggedAt: new Date().toISOString(),
      };

      // Cada foto pesa ~85 KB como data URL y localStorage da ~5 MB en total:
      // sin poda, la cuota revienta a las ~60 comidas. `saveState` tiene una
      // red de seguridad reactiva, pero para entonces un guardado ya falló.
      // Podar aquí mantiene el presupuesto bajo control desde el principio.
      // Los macros y el historial NUNCA se tocan: sólo se suelta la imagen.
      const meals = [entry, ...s.meals].map((m, i) =>
        i < PHOTO_RETENTION ? m : m.photo ? { ...m, photo: undefined } : m,
      );

      return {
        ...s,
        meals,
        streak: nextStreak(s.streak, s.lastLoggedDate),
        lastLoggedDate: dayKey(),
      };
    });
  }, []);

  const removeMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
  }, []);

  const addSuggestion = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      suggestions: [...s.suggestions, { text, sentAt: new Date().toISOString() }],
    }));
  }, []);

  const logWeight = useCallback((kg: number) => {
    setState((s) => {
      const today = dayKey();
      // Un solo registro por día: pesarse tres veces no son tres puntos en
      // la gráfica, es el mismo día medido tres veces.
      const rest = s.weightLog.filter((w) => w.date !== today);
      const weightLog = [...rest, { date: today, kg }].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      return {
        ...s,
        weightLog,
        profile: s.profile ? { ...s.profile, weightKg: kg } : s.profile,
      };
    });
  }, []);

  const toggleExercise = useCallback((exerciseId: string) => {
    setState((s) => {
      const today = dayKey();
      const done = s.completedExercises[today] ?? [];
      const next = done.includes(exerciseId)
        ? done.filter((id) => id !== exerciseId)
        : [...done, exerciseId];
      return { ...s, completedExercises: { ...s.completedExercises, [today]: next } };
    });
  }, []);

  const resetApp = useCallback(() => {
    clearState();
    setState(INITIAL_STATE);
  }, []);

  const targets = useMemo(
    () => (state.profile ? calcTargets(state.profile) : null),
    [state.profile],
  );

  const mealsToday = useMemo(() => {
    const today = dayKey();
    return state.meals.filter((m) => dayKey(new Date(m.loggedAt)) === today);
  }, [state.meals]);

  const consumedToday = useMemo(
    () => mealsToday.reduce((acc, m) => addMacros(acc, m.totals), EMPTY_MACROS),
    [mealsToday],
  );

  const streak = useMemo(
    () => currentStreak(state.streak, state.lastLoggedDate),
    [state.streak, state.lastLoggedDate],
  );

  const completedToday = useMemo(
    () => state.completedExercises[dayKey()] ?? [],
    [state.completedExercises],
  );

  const macrosOn = useCallback(
    (offsetDays: number): Macros | null => {
      const key = dayKey(new Date(Date.now() + offsetDays * 86_400_000));
      const dayMeals = state.meals.filter((m) => dayKey(new Date(m.loggedAt)) === key);
      if (dayMeals.length === 0) return null;
      return dayMeals.reduce((acc, m) => addMacros(acc, m.totals), EMPTY_MACROS);
    },
    [state.meals],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      targets,
      consumedToday,
      mealsToday,
      macrosOn,
      completeOnboarding,
      updateProfile,
      setCameraPermission,
      addMeal,
      removeMeal,
      addSuggestion,
      logWeight,
      toggleExercise,
      completedToday,
      streak,
      resetApp,
    }),
    [
      state,
      targets,
      consumedToday,
      mealsToday,
      macrosOn,
      completeOnboarding,
      updateProfile,
      setCameraPermission,
      addMeal,
      removeMeal,
      addSuggestion,
      logWeight,
      toggleExercise,
      completedToday,
      streak,
      resetApp,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
