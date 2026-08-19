import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { OptionCard } from '../../../components/ui/Card';
import { StepHeader } from '../../../components/ui/StepHeader';
import { GENDER_OPTIONS } from '../../../lib/data';
import { staggerItem, staggerList } from '../../../lib/motion';
import type { Gender } from '../../../lib/types';

interface Props {
  value?: Gender;
  onChange: (gender: Gender) => void;
  onNext: () => void;
}

export function GenderStep({ value, onChange, onNext }: Props) {
  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        eyebrow="Paso 1 de 5"
        title="Bienvenido a tu asistente de nutrición inteligente"
        subtitle="Empecemos por lo básico. Esto ajusta tus calorías y las rutinas que te vamos a sugerir."
      />

      <motion.div
        variants={staggerList}
        initial="hidden"
        animate="show"
        role="radiogroup"
        aria-label="Género"
        className="grid grid-cols-2 gap-3"
      >
        {GENDER_OPTIONS.map((opt) => (
          <motion.div key={opt.value} variants={staggerItem}>
            <OptionCard
              selected={value === opt.value}
              onSelect={() => onChange(opt.value)}
              ariaLabel={opt.label}
              className="w-full"
            >
              <span className="mb-3 block text-4xl leading-none">{opt.emoji}</span>
              <span className="block font-display text-lg font-semibold tracking-tight">
                {opt.label}
              </span>
              <span className="mt-1 block text-xs leading-snug text-ink-soft">{opt.hint}</span>
            </OptionCard>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        Lo usamos para estimar tu metabolismo basal. Puedes cambiarlo cuando quieras desde Perfil.
      </p>

      <div className="mt-auto pt-8">
        <Button full onClick={onNext} disabled={!value}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
