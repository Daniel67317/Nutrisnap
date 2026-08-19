import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { StepProgress } from '../../components/ui/StepHeader';
import { easeSnap, stepSlide } from '../../lib/motion';
import type { AppState, UserProfile } from '../../lib/types';
import { CameraStep } from './steps/CameraStep';
import { GenderStep } from './steps/GenderStep';
import { BodyGoalStep } from './steps/BodyGoalStep';
import { HabitsStep } from './steps/HabitsStep';
import { BasicsStep, toNumber, type BasicsDraft } from './steps/BasicsStep';
import { SummaryStep } from './steps/SummaryStep';

/* Orden real del flujo:
   cámara → género → cuerpo+objetivo → hábitos → datos básicos → resumen

   Nota sobre el brief: los datos básicos van ANTES del resumen (y no al
   final del todo) para que el resumen ya muestre las calorías calculadas
   con datos reales. Poner el número grande al final es el pago del flujo;
   pedir datos después de él lo desinfla. */
const TOTAL_STEPS = 5;

type Draft = Partial<Omit<UserProfile, 'createdAt'>>;

const EMPTY_BASICS: BasicsDraft = { name: '', age: '', weightKg: '', heightCm: '' };

interface Props {
  onComplete: (profile: UserProfile) => void;
  onCameraDecision: (permission: AppState['cameraPermission']) => void;
}

export function OnboardingFlow({ onComplete, onCameraDecision }: Props) {
  const [askedCamera, setAskedCamera] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [draft, setDraft] = useState<Draft>({ dietNotes: '' });
  const [basics, setBasics] = useState<BasicsDraft>(EMPTY_BASICS);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const patch = (p: Draft) => setDraft((d) => ({ ...d, ...p }));

  function buildProfile(withBasics: boolean): UserProfile {
    return {
      gender: draft.gender!,
      bodyType: draft.bodyType!,
      goal: draft.goal!,
      dietNotes: draft.dietNotes ?? '',
      logFrequency: draft.logFrequency!,
      trainingFrequency: draft.trainingFrequency!,
      workoutMode: 'gimnasio',
      name: withBasics ? basics.name.trim() || undefined : undefined,
      age: withBasics ? toNumber(basics.age) : undefined,
      weightKg: withBasics ? toNumber(basics.weightKg) : undefined,
      heightCm: withBasics ? toNumber(basics.heightCm) : undefined,
      createdAt: new Date().toISOString(),
    };
  }

  if (!askedCamera) {
    return (
      <CameraStep
        onDecision={(permission) => {
          onCameraDecision(permission);
          setAskedCamera(true);
        }}
      />
    );
  }

  const steps = [
    <GenderStep
      key="gender"
      value={draft.gender}
      onChange={(gender) => patch({ gender })}
      onNext={() => go(1)}
    />,
    <BodyGoalStep
      key="body"
      bodyType={draft.bodyType}
      goal={draft.goal}
      onChangeBodyType={(bodyType) => patch({ bodyType })}
      onChangeGoal={(goal) => patch({ goal })}
      onNext={() => go(2)}
    />,
    <HabitsStep
      key="habits"
      logFrequency={draft.logFrequency}
      trainingFrequency={draft.trainingFrequency}
      dietNotes={draft.dietNotes ?? ''}
      onChangeLog={(logFrequency) => patch({ logFrequency })}
      onChangeTraining={(trainingFrequency) => patch({ trainingFrequency })}
      onChangeNotes={(dietNotes) => patch({ dietNotes })}
      onNext={() => go(3)}
    />,
    <BasicsStep
      key="basics"
      value={basics}
      onChange={(p) => setBasics((b) => ({ ...b, ...p }))}
      onNext={() => go(4)}
      onSkip={() => {
        setBasics(EMPTY_BASICS);
        go(4);
      }}
    />,
    step === 4 ? (
      <SummaryStep
        key="summary"
        profile={buildProfile(true)}
        onEdit={() => go(0)}
        onStart={() => onComplete(buildProfile(true))}
      />
    ) : null,
  ];

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-5 pb-8">
      <div className="mb-6 flex items-center gap-4">
        <motion.button
          type="button"
          onClick={() => go(Math.max(step - 1, 0))}
          whileTap={{ scale: 0.9 }}
          transition={easeSnap}
          disabled={step === 0}
          aria-label="Volver al paso anterior"
          className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-opacity hover:text-ink disabled:pointer-events-none disabled:opacity-0"
        >
          <ArrowLeft size={19} />
        </motion.button>
        <StepProgress step={step} total={TOTAL_STEPS} />
      </div>

      {/* mode="wait": evita que dos pasos se solapen y se lean como un glitch. */}
      <div className="relative flex flex-1 flex-col">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepSlide}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-1 flex-col"
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
