import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { formatNumber } from '../../lib/nutrition';

/**
 * Cuenta hasta el valor con desaceleración.
 * Se usa en el anillo del dashboard y al recalcular macros en el analizador:
 * ver el número moverse es lo que hace que el ajuste se sienta "en vivo".
 * Respeta prefers-reduced-motion saltando directo al valor final.
 */
export function AnimatedNumber({
  value,
  duration = 0.9,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(display, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // `display` se omite a propósito: incluirlo reiniciaría la animación
    // en cada frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce]);

  return <span className={`tnum ${className}`}>{formatNumber(display)}</span>;
}
