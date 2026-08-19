import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { formatNumber } from '../../lib/nutrition';

const SIZE = 208;
const STROKE = 15;
const R = (SIZE - STROKE) / 2 - 6;
const C = SIZE / 2;

interface Props {
  consumed: number;
  target: number;
}

/**
 * Anillo de calorías: la pieza firma del Dashboard.
 *
 * Un único `useMotionValue` gobierna el arco y la cabeza luminosa, así que
 * jamás pueden desincronizarse. El degradado va de menta a naranja a lo largo
 * del recorrido: el color se calienta a medida que se llena el día.
 *
 * Por encima del 100% el arco se detiene en la vuelta completa y el centro
 * pasa a naranja. Sin alarmas ni rojos: pasarse de calorías es un dato, no
 * una falta.
 */
export function CalorieRing({ consumed, target }: Props) {
  const reduce = useReducedMotion();
  const ratio = target > 0 ? consumed / target : 0;
  const filled = Math.min(ratio, 1);
  const over = Math.max(consumed - target, 0);
  const remaining = Math.max(target - consumed, 0);

  const progress = useMotionValue(reduce ? filled : 0);

  useEffect(() => {
    if (reduce) {
      progress.set(filled);
      return;
    }
    const controls = animate(progress, filled, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.12,
    });
    return () => controls.stop();
  }, [filled, progress, reduce]);

  // La cabeza se dibuja arriba del todo y se rota con el mismo valor. Rotar
  // un <g> es transform CSS puro: funciona igual en todos los navegadores.
  // Animar cx/cy como atributos SVG no lo hace.
  const capRotate = useTransform(progress, (p) => p * 360);
  const capOpacity = useTransform(progress, (p) => (p > 0.015 ? 1 : 0));

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-mint)" />
            <stop offset="100%" stopColor="var(--color-ember)" />
          </linearGradient>
          <filter id="ring-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Carril */}
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={STROKE}
        />

        {/* Arco de progreso — framer-motion traduce pathLength a dasharray */}
        <motion.circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ pathLength: progress }}
        />

        {/* Cabeza luminosa: da la sensación de instrumento vivo */}
        <motion.g
          style={{
            rotate: capRotate,
            opacity: capOpacity,
            transformOrigin: `${C}px ${C}px`,
          }}
        >
          <circle
            cx={C}
            cy={C - R}
            r={STROKE / 2 - 2.5}
            fill="var(--color-ink)"
            filter="url(#ring-glow)"
          />
        </motion.g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={consumed}
          className="font-display text-[46px] leading-none font-bold tracking-tight"
        />
        <p className="tnum mt-1.5 text-[13px] text-ink-faint">de {formatNumber(target)} kcal</p>

        {over > 0 ? (
          <p className="tnum mt-3 rounded-full bg-ember/12 px-3 py-1 text-[12px] font-medium text-ember">
            ≈{formatNumber(over)} por encima
          </p>
        ) : (
          <p className="tnum mt-3 rounded-full bg-white/6 px-3 py-1 text-[12px] font-medium text-ink-soft">
            quedan ≈{formatNumber(remaining)}
          </p>
        )}
      </div>
    </div>
  );
}
