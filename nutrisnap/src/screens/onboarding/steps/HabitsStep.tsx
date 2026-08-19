import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Pill } from '../../../components/ui/Card';
import { StepHeader } from '../../../components/ui/StepHeader';
import {
  DIET_NOTE_EXAMPLES,
  LOG_FREQUENCY_OPTIONS,
  TRAINING_FREQUENCY_OPTIONS,
} from '../../../lib/data';
import { staggerItem, staggerList } from '../../../lib/motion';
import type { LogFrequency, TrainingFrequency } from '../../../lib/types';

const MAX_NOTES = 200;

interface Props {
  logFrequency?: LogFrequency;
  trainingFrequency?: TrainingFrequency;
  dietNotes: string;
  onChangeLog: (v: LogFrequency) => void;
  onChangeTraining: (v: TrainingFrequency) => void;
  onChangeNotes: (v: string) => void;
  onNext: () => void;
}

export function HabitsStep({
  logFrequency,
  trainingFrequency,
  dietNotes,
  onChangeLog,
  onChangeTraining,
  onChangeNotes,
  onNext,
}: Props) {
  // Un ejemplo fijo por sesión: rotarlo mientras el usuario escribe distrae.
  const placeholder = useMemo(
    () => DIET_NOTE_EXAMPLES[Math.floor(Math.random() * DIET_NOTE_EXAMPLES.length)],
    [],
  );

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        eyebrow="Paso 3 de 5"
        title="Tu ritmo"
        subtitle="Con esto ajustamos el gasto calórico y qué tan seguido te vamos a molestar."
      />

      <motion.section variants={staggerList} initial="hidden" animate="show" className="space-y-8">
        <motion.div variants={staggerItem}>
          <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-soft">
            ¿Cada cuánto vas a registrar comidas?
          </h2>
          <div role="radiogroup" aria-label="Frecuencia de registro" className="flex flex-wrap gap-2">
            {LOG_FREQUENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                selected={logFrequency === opt.value}
                onSelect={() => onChangeLog(opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-soft">
            ¿Cuántos días entrenas por semana?
          </h2>
          <div role="radiogroup" aria-label="Frecuencia de entrenamiento" className="flex flex-wrap gap-2">
            {TRAINING_FREQUENCY_OPTIONS.map((opt) => (
              <Pill
                key={opt.value}
                selected={trainingFrequency === opt.value}
                onSelect={() => onChangeTraining(opt.value)}
              >
                {opt.label}
              </Pill>
            ))}
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <label
            htmlFor="diet-notes"
            className="mb-1 block text-[13px] font-semibold tracking-wide text-ink-soft"
          >
            ¿Algo más que Nutri deba saber?
          </label>
          <p className="mb-3 text-xs text-ink-faint">
            Escríbelo con tus palabras. Nutri lo tendrá en cuenta al recomendarte comidas.
          </p>
          <div className="glass rounded-3xl p-1 focus-within:border-mint/40">
            <textarea
              id="diet-notes"
              value={dietNotes}
              maxLength={MAX_NOTES}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full resize-none rounded-[1.3rem] bg-transparent px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <div className="px-4 pb-2 text-right text-[11px] tnum text-ink-faint">
              {dietNotes.length}/{MAX_NOTES}
            </div>
          </div>
        </motion.div>
      </motion.section>

      <div className="mt-auto pt-8">
        <Button full onClick={onNext} disabled={!logFrequency || !trainingFrequency}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
