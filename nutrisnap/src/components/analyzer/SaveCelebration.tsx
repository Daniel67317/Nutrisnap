import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { springPop } from '../../lib/motion';

const COLORS = [
  'var(--color-mint)',
  'var(--color-ember)',
  'var(--color-macro-fat)',
  '#ffffff',
];

/**
 * Momento de recompensa al guardar una comida.
 *
 * Confeti hecho a mano en vez de una librería: son 30 divs y evita sumar un
 * paquete entero al bundle por dos segundos de animación.
 *
 * Con `prefers-reduced-motion` desaparecen las partículas y queda el check.
 * La confirmación sigue existiendo; lo que se va es la fiesta.
 */
export function SaveCelebration({ label }: { label: string }) {
  const reduce = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        angle: (i / 30) * Math.PI * 2 + Math.random() * 0.35,
        distance: 90 + Math.random() * 130,
        size: 5 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.12,
        spin: (Math.random() - 0.5) * 540,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-void/92 backdrop-blur-sm">
      <div className="relative grid place-items-center">
        {!reduce &&
          particles.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="absolute rounded-[2px]"
              style={{ width: p.size, height: p.size * 1.6, background: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                // +60px al final: las partículas caen, no flotan.
                y: Math.sin(p.angle) * p.distance + 60,
                opacity: 0,
                rotate: p.spin,
              }}
              transition={{ duration: 1.15, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}

        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springPop}
          className="grid h-20 w-20 place-items-center rounded-full bg-mint text-void"
        >
          <Check size={38} strokeWidth={3.2} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="absolute top-[110px] font-display text-[15px] font-semibold whitespace-nowrap"
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}
