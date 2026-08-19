import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { easeSnap, springPop } from '../../lib/motion';

/** Superficie base: todo lo que sea un bloque de contenido usa esto. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass rounded-3xl ${className}`}>{children}</div>
  );
}

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  /** `tile` para rejillas de 2-3 columnas, `row` para listas verticales. */
  layout?: 'tile' | 'row';
  className?: string;
  ariaLabel?: string;
}

/**
 * Tarjeta seleccionable del onboarding.
 * El check no aparece de golpe: entra con un spring corto desde escala 0.
 * Es la única celebración visual del flujo y por eso vale la pena.
 */
export function OptionCard({
  selected,
  onSelect,
  children,
  layout = 'tile',
  className = '',
  ariaLabel,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={easeSnap}
      className={[
        'relative rounded-3xl text-left transition-colors duration-200',
        'glass',
        selected ? 'glass-active' : 'hover:border-white/16',
        layout === 'tile' ? 'p-5' : 'px-5 py-4',
        className,
      ].join(' ')}
    >
      {children}

      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={springPop}
            className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-mint text-void"
          >
            <Check size={14} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Píldora compacta para respuestas de una palabra (frecuencias, días). */
export function Pill({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.95 }}
      transition={easeSnap}
      className={[
        'rounded-full px-4 py-2.5 text-sm transition-colors duration-200',
        selected
          ? 'bg-mint text-void font-semibold'
          : 'glass text-ink-soft hover:text-ink',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}
