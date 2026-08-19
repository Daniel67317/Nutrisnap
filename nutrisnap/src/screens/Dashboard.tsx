import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { CalorieRing } from '../components/dashboard/CalorieRing';
import { MacroBars } from '../components/dashboard/MacroBars';
import { NutriCard, SnapBanner, WorkoutCard } from '../components/dashboard/ActionCards';
import { TodayMeals } from '../components/dashboard/TodayMeals';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { staggerItem, staggerList } from '../lib/motion';
import { TARGET_NOTE_COPY } from '../lib/nutrition';
import { getCoachNote, getTodaySession } from '../lib/training';

function greetingFor(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

interface Props {
  onOpenAnalyzer: () => void;
  onOpenPlans: () => void;
  onOpenChat: () => void;
}

export function Dashboard({ onOpenAnalyzer, onOpenPlans, onOpenChat }: Props) {
  const { state, targets, consumedToday, mealsToday, macrosOn, removeMeal, streak } = useApp();
  const profile = state.profile;

  // No debería ocurrir (el onboarding es obligatorio), pero mejor una guarda
  // explícita que un `!` que reviente en producción.
  if (!profile || !targets) return null;

  const session = getTodaySession(profile);
  const yesterday = macrosOn(-1);
  const note = getCoachNote(profile, targets, yesterday, session);
  const remaining = Math.max(targets.calories - consumedToday.calories, 0);

  // Los avisos de seguridad se muestran una sola vez, arriba, no repetidos
  // en cada tarjeta.
  const safetyNote = targets.notes.find((n) => n !== 'estimado');

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex-1 px-5 pt-7 pb-8"
    >
      <motion.header variants={staggerItem} className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-soft">{greetingFor(new Date().getHours())},</p>
          <h1 className="truncate font-display text-[25px] leading-tight font-bold tracking-tight">
            {profile.name ?? 'Bienvenido'} 👋
          </h1>
        </div>

        {streak > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ember/12 px-3 py-1.5 text-[13px] font-semibold text-ember">
            <Flame size={14} strokeWidth={2.4} />
            <span className="tnum">{streak}</span>
          </span>
        )}
      </motion.header>

      {safetyNote && (
        <motion.p
          variants={staggerItem}
          className="mb-4 rounded-2xl border border-ember/25 bg-ember/8 px-4 py-3 text-xs leading-relaxed text-ember"
        >
          {TARGET_NOTE_COPY[safetyNote]}
        </motion.p>
      )}

      {/* Anillo y macros en una sola tarjeta: son la misma pregunta
          ("¿cómo voy hoy?") vista con dos niveles de detalle. */}
      <motion.div variants={staggerItem}>
        <Card className="px-5 pt-6 pb-5">
          <CalorieRing consumed={consumedToday.calories} target={targets.calories} />
          <div className="mt-6 border-t border-white/8 pt-5">
            <MacroBars consumed={consumedToday} targets={targets} />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="mt-4">
        <SnapBanner onPress={onOpenAnalyzer} />
      </motion.div>

      <motion.div variants={staggerItem} className="mt-3">
        <WorkoutCard session={session} note={note} onStart={onOpenPlans} />
      </motion.div>

      <motion.div variants={staggerItem} className="mt-3">
        <NutriCard remaining={remaining} onPress={onOpenChat} />
      </motion.div>

      <motion.section variants={staggerItem} className="mt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[15px] font-bold tracking-tight">Hoy</h2>
          {mealsToday.length > 0 && (
            <span className="tnum text-[13px] text-ink-faint">
              {mealsToday.length} {mealsToday.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>
        <TodayMeals meals={mealsToday} onRemove={removeMeal} />
      </motion.section>

      <motion.p
        variants={staggerItem}
        className="mt-8 text-center text-[11px] leading-relaxed text-ink-faint"
      >
        Versión Beta 0.1 — Los datos son estimaciones de IA y pueden no ser 100% precisos.
        <br />
        No sustituyen el criterio de un profesional de la salud.
      </motion.p>
    </motion.div>
  );
}
