import { motion } from 'framer-motion';
import type { Macros, NutritionTargets } from '../../lib/types';
import { easeSoft } from '../../lib/motion';

const MACROS = [
  { key: 'protein', label: 'Proteína', color: 'var(--color-macro-protein)' },
  { key: 'carbs', label: 'Carbos', color: 'var(--color-macro-carbs)' },
  { key: 'fat', label: 'Grasas', color: 'var(--color-macro-fat)' },
] as const;

/**
 * Cada macro tiene su color fijo en toda la app (proteína menta, carbos
 * naranja, grasas violeta). Es lo que permite leer una comida de un vistazo
 * sin etiquetas, aquí y en el analizador.
 */
export function MacroBars({
  consumed,
  targets,
}: {
  consumed: Macros;
  targets: NutritionTargets;
}) {
  return (
    <dl className="space-y-3.5">
      {MACROS.map((m, i) => {
        const value = Math.round(consumed[m.key]);
        const goal = targets[m.key];
        const ratio = goal > 0 ? value / goal : 0;

        return (
          <div key={m.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <dt className="flex items-center gap-2 text-[13px] text-ink-soft">
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                {m.label}
              </dt>
              <dd className="tnum text-[13px] text-ink-faint">
                <span className="font-medium text-ink">{value}</span> / {goal} g
              </dd>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(ratio, 1) }}
                transition={{ ...easeSoft, delay: 0.25 + i * 0.09 }}
                style={{ originX: 0, background: m.color }}
                className="h-full rounded-full"
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
