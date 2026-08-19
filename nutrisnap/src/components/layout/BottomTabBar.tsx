import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Dumbbell, Home, ScanLine, User } from 'lucide-react';
import { easeSnap, springPop } from '../../lib/motion';

export type Tab = 'inicio' | 'analizar' | 'planes' | 'progreso' | 'perfil';

const TABS = [
  { id: 'inicio' as const, label: 'Inicio', Icon: Home },
  { id: 'planes' as const, label: 'Planes', Icon: Dumbbell },
  { id: 'analizar' as const, label: 'Analizar', Icon: ScanLine },
  { id: 'progreso' as const, label: 'Progreso', Icon: BarChart3 },
  { id: 'perfil' as const, label: 'Perfil', Icon: User },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

/**
 * 5 pestañas. La central ("Analizar") no es una pestaña más: es la acción
 * principal del producto, así que rompe la fila como un botón elevado.
 * El resto queda deliberadamente callado para que ese botón sea lo único
 * que pide ser tocado.
 */
export function BottomTabBar({ active, onChange }: Props) {
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Navegación principal"
      className="sticky bottom-0 z-40 shrink-0 border-t border-white/8 bg-void/80 backdrop-blur-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-end justify-around px-2 pt-2 pb-2">
        {TABS.map(({ id, label, Icon }) => {
          const isCenter = id === 'analizar';
          const isActive = active === id;

          if (isCenter) {
            return (
              <li key={id} className="relative -mt-7">
                <motion.button
                  type="button"
                  onClick={() => onChange(id)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  transition={easeSnap}
                  aria-label="Analizar comida"
                  aria-current={isActive ? 'page' : undefined}
                  className="grid h-16 w-16 place-items-center rounded-full bg-mint text-void shadow-[0_12px_36px_-8px_rgba(16,185,129,0.75)]"
                >
                  <ScanLine size={26} strokeWidth={2.2} />
                </motion.button>
                {/* Anillo pulsante sutil: recuerda que ahí vive la magia. */}
                {!isActive && !reduce && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full border border-mint/50"
                    animate={{ scale: [1, 1.28], opacity: [0.55, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </li>
            );
          }

          return (
            <li key={id} className="flex-1">
              <motion.button
                type="button"
                onClick={() => onChange(id)}
                whileTap={{ scale: 0.9 }}
                transition={easeSnap}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'relative flex w-full flex-col items-center gap-1 rounded-2xl py-2',
                  'transition-colors duration-200',
                  isActive ? 'text-mint' : 'text-ink-faint hover:text-ink-soft',
                ].join(' ')}
              >
                <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium tracking-tight">{label}</span>
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    transition={springPop}
                    className="absolute -top-0.5 h-1 w-1 rounded-full bg-mint"
                  />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
