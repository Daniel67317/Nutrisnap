import { motion } from 'framer-motion';
import { Dumbbell, Flame, Scale } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { OptionCard } from '../../../components/ui/Card';
import { StepHeader } from '../../../components/ui/StepHeader';
import { BODY_TYPE_OPTIONS, GOAL_OPTIONS } from '../../../lib/data';
import { easeSoft, staggerItem, staggerList } from '../../../lib/motion';
import type { BodyType, Goal } from '../../../lib/types';

const GOAL_ICONS = { flame: Flame, scale: Scale, dumbbell: Dumbbell } as const;

/**
 * Silueta abstracta cuyo ancho de torso cambia con el tipo de cuerpo.
 * Es lo suficientemente esquemática para no ser un juicio sobre el cuerpo
 * de nadie, y lo bastante clara para elegir de un vistazo.
 */
function BodyGlyph({ type, active }: { type: BodyType; active: boolean }) {
  const torso = { delgado: 13, normal: 19, sobrepeso: 26 }[type];
  const color = active ? 'var(--color-mint)' : 'var(--color-ink-faint)';

  return (
    <svg viewBox="0 0 48 64" className="h-16 w-12" aria-hidden fill="none">
      <circle cx="24" cy="11" r="7.5" fill={color} />
      <motion.rect
        initial={false}
        animate={{ x: 24 - torso / 2, width: torso }}
        transition={easeSoft}
        y="22"
        height="27"
        rx={torso / 2.4}
        fill={color}
      />
      <rect x="20" y="49" width="3.2" height="13" rx="1.6" fill={color} />
      <rect x="24.8" y="49" width="3.2" height="13" rx="1.6" fill={color} />
    </svg>
  );
}

interface Props {
  bodyType?: BodyType;
  goal?: Goal;
  onChangeBodyType: (v: BodyType) => void;
  onChangeGoal: (v: Goal) => void;
  onNext: () => void;
}

export function BodyGoalStep({
  bodyType,
  goal,
  onChangeBodyType,
  onChangeGoal,
  onNext,
}: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        eyebrow="Paso 2 de 5"
        title="¿Dónde estás y a dónde vas?"
        subtitle="No hay respuesta correcta. Elige lo que más se parezca a tu situación de hoy."
      />

      <motion.section variants={staggerList} initial="hidden" animate="show">
        <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-soft">
          Tu cuerpo hoy
        </h2>
        <div role="radiogroup" aria-label="Tipo de cuerpo" className="grid grid-cols-3 gap-2.5">
          {BODY_TYPE_OPTIONS.map((opt) => (
            <motion.div key={opt.value} variants={staggerItem}>
              <OptionCard
                selected={bodyType === opt.value}
                onSelect={() => onChangeBodyType(opt.value)}
                ariaLabel={`${opt.label}. ${opt.description}`}
                className="flex w-full flex-col items-center px-2 py-4"
              >
                <BodyGlyph type={opt.value} active={bodyType === opt.value} />
                <span className="mt-2 text-center text-[13px] leading-tight font-semibold">
                  {opt.label}
                </span>
              </OptionCard>
            </motion.div>
          ))}
        </div>

        <h2 className="mt-8 mb-3 text-[13px] font-semibold tracking-wide text-ink-soft">
          Tu objetivo principal
        </h2>
        <div role="radiogroup" aria-label="Objetivo" className="space-y-2.5">
          {GOAL_OPTIONS.map((opt) => {
            const Icon = GOAL_ICONS[opt.icon];
            const selected = goal === opt.value;
            return (
              <motion.div key={opt.value} variants={staggerItem}>
                <OptionCard
                  selected={selected}
                  onSelect={() => onChangeGoal(opt.value)}
                  layout="row"
                  ariaLabel={`${opt.label}. ${opt.description}`}
                  className="flex w-full items-center gap-4 pr-12"
                >
                  <span
                    className={[
                      'grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors',
                      selected ? 'bg-mint/18 text-mint' : 'bg-white/6 text-ink-faint',
                    ].join(' ')}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[15px] font-semibold tracking-tight">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{opt.description}</span>
                  </span>
                </OptionCard>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <div className="mt-auto pt-8">
        <Button full onClick={onNext} disabled={!bodyType || !goal}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
