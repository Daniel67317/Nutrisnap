import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Flame,
  Lock,
  Plus,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { dayKey } from '../lib/storage';
import { easeSnap, staggerItem, staggerList } from '../lib/motion';
import { formatNumber } from '../lib/nutrition';

const DAY_LABEL = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const AXIS = { stroke: '#6b6b6a', fontSize: 11 };
const GRID = 'rgba(255,255,255,0.07)';

export function Progress() {
  const { state, targets, macrosOn, logWeight, streak } = useApp();
  const [weightDraft, setWeightDraft] = useState('');

  // Últimos 7 días, del más antiguo al más reciente.
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 6;
      const date = new Date(Date.now() + offset * 86_400_000);
      const macros = macrosOn(offset);
      return {
        label: DAY_LABEL[date.getDay()],
        kcal: macros?.calories ?? 0,
        protein: macros?.protein ?? 0,
        registrado: macros !== null,
      };
    });
  }, [macrosOn]);

  const weightData = useMemo(
    () =>
      state.weightLog.slice(-30).map((w) => ({
        label: w.date.slice(5).replace('-', '/'),
        kg: w.kg,
      })),
    [state.weightLog],
  );

  const daysLogged = week.filter((d) => d.registrado).length;

  const badges = useMemo(() => {
    if (!targets) return [];
    const proteinHit = week.some((d) => d.registrado && d.protein >= targets.protein);
    const earlyBird = state.meals.some((m) => new Date(m.loggedAt).getHours() < 9);
    const routineDone = Object.values(state.completedExercises).some((v) => v.length >= 4);

    return [
      { id: 'primera', Icon: Target, label: 'Primer registro', got: state.meals.length > 0 },
      { id: 'constante', Icon: Flame, label: 'Tres días seguidos', got: streak >= 3 },
      { id: 'perfecta', Icon: Trophy, label: 'Semana perfecta', got: streak >= 7 },
      { id: 'proteina', Icon: Award, label: 'Proteína al 100%', got: proteinHit },
      { id: 'madrugador', Icon: Sunrise, label: 'Madrugador', got: earlyBird },
      { id: 'entreno', Icon: TrendingUp, label: 'Rutina completa', got: routineDone },
    ];
  }, [state, targets, week, streak]);

  if (!targets) return null;

  function saveWeight() {
    const kg = parseFloat(weightDraft.replace(',', '.'));
    if (!Number.isFinite(kg) || kg < 30 || kg > 300) return;
    logWeight(kg);
    setWeightDraft('');
  }

  const alreadyToday = state.weightLog.some((w) => w.date === dayKey());

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex-1 px-5 pt-7 pb-8"
    >
      <motion.h1 variants={staggerItem} className="font-display text-[25px] font-bold tracking-tight">
        Tu progreso
      </motion.h1>

      {/* Racha */}
      <motion.div variants={staggerItem} className="mt-5">
        <Card className="flex items-center gap-4 px-5 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ember/12 text-ember">
            <Flame size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] leading-none font-bold">
              <span className="tnum">{streak}</span>
              <span className="ml-1.5 text-[14px] font-medium text-ink-soft">
                {streak === 1 ? 'día seguido' : 'días seguidos'}
              </span>
            </p>
            <p className="mt-1 text-[12px] text-ink-faint">
              {daysLogged} de los últimos 7 días con registro
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Calorías de la semana */}
      <motion.section variants={staggerItem} className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-bold tracking-tight">
          Calorías esta semana
        </h2>
        <Card className="px-2 py-4">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={week} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} width={44} />
              {/* La línea de objetivo es la referencia que da sentido a las
                  barras: sin ella son siete números sueltos. */}
              <ReferenceLine
                y={targets.calories}
                stroke="var(--color-mint)"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a1a1a0' }}
                formatter={(v: number) => [`${formatNumber(v)} kcal`, 'Consumido']}
              />
              <Bar dataKey="kcal" fill="var(--color-ember)" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-1 px-3 text-center text-[11px] text-ink-faint">
            La línea punteada es tu objetivo de {formatNumber(targets.calories)} kcal.
          </p>
        </Card>
      </motion.section>

      {/* Peso */}
      <motion.section variants={staggerItem} className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-bold tracking-tight">Peso</h2>
        <Card className="px-2 py-4">
          {weightData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 6, right: 14, left: -14, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS}
                  width={44}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#a1a1a0' }}
                  formatter={(v: number) => [`${v} kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="var(--color-mint)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--color-mint)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="px-4 py-8 text-center text-[13px] leading-relaxed text-ink-faint">
              Anota tu peso dos veces y aquí verás la tendencia.
              <br />
              Un solo dato no es una línea.
            </p>
          )}

          <div className="mt-3 flex gap-2 px-3">
            <div className="glass flex flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 focus-within:border-mint/40">
              <input
                value={weightDraft}
                onChange={(e) => setWeightDraft(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
                inputMode="decimal"
                placeholder={alreadyToday ? 'Corregir el de hoy' : 'Tu peso de hoy'}
                aria-label="Peso en kilogramos"
                className="tnum min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-faint focus:outline-none"
              />
              <span className="shrink-0 text-[13px] text-ink-faint">kg</span>
            </div>
            <motion.button
              type="button"
              onClick={saveWeight}
              disabled={!weightDraft.trim()}
              whileTap={{ scale: 0.94 }}
              transition={easeSnap}
              aria-label="Guardar peso"
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-2xl bg-mint text-void disabled:opacity-30"
            >
              <Plus size={19} strokeWidth={2.6} />
            </motion.button>
          </div>
        </Card>
      </motion.section>

      {/* Insignias */}
      <motion.section variants={staggerItem} className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-bold tracking-tight">Insignias</h2>
        <ul className="grid grid-cols-3 gap-2">
          {badges.map(({ id, Icon, label, got }) => (
            <li
              key={id}
              className={[
                'flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center transition-colors',
                got ? 'glass-active glass' : 'glass opacity-45',
              ].join(' ')}
            >
              <span className={got ? 'text-mint' : 'text-ink-faint'}>
                {got ? <Icon size={20} strokeWidth={2} /> : <Lock size={18} strokeWidth={2} />}
              </span>
              <span className="text-[11px] leading-tight font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.p variants={staggerItem} className="mt-8 text-center text-[11px] leading-relaxed text-ink-faint">
        El peso fluctúa por agua, sal y sueño. Mira la tendencia de semanas, no el número de hoy.
      </motion.p>
    </motion.div>
  );
}
