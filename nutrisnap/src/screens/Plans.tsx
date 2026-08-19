import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Dumbbell, Info, PersonStanding } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { exercisesFor } from '../lib/exercises';
import { easeSnap, easeSoft, staggerItem, staggerList } from '../lib/motion';
import { WEEKDAYS, getCoachNote, getWeekPlan } from '../lib/training';
import type { WorkoutMode } from '../lib/types';

const MODES: { value: WorkoutMode; label: string; Icon: typeof Dumbbell }[] = [
  { value: 'gimnasio', label: 'Gimnasio', Icon: Dumbbell },
  { value: 'calistenia', label: 'Calistenia', Icon: PersonStanding },
];

/** Índice de hoy en la semana, con lunes en la posición 0. */
const todayIndex = () => (new Date().getDay() + 6) % 7;

export function Plans() {
  const { state, targets, macrosOn, completedToday, toggleExercise, updateProfile } = useApp();
  const profile = state.profile;
  const [day, setDay] = useState(todayIndex);

  const week = useMemo(() => (profile ? getWeekPlan(profile) : []), [profile]);

  if (!profile || !targets) return null;

  const session = week[day];
  const isToday = day === todayIndex();
  const exercises = exercisesFor(session.type, profile.workoutMode);
  const note = getCoachNote(profile, targets, macrosOn(-1), session);

  // Sólo se puede marcar la rutina de hoy: dejar marcar el jueves desde el
  // lunes convierte el registro en un dato sin valor.
  const doneCount = isToday
    ? exercises.filter((e) => completedToday.includes(e.id)).length
    : 0;

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex-1 px-5 pt-7 pb-8"
    >
      <motion.h1 variants={staggerItem} className="font-display text-[25px] font-bold tracking-tight">
        Tu plan
      </motion.h1>

      {/* Modalidad */}
      <motion.div variants={staggerItem} className="mt-5 flex gap-2">
        {MODES.map(({ value, label, Icon }) => {
          const active = profile.workoutMode === value;
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => updateProfile({ workoutMode: value })}
              whileTap={{ scale: 0.96 }}
              transition={easeSnap}
              aria-pressed={active}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold transition-colors',
                active ? 'bg-mint text-void' : 'glass text-ink-soft hover:text-ink',
              ].join(' ')}
            >
              <Icon size={17} strokeWidth={2.2} />
              {label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Calendario horizontal */}
      <motion.div variants={staggerItem} className="mt-5 flex gap-1.5" role="tablist" aria-label="Días de la semana">
        {WEEKDAYS.map((label, i) => {
          const active = day === i;
          const rest = week[i].type === 'descanso';
          return (
            <motion.button
              key={label + i}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDay(i)}
              whileTap={{ scale: 0.94 }}
              transition={easeSnap}
              className={[
                'relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors',
                active ? 'bg-white/12' : 'hover:bg-white/5',
              ].join(' ')}
            >
              <span className={`text-[12px] font-semibold ${active ? 'text-ink' : 'text-ink-faint'}`}>
                {label}
              </span>
              <span
                className={[
                  'h-1.5 w-1.5 rounded-full',
                  rest ? 'bg-white/20' : active ? 'bg-mint' : 'bg-mint/45',
                ].join(' ')}
              />
              {i === todayIndex() && (
                <span className="absolute inset-x-3 bottom-1 h-px bg-ember" aria-hidden />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Nota del entrenador */}
      <motion.div variants={staggerItem} className="mt-5">
        <Card className="flex gap-3 px-4 py-3.5">
          <Info size={16} className="mt-0.5 shrink-0 text-mint" />
          <p className="text-[13px] leading-relaxed text-ink-soft">{note}</p>
        </Card>
      </motion.div>

      {/* Sesión */}
      <motion.div variants={staggerItem} className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight">{session.title}</h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">{session.focus}</p>
          </div>
          {isToday && exercises.length > 0 && (
            <span className="tnum shrink-0 text-[13px] text-ink-faint">
              {doneCount}/{exercises.length}
            </span>
          )}
        </div>

        {exercises.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/12 px-6 py-10 text-center text-[13px] leading-relaxed text-ink-faint">
            Día de descanso. El músculo crece fuera del entreno, no dentro.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {exercises.map((ex) => {
                const done = isToday && completedToday.includes(ex.id);
                return (
                  <motion.li
                    key={ex.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={easeSoft}
                    className={`glass rounded-2xl px-4 py-3.5 transition-opacity ${done ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-[14px] font-semibold ${done ? 'line-through decoration-ink-faint' : ''}`}
                        >
                          {ex.name}
                        </h3>
                        <p className="mt-0.5 text-[12px] text-ink-faint">{ex.muscle}</p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="tnum rounded-full bg-white/8 px-2.5 py-1 text-[12px] font-medium">
                            {ex.sets} × {ex.reps}
                          </span>
                          <span className="tnum rounded-full bg-ember/12 px-2.5 py-1 text-[12px] font-medium text-ember">
                            RPE {ex.rpe}
                          </span>
                        </div>

                        {ex.cue && (
                          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
                            {ex.cue}
                          </p>
                        )}
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => isToday && toggleExercise(ex.id)}
                        disabled={!isToday}
                        whileTap={isToday ? { scale: 0.88 } : undefined}
                        transition={easeSnap}
                        aria-pressed={done}
                        aria-label={`Marcar ${ex.name} como completado`}
                        className={[
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                          done
                            ? 'border-mint bg-mint text-void'
                            : 'border-white/20 text-transparent',
                          isToday ? 'hover:border-mint/60' : 'opacity-30',
                        ].join(' ')}
                      >
                        <Check size={17} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {!isToday && exercises.length > 0 && (
          <p className="mt-3 text-center text-[12px] text-ink-faint">
            Sólo puedes marcar la rutina del día de hoy.
          </p>
        )}
      </motion.div>

      <motion.p variants={staggerItem} className="mt-8 text-center text-[11px] leading-relaxed text-ink-faint">
        RPE es el esfuerzo percibido: 8 significa que podrías haber hecho dos repeticiones más.
        <br />
        Si algo te duele —no arde, duele— para y consulta a un profesional.
      </motion.p>
    </motion.div>
  );
}
