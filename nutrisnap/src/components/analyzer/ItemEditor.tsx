import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { easeSnap, easeSoft } from '../../lib/motion';
import { FOODS_BY_ID } from '../../lib/data';
import { formatNumber, macrosFor } from '../../lib/nutrition';
import type { MealItem } from '../../lib/types';

const STEP = 5;
const MIN_G = 5;

interface Props {
  items: MealItem[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onChangeGrams: (index: number, grams: number) => void;
  onRemove: (index: number) => void;
}

/**
 * Lista editable de lo detectado.
 *
 * Sólo se expande un alimento a la vez: con tres sliders abiertos, el
 * resumen de macros queda fuera de pantalla y se pierde justo la
 * retroalimentación que hace útil el ajuste.
 */
export function ItemEditor({
  items,
  selectedIndex,
  onSelect,
  onChangeGrams,
  onRemove,
}: Props) {
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((item, i) => {
          const food = FOODS_BY_ID[item.foodId];
          if (!food) return null;

          const open = selectedIndex === i;
          const kcal = macrosFor(food, item.grams).calories;
          // Techo relativo a la ración típica: un slider de 0-500 g deja
          // el rango útil de una tostada en tres píxeles.
          const max = Math.max(Math.round(food.portionG * 3), 100);

          return (
            <motion.li
              key={`${item.foodId}-${i}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={easeSoft}
              className={`glass overflow-hidden rounded-2xl ${open ? 'glass-active' : ''}`}
            >
              <button
                type="button"
                onClick={() => onSelect(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{item.name}</span>
                  <span className="tnum block text-[12px] text-ink-faint">
                    {item.grams} g
                  </span>
                </span>
                <span className="tnum shrink-0 text-[14px] font-semibold text-ember">
                  {formatNumber(kcal)}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={easeSoft}
                  >
                    <div className="border-t border-white/8 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          transition={easeSnap}
                          onClick={() => onChangeGrams(i, Math.max(item.grams - STEP, MIN_G))}
                          aria-label={`Quitar ${STEP} gramos`}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-ink hover:bg-white/14"
                        >
                          <Minus size={17} strokeWidth={2.6} />
                        </motion.button>

                        <input
                          type="range"
                          min={MIN_G}
                          max={max}
                          step={STEP}
                          value={Math.min(item.grams, max)}
                          onChange={(e) => onChangeGrams(i, Number(e.target.value))}
                          aria-label={`Gramos de ${item.name}`}
                          className="slider min-w-0 flex-1"
                        />

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          transition={easeSnap}
                          onClick={() => onChangeGrams(i, item.grams + STEP)}
                          aria-label={`Añadir ${STEP} gramos`}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/8 text-ink hover:bg-white/14"
                        >
                          <Plus size={17} strokeWidth={2.6} />
                        </motion.button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="tnum text-[12px] text-ink-faint">
                          P {Math.round(macrosFor(food, item.grams).protein)} g · C{' '}
                          {Math.round(macrosFor(food, item.grams).carbs)} g · G{' '}
                          {Math.round(macrosFor(food, item.grams).fat)} g
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemove(i)}
                          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] text-ink-faint hover:text-ember"
                        >
                          <Trash2 size={13} /> Quitar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
