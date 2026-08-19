import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StepHeader } from '../../../components/ui/StepHeader';
import { LIMITS, type LimitKey, withinLimits } from '../../../lib/nutrition';
import { staggerItem, staggerList } from '../../../lib/motion';

export interface BasicsDraft {
  name: string;
  age: string;
  weightKg: string;
  heightCm: string;
}

interface Props {
  value: BasicsDraft;
  onChange: (patch: Partial<BasicsDraft>) => void;
  onNext: () => void;
  onSkip: () => void;
}

/** "72,5" y "72.5" son la misma cosa para un usuario hispanohablante. */
export function toNumber(raw: string): number | undefined {
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Vacío es válido (todo el paso es opcional). Con contenido, debe ser plausible. */
function fieldError(raw: string, key: LimitKey): string | null {
  if (!raw.trim()) return null;
  const n = toNumber(raw);
  if (n === undefined) return 'Escribe solo números.';
  if (!withinLimits(n, key)) {
    const { min, max } = LIMITS[key];
    return `Debe estar entre ${min} y ${max}.`;
  }
  return null;
}

function Field({
  id,
  label,
  suffix,
  inputMode = 'numeric',
  value,
  placeholder,
  error,
  onChange,
}: {
  id: string;
  label: string;
  suffix?: string;
  inputMode?: 'numeric' | 'text';
  value: string;
  placeholder?: string;
  error?: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div
        className={[
          'glass flex items-center gap-3 rounded-2xl px-4 py-3',
          error ? 'border-ember/50' : 'focus-within:border-mint/40',
        ].join(' ')}
      >
        <label htmlFor={id} className="w-[74px] shrink-0 text-[13px] text-ink-soft">
          {label}
        </label>
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="tnum min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:font-normal placeholder:text-ink-faint focus:outline-none"
        />
        {suffix && <span className="shrink-0 text-[13px] text-ink-faint">{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 px-4 text-xs text-ember">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Todo es opcional y lo decimos claramente: pedir datos sensibles con un
 * "Continuar" bloqueado es la forma más rápida de perder a alguien aquí.
 * Lo único que sí bloquea es un dato imposible — mejor promedio honesto que
 * cálculo basado en un dedazo.
 */
export function BasicsStep({ value, onChange, onNext, onSkip }: Props) {
  const errors = {
    age: fieldError(value.age, 'age'),
    weightKg: fieldError(value.weightKg, 'weightKg'),
    heightCm: fieldError(value.heightCm, 'heightCm'),
  };

  const hasError = Object.values(errors).some(Boolean);
  const hasAny = Object.values(value).some((v) => v.trim() !== '');

  return (
    <div className="flex min-h-full flex-col">
      <StepHeader
        eyebrow="Paso 4 de 5 · opcional"
        title="Afinemos los números"
        subtitle="Con tu peso y estatura calculamos tus calorías con precisión real en vez de un promedio."
      />

      <motion.div variants={staggerList} initial="hidden" animate="show" className="space-y-2.5">
        <motion.div variants={staggerItem}>
          <Field
            id="name"
            label="Nombre"
            inputMode="text"
            placeholder="¿Cómo te llamamos?"
            value={value.name}
            onChange={(v) => onChange({ name: v.slice(0, 40) })}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Field
            id="age"
            label="Edad"
            suffix="años"
            placeholder="28"
            value={value.age}
            error={errors.age}
            onChange={(v) => onChange({ age: v.replace(/\D/g, '').slice(0, 3) })}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Field
            id="weight"
            label="Peso"
            suffix="kg"
            placeholder="72"
            value={value.weightKg}
            error={errors.weightKg}
            onChange={(v) => onChange({ weightKg: v.replace(/[^\d.,]/g, '').slice(0, 5) })}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <Field
            id="height"
            label="Estatura"
            suffix="cm"
            placeholder="175"
            value={value.heightCm}
            error={errors.heightCm}
            onChange={(v) => onChange({ heightCm: v.replace(/\D/g, '').slice(0, 3) })}
          />
        </motion.div>
      </motion.div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3.5">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-mint" />
        <p className="text-xs leading-relaxed text-ink-soft">
          Si prefieres no decirlo ahora, usamos un promedio según lo que ya elegiste. Podrás
          completarlo después desde Perfil.
        </p>
      </div>

      <div className="mt-auto space-y-2 pt-8">
        <Button full onClick={onNext} disabled={hasError}>
          {hasAny ? 'Continuar' : 'Usar valores promedio'}
        </Button>
        {hasAny && (
          <Button full variant="quiet" onClick={onSkip}>
            Omitir por ahora
          </Button>
        )}
      </div>
    </div>
  );
}
