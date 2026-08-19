import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber';
import { Button } from '../../../components/ui/Button';
import { StepHeader } from '../../../components/ui/StepHeader';
import {
  BODY_TYPE_OPTIONS,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  LOG_FREQUENCY_OPTIONS,
  TRAINING_FREQUENCY_OPTIONS,
} from '../../../lib/data';
import { TARGET_NOTE_COPY, calcTargets } from '../../../lib/nutrition';
import { easeSoft, springPop, staggerItem, staggerList } from '../../../lib/motion';
import type { UserProfile } from '../../../lib/types';

interface Props {
  profile: UserProfile;
  onEdit: () => void;
  onStart: () => void;
}

const MACRO_ROWS = [
  { key: 'protein', label: 'Proteína', color: 'var(--color-macro-protein)' },
  { key: 'carbs', label: 'Carbohidratos', color: 'var(--color-macro-carbs)' },
  { key: 'fat', label: 'Grasas', color: 'var(--color-macro-fat)' },
] as const;

export function SummaryStep({ profile, onEdit, onStart }: Props) {
  const targets = calcTargets(profile);

  const chips = [
    GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label,
    BODY_TYPE_OPTIONS.find((o) => o.value === profile.bodyType)?.label,
    GOAL_OPTIONS.find((o) => o.value === profile.goal)?.label,
    TRAINING_FREQUENCY_OPTIONS.find((o) => o.value === profile.trainingFrequency)?.label,
    LOG_FREQUENCY_OPTIONS.find((o) => o.value === profile.logFrequency)?.label,
  ].filter(Boolean) as string[];

  // Reparto calórico de cada macro, para la barra apilada.
  const kcalByMacro = {
    protein: targets.protein * 4,
    carbs: targets.carbs * 4,
    fat: targets.fat * 9,
  };
  const totalMacroKcal = kcalByMacro.protein + kcalByMacro.carbs + kcalByMacro.fat;

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        eyebrow="Paso 5 de 5"
        title={profile.name ? `Todo listo, ${profile.name}` : 'Todo listo'}
        subtitle="Este es tu punto de partida. Se ajusta solo a medida que registras comidas y entrenos."
      />

      {/* El número grande es el momento de pago del onboarding: cuenta hacia
          arriba en vez de aparecer, para que se lea como un cálculo. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPop, delay: 0.1 }}
        className="glass rounded-3xl p-6 text-center"
      >
        <p className="font-display text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
          Tu objetivo diario
        </p>
        <p className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-ink-faint text-2xl">≈</span>
          <AnimatedNumber
            value={targets.calories}
            className="font-display text-[52px] leading-none font-bold tracking-tight"
          />
          <span className="text-lg font-medium text-ink-soft">kcal</span>
        </p>

        {/* Barra apilada: proporción de macros de un vistazo, sin leer cifras. */}
        <div className="mt-6 flex h-2 overflow-hidden rounded-full bg-white/8">
          {MACRO_ROWS.map((m, i) => (
            <motion.div
              key={m.key}
              initial={{ width: 0 }}
              animate={{ width: `${(kcalByMacro[m.key] / totalMacroKcal) * 100}%` }}
              transition={{ ...easeSoft, delay: 0.35 + i * 0.08 }}
              style={{ background: m.color }}
            />
          ))}
        </div>

        <motion.dl
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="mt-5 grid grid-cols-3 gap-2"
        >
          {MACRO_ROWS.map((m) => (
            <motion.div key={m.key} variants={staggerItem}>
              <dt className="flex items-center justify-center gap-1.5 text-[11px] text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                {m.label}
              </dt>
              <dd className="tnum mt-1 font-display text-lg font-semibold">
                {targets[m.key]} g
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </motion.div>

      {/* Los avisos de seguridad no se esconden en letra gris: si ajustamos
          el objetivo del usuario, tiene derecho a saber por qué. */}
      {targets.notes.map((note) => (
        <p
          key={note}
          className={[
            'mt-3 rounded-2xl px-4 py-3 text-xs leading-relaxed',
            note === 'estimado'
              ? 'text-center text-ink-faint'
              : 'border border-ember/25 bg-ember/8 text-ember',
          ].join(' ')}
        >
          {TARGET_NOTE_COPY[note]}
        </p>
      ))}

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold tracking-wide text-ink-soft">Tu perfil</h2>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-[13px] text-mint hover:underline"
          >
            <Pencil size={13} /> Editar
          </button>
        </div>
        <motion.ul
          variants={staggerList}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-2"
        >
          {chips.map((chip) => (
            <motion.li
              key={chip}
              variants={staggerItem}
              className="rounded-full bg-white/6 px-3.5 py-2 text-[13px] text-ink-soft"
            >
              {chip}
            </motion.li>
          ))}
        </motion.ul>

        {profile.dietNotes.trim() && (
          <p className="mt-3 rounded-2xl border-l-2 border-mint/50 bg-white/4 px-4 py-3 text-sm leading-relaxed text-ink-soft italic">
            “{profile.dietNotes.trim()}”
          </p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <Button full onClick={onStart}>
          Comenzar
        </Button>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
          Versión Beta 0.1 — Los datos son estimaciones de IA y pueden no ser 100% precisos.
        </p>
      </div>
    </div>
  );
}
