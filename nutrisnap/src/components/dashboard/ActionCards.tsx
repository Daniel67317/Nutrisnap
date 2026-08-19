import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Camera, Clock, MessageCircle, Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { easeSnap } from '../../lib/motion';
import { formatNumber } from '../../lib/nutrition';
import type { Session } from '../../lib/training';

/**
 * Snap Rápido. Es la única superficie sólida en menta de todo el Dashboard:
 * si algo se toca aquí, es esto. El resto de tarjetas se mantiene en glass
 * para no competir.
 */
export function SnapBanner({ onPress }: { onPress: () => void }) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={easeSnap}
      className="relative w-full overflow-hidden rounded-3xl bg-mint px-5 py-4 text-left text-void shadow-[0_16px_44px_-14px_rgba(16,185,129,0.7)]"
    >
      {/* Brillo que barre el banner cada pocos segundos: recuerda el escaneo
          sin robarle protagonismo al anillo. */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-24 bg-white/25 blur-xl"
          animate={{ x: ['-6rem', '26rem'] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        />
      )}
      <div className="relative flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-void/12">
          <Camera size={22} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16px] font-bold tracking-tight">
            Registrar comida con IA
          </span>
          <span className="block text-[13px] font-medium opacity-70">
            Una foto y listo, en 5 segundos
          </span>
        </span>
        <ArrowRight size={20} strokeWidth={2.4} className="shrink-0 opacity-60" />
      </div>
    </motion.button>
  );
}

const INTENSITY_STYLE = {
  suave: 'bg-white/8 text-ink-soft',
  moderada: 'bg-mint/14 text-mint',
  alta: 'bg-ember/14 text-ember',
} as const;

export function WorkoutCard({
  session,
  note,
  onStart,
}: {
  session: Session;
  note: string;
  onStart: () => void;
}) {
  const isRest = session.type === 'descanso';

  return (
    <Card className="p-5">
      <p className="font-display text-[11px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
        Entrenamiento sugerido para hoy
      </p>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight">{session.title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">{session.focus}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${INTENSITY_STYLE[session.intensity]}`}
        >
          {session.intensity}
        </span>
      </div>

      {!isRest && (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-faint">
          <Clock size={14} /> {session.durationMin} min
        </p>
      )}

      {/* La "nota del entrenador": lo que conecta lo que comiste ayer con lo
          que toca hoy. Es la parte de la app que se siente inteligente. */}
      <p className="mt-4 border-l-2 border-mint/50 pl-3 text-[13px] leading-relaxed text-ink-soft">
        {note}
      </p>

      <motion.button
        type="button"
        onClick={onStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={easeSnap}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/8 py-3 text-[14px] font-semibold text-ink hover:bg-white/12"
      >
        <Play size={15} strokeWidth={2.4} fill="currentColor" />
        {isRest ? 'Ver la semana' : 'Iniciar rutina'}
      </motion.button>
    </Card>
  );
}

export function NutriCard({
  remaining,
  onPress,
}: {
  remaining: number;
  onPress: () => void;
}) {
  const reduce = useReducedMotion();
  const prompt =
    remaining > 150
      ? `Te quedan ≈${formatNumber(remaining)} kcal. ¿Qué te preparo?`
      : 'Cuéntame qué comiste y lo calculo.';

  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={easeSnap}
      className="glass flex w-full items-center gap-4 rounded-3xl px-5 py-4 text-left hover:border-white/20"
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint/14 font-display text-lg font-bold text-mint">
        N
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-mint/40"
            animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold tracking-tight">
          Pregúntale a Nutri
        </span>
        <span className="block truncate text-[13px] text-ink-soft">{prompt}</span>
      </span>
      <MessageCircle size={19} className="shrink-0 text-ink-faint" />
    </motion.button>
  );
}
