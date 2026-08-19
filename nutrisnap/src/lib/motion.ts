import type { Transition, Variants } from 'framer-motion';

/* ── Vocabulario de movimiento ─────────────────────────────────────────────
   Toda la app usa estas tres curvas. Si una animación necesita una curva
   distinta, casi siempre es señal de que está intentando llamar la atención
   sobre algo que no lo merece.
   ------------------------------------------------------------------------ */

/** Por defecto: entradas y salidas de contenido. */
export const easeSoft: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

/** Reacción táctil: botones, selección. Rápida, sin rebote. */
export const easeSnap: Transition = {
  duration: 0.18,
  ease: [0.4, 0, 0.2, 1],
};

/** Momentos de celebración: check al guardar, aparición del anillo. */
export const springPop: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.8,
};

/** Micro-interacción estándar de todo elemento presionable. */
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.95 },
  transition: easeSnap,
} as const;

/** Deslizamiento entre pasos del onboarding. `custom` = dirección (1 o -1). */
export const stepSlide: Variants = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: easeSoft },
  exit: (dir: number) => ({
    x: dir * -48,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  }),
};

/** Lista que aparece en cascada. Úsalo con `staggerItem` en los hijos. */
export const staggerList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeSoft },
};
