import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Plus, RotateCcw } from 'lucide-react';
import { CameraStage } from '../components/analyzer/CameraStage';
import { DetectionCanvas, ScanOverlay } from '../components/analyzer/DetectionCanvas';
import { FoodPicker } from '../components/analyzer/FoodPicker';
import { ItemEditor } from '../components/analyzer/ItemEditor';
import { SaveCelebration } from '../components/analyzer/SaveCelebration';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { prepareImage, type PreparedImage } from '../lib/image';
import { easeSnap, easeSoft } from '../lib/motion';
import { sumMeal } from '../lib/nutrition';
import { VisionError, analyzeMeal } from '../lib/vision';
import type { Food, MealItem } from '../lib/types';

/* Máquina de estados explícita. El analizador tiene suficientes caminos
   (cancelar a mitad, foto ilegible, sin detecciones, reintentar) como para
   que un puñado de booleanos acabe permitiendo estados imposibles. */
type Stage =
  | { name: 'captura' }
  | { name: 'analizando'; image: PreparedImage }
  | { name: 'resultados'; image: PreparedImage }
  | { name: 'guardado' };

const MACROS = [
  { key: 'protein', label: 'Proteína', color: 'var(--color-macro-protein)' },
  { key: 'carbs', label: 'Carbos', color: 'var(--color-macro-carbs)' },
  { key: 'fat', label: 'Grasas', color: 'var(--color-macro-fat)' },
] as const;

export function Analyzer({ onDone }: { onDone: () => void }) {
  const { state, addMeal } = useApp();
  const [stage, setStage] = useState<Stage>({ name: 'captura' });
  const [items, setItems] = useState<MealItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Salir de la pantalla a mitad de análisis debe cancelar la petición, no
  // dejarla corriendo contra un componente que ya no existe.
  useEffect(() => () => abortRef.current?.abort(), []);

  const totals = useMemo(() => sumMeal(items), [items]);

  const handleCaptured = useCallback(async (blob: Blob) => {
    setError(null);
    let image: PreparedImage;

    try {
      image = await prepareImage(blob);
    } catch {
      setError('No pudimos leer esa imagen. Prueba con otra foto.');
      return;
    }

    setStage({ name: 'analizando', image });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const detected = await analyzeMeal(image, controller.signal);
      setItems(detected);
      setSelected(null);
      setStage({ name: 'resultados', image });
    } catch (err) {
      if (err instanceof VisionError && err.kind === 'cancelado') return;
      setError(
        err instanceof VisionError
          ? err.message
          : 'Algo falló al analizar. Inténtalo de nuevo.',
      );
      setStage({ name: 'captura' });
    } finally {
      abortRef.current = null;
    }
  }, []);

  function reset() {
    abortRef.current?.abort();
    setItems([]);
    setSelected(null);
    setError(null);
    setStage({ name: 'captura' });
  }

  function changeGrams(index: number, grams: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, grams: Math.max(grams, 5) } : it)),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelected(null);
  }

  function addFood(food: Food) {
    setItems((prev) => [
      ...prev,
      {
        foodId: food.id,
        name: food.name,
        emoji: food.emoji,
        grams: food.portionG,
        // Sin caja: no lo detectó la IA, lo añadió la persona.
      },
    ]);
    setPicking(false);
  }

  function save() {
    if (stage.name !== 'resultados' || items.length === 0) return;

    addMeal({
      source: 'foto',
      items,
      photo: stage.image.dataUrl,
      totals,
    });

    setStage({ name: 'guardado' });
    setTimeout(onDone, 1500);
  }

  /* ── Captura ──────────────────────────────────────────────────────────── */
  if (stage.name === 'captura') {
    return (
      <div className="flex flex-1 flex-col">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeSoft}
            role="alert"
            className="mx-5 mt-4 flex gap-3 rounded-2xl border border-ember/25 bg-ember/8 px-4 py-3"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-ember" />
            <p className="text-[13px] leading-relaxed text-ember">{error}</p>
          </motion.div>
        )}
        <CameraStage
          cameraAllowed={state.cameraPermission === 'concedido'}
          onCaptured={handleCaptured}
        />
      </div>
    );
  }

  /* ── Escaneo ──────────────────────────────────────────────────────────── */
  if (stage.name === 'analizando') {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <ScanOverlay image={stage.image} />
        <div className="px-6 pt-8 text-center">
          <p className="text-[14px] text-ink-soft">Identificando alimentos y porciones…</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 text-[13px] text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  /* ── Guardado ─────────────────────────────────────────────────────────── */
  if (stage.name === 'guardado') {
    return (
      <div className="relative flex flex-1 flex-col">
        <SaveCelebration label="Guardado en tu diario" />
      </div>
    );
  }

  /* ── Resultados y edición ─────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <motion.button
          type="button"
          onClick={reset}
          whileTap={{ scale: 0.9 }}
          transition={easeSnap}
          aria-label="Volver a tomar la foto"
          className="-ml-2 flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[13px] text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={17} /> Otra foto
        </motion.button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 text-[13px] text-ink-faint hover:text-ink"
        >
          <RotateCcw size={14} /> Reanalizar
        </button>
      </div>

      <DetectionCanvas
        image={stage.image}
        items={items}
        selectedIndex={selected}
        onSelect={setSelected}
      />

      <div className="flex-1 px-5 pt-5 pb-8">
        {/* El total va arriba del listado: es la cifra que la gente mira
            mientras mueve el slider. Debajo quedaría fuera de pantalla con
            el teclado o un alimento expandido. */}
        <div className="glass rounded-3xl px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[11px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
              Total estimado
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-lg text-ink-faint">≈</span>
              <AnimatedNumber
                value={totals.calories}
                duration={0.35}
                className="font-display text-[30px] leading-none font-bold tracking-tight"
              />
              <span className="text-[13px] text-ink-soft">kcal</span>
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/8 pt-4">
            {MACROS.map((m) => (
              <div key={m.key} className="text-center">
                <dt className="flex items-center justify-center gap-1.5 text-[11px] text-ink-soft">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </dt>
                <dd className="mt-1 font-display text-[17px] font-semibold">
                  <AnimatedNumber value={totals[m.key]} duration={0.35} />
                  <span className="text-[13px] font-normal text-ink-faint"> g</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-5 mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[15px] font-bold tracking-tight">
            {items.length === 1 ? '1 alimento' : `${items.length} alimentos`}
          </h2>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex items-center gap-1.5 text-[13px] text-mint hover:underline"
          >
            <Plus size={14} strokeWidth={2.6} /> Añadir
          </button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 px-5 py-6 text-center text-[13px] leading-relaxed text-ink-faint">
            No queda ningún alimento. Añade uno o toma otra foto.
          </p>
        ) : (
          <ItemEditor
            items={items}
            selectedIndex={selected}
            onSelect={setSelected}
            onChangeGrams={changeGrams}
            onRemove={removeItem}
          />
        )}

        <div className="mt-6">
          <Button full onClick={save} disabled={items.length === 0}>
            Guardar en mi diario
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
            Las cantidades son estimaciones a partir de la foto. Ajústalas si algo no cuadra.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {picking && <FoodPicker onPick={addFood} onClose={() => setPicking(false)} />}
      </AnimatePresence>
    </div>
  );
}
