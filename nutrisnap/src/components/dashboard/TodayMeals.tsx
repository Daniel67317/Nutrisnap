import { AnimatePresence, motion } from 'framer-motion';
import { Camera, MessageSquare, PencilLine, Trash2, UtensilsCrossed } from 'lucide-react';
import { easeSnap, easeSoft } from '../../lib/motion';
import { formatNumber } from '../../lib/nutrition';
import type { Meal, MealSource } from '../../lib/types';

const SOURCE_ICON: Record<MealSource, typeof Camera> = {
  foto: Camera,
  chat: MessageSquare,
  manual: PencilLine,
};

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Diario del día.
 * Vacío no significa "no hay nada": significa que todavía no ha pasado nada,
 * y es la mejor oportunidad para invitar a la primera acción del día.
 */
export function TodayMeals({
  meals,
  onRemove,
}: {
  meals: Meal[];
  onRemove: (id: string) => void;
}) {
  if (meals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeSoft, delay: 0.4 }}
        className="rounded-3xl border border-dashed border-white/12 px-6 py-8 text-center"
      >
        <UtensilsCrossed size={22} className="mx-auto text-ink-faint" strokeWidth={1.8} />
        <p className="mt-3 text-[14px] font-medium text-ink-soft">
          Tu día está en blanco
        </p>
        <p className="mx-auto mt-1 max-w-[15rem] text-[13px] leading-relaxed text-ink-faint">
          Toma una foto de lo próximo que comas y el resto lo hacemos nosotros.
        </p>
      </motion.div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {meals.map((meal) => {
          const Icon = SOURCE_ICON[meal.source];
          const names = meal.items.map((i) => i.name).join(' · ');

          return (
            <motion.li
              key={meal.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24, scale: 0.96 }}
              transition={easeSoft}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
            >
              <span className="flex shrink-0 -space-x-1.5 text-lg">
                {meal.items.slice(0, 3).map((item, i) => (
                  <span key={`${item.foodId}-${i}`}>{item.emoji}</span>
                ))}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{names}</span>
                <span className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                  <Icon size={11} /> {timeOf(meal.loggedAt)}
                </span>
              </span>

              <span className="tnum shrink-0 text-[14px] font-semibold text-ember">
                {formatNumber(meal.totals.calories)}
              </span>

              <motion.button
                type="button"
                onClick={() => onRemove(meal.id)}
                whileTap={{ scale: 0.9 }}
                transition={easeSnap}
                aria-label={`Eliminar ${names}`}
                className="-mr-1 shrink-0 rounded-full p-2 text-ink-faint hover:text-ember"
              >
                <Trash2 size={15} />
              </motion.button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
