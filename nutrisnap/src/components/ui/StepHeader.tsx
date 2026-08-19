import { motion } from 'framer-motion';
import { easeSoft } from '../../lib/motion';

/**
 * Barra de progreso segmentada del onboarding.
 * Segmentos (no puntos): comunican cuánto falta, no sólo dónde estás.
 * El segmento activo se llena con `layout` para que el avance se sienta continuo.
 */
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={false}
            animate={{ scaleX: i <= step ? 1 : 0 }}
            transition={easeSoft}
            style={{ originX: 0 }}
            className="h-full rounded-full bg-mint"
          />
        </div>
      ))}
    </div>
  );
}

export function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-7">
      {eyebrow && (
        <p className="mb-2 font-display text-[11px] font-semibold tracking-[0.18em] text-mint uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[26px] leading-[1.15] font-bold tracking-tight text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft text-pretty">{subtitle}</p>
      )}
    </header>
  );
}
