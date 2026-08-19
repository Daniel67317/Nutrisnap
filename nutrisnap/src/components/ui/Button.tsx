import { motion } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { easeSnap } from '../../lib/motion';

type Variant = 'primary' | 'ghost' | 'quiet';

interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  // Un único botón sólido verde por pantalla: es la acción que avanza.
  primary:
    'bg-mint text-void font-semibold shadow-[0_10px_40px_-12px_rgba(16,185,129,0.7)] hover:bg-mint/90',
  // Acción secundaria: hereda el glass de la superficie.
  ghost: 'glass text-ink hover:border-white/20',
  // Terciaria: sólo texto, para "Ahora no", "Omitir", "Atrás".
  quiet: 'text-ink-soft hover:text-ink',
};

export function Button({
  variant = 'primary',
  full = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={easeSnap}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5',
        'text-[15px] tracking-tight select-none',
        'disabled:opacity-35 disabled:pointer-events-none',
        VARIANTS[variant],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </motion.button>
  );
}
