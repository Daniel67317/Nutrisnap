import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, Pill } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import {
  BODY_TYPE_OPTIONS,
  GENDER_OPTIONS,
  GOAL_OPTIONS,
  LOG_FREQUENCY_OPTIONS,
  TRAINING_FREQUENCY_OPTIONS,
} from '../lib/data';
import { feedbackReachesTeam, sendFeedback } from '../lib/feedback';
import { easeSnap, easeSoft, staggerItem, staggerList } from '../lib/motion';
import { LIMITS, TARGET_NOTE_COPY, withinLimits } from '../lib/nutrition';

const APP_VERSION = 'Beta 0.1';

const ROADMAP = [
  { label: 'Sincronización con Apple Health y Google Fit', when: 'Próximo' },
  { label: 'Historial de fotos y comidas favoritas', when: 'Próximo' },
  { label: 'Reconocimiento con modelo de visión real', when: 'En curso' },
  { label: 'Recetas a partir de lo que te queda del día', when: 'Explorando' },
  { label: 'Versión con suscripción y funciones avanzadas', when: 'Más adelante' },
];

/** Sección plegable. Perfil tiene mucho contenido y todo abierto es un muro. */
function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-[15px] font-bold tracking-tight">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={easeSnap}>
          <ChevronDown size={18} className="text-ink-faint" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={easeSoft}
          >
            <div className="border-t border-white/8 px-5 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-2.5 text-[13px] font-semibold text-ink-soft">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  suffix,
  value,
  limit,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number | undefined;
  limit: 'age' | 'weightKg' | 'heightCm';
  onChange: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value != null ? String(value) : '');
  const parsed = parseFloat(draft.replace(',', '.'));
  const invalid = draft.trim() !== '' && (!Number.isFinite(parsed) || !withinLimits(parsed, limit));

  return (
    <div>
      <div
        className={`glass flex items-center gap-3 rounded-2xl px-4 py-3 ${invalid ? 'border-ember/50' : 'focus-within:border-mint/40'}`}
      >
        <span className="w-[70px] shrink-0 text-[13px] text-ink-soft">{label}</span>
        <input
          value={draft}
          inputMode="decimal"
          aria-invalid={invalid}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d.,]/g, '').slice(0, 5);
            setDraft(next);
            const n = parseFloat(next.replace(',', '.'));
            if (next.trim() === '') onChange(undefined);
            else if (Number.isFinite(n) && withinLimits(n, limit)) onChange(n);
          }}
          className="tnum min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:text-ink-faint focus:outline-none"
          placeholder="—"
        />
        <span className="shrink-0 text-[13px] text-ink-faint">{suffix}</span>
      </div>
      {invalid && (
        <p role="alert" className="mt-1.5 px-4 text-xs text-ember">
          Debe estar entre {LIMITS[limit].min} y {LIMITS[limit].max}.
        </p>
      )}
    </div>
  );
}

export function Profile() {
  const { state, targets, updateProfile, addSuggestion, resetApp, setCameraPermission } =
    useApp();
  const profile = state.profile;

  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');
  const [confirmReset, setConfirmReset] = useState(false);
  const [askingCamera, setAskingCamera] = useState(false);

  if (!profile || !targets) return null;

  const reaches = feedbackReachesTeam();

  // El onboarding promete "puedes activarlo luego en Perfil". Sin esto, esa
  // frase era mentira: quien dijo "ahora no" se quedaba sin cámara para
  // siempre.
  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermission('denegado');
      return;
    }
    setAskingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission('concedido');
    } catch {
      setCameraPermission('denegado');
    } finally {
      setAskingCamera(false);
    }
  }

  async function submitFeedback() {
    const text = feedback.trim();
    if (!text) return;

    setSending('enviando');
    try {
      await sendFeedback(text, { profile, appVersion: APP_VERSION });
      addSuggestion(text);
      setFeedback('');
      setSending('ok');
      setTimeout(() => setSending('idle'), 2600);
    } catch {
      setSending('error');
    }
  }

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex-1 px-5 pt-7 pb-8"
    >
      <motion.header variants={staggerItem}>
        <h1 className="font-display text-[25px] font-bold tracking-tight">
          {profile.name ?? 'Tu perfil'}
        </h1>
        <p className="tnum mt-1 text-[13px] text-ink-soft">
          Objetivo actual: ≈{targets.calories} kcal · {targets.protein} g de proteína
        </p>
      </motion.header>

      {targets.notes
        .filter((n) => n !== 'estimado')
        .map((n) => (
          <motion.p
            key={n}
            variants={staggerItem}
            className="mt-4 rounded-2xl border border-ember/25 bg-ember/8 px-4 py-3 text-xs leading-relaxed text-ember"
          >
            {TARGET_NOTE_COPY[n]}
          </motion.p>
        ))}

      <div className="mt-6 space-y-3">
        {/* ── Objetivo ── */}
        <motion.div variants={staggerItem}>
          <Section title="Objetivo y cuerpo" defaultOpen>
            <Group label="Género">
              {GENDER_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  selected={profile.gender === o.value}
                  onSelect={() => updateProfile({ gender: o.value })}
                >
                  {o.label}
                </Pill>
              ))}
            </Group>
            <Group label="Tu cuerpo hoy">
              {BODY_TYPE_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  selected={profile.bodyType === o.value}
                  onSelect={() => updateProfile({ bodyType: o.value })}
                >
                  {o.label}
                </Pill>
              ))}
            </Group>
            <Group label="Objetivo principal">
              {GOAL_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  selected={profile.goal === o.value}
                  onSelect={() => updateProfile({ goal: o.value })}
                >
                  {o.label}
                </Pill>
              ))}
            </Group>
            <p className="text-[12px] leading-relaxed text-ink-faint">
              Cada cambio recalcula tus calorías al instante.
            </p>
          </Section>
        </motion.div>

        {/* ── Datos ── */}
        <motion.div variants={staggerItem}>
          <Section title="Tus datos">
            <div className="space-y-2.5">
              <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:border-mint/40">
                <span className="w-[70px] shrink-0 text-[13px] text-ink-soft">Nombre</span>
                <input
                  defaultValue={profile.name ?? ''}
                  onChange={(e) => updateProfile({ name: e.target.value.slice(0, 40) || undefined })}
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-ink placeholder:text-ink-faint focus:outline-none"
                  placeholder="—"
                />
              </div>
              <NumberField
                label="Edad"
                suffix="años"
                limit="age"
                value={profile.age}
                onChange={(v) => updateProfile({ age: v })}
              />
              <NumberField
                label="Peso"
                suffix="kg"
                limit="weightKg"
                value={profile.weightKg}
                onChange={(v) => updateProfile({ weightKg: v })}
              />
              <NumberField
                label="Estatura"
                suffix="cm"
                limit="heightCm"
                value={profile.heightCm}
                onChange={(v) => updateProfile({ heightCm: v })}
              />
            </div>
          </Section>
        </motion.div>

        {/* ── Hábitos ── */}
        <motion.div variants={staggerItem}>
          <Section title="Hábitos y notas">
            <Group label="Frecuencia de registro">
              {LOG_FREQUENCY_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  selected={profile.logFrequency === o.value}
                  onSelect={() => updateProfile({ logFrequency: o.value })}
                >
                  {o.label}
                </Pill>
              ))}
            </Group>
            <Group label="Días de entrenamiento">
              {TRAINING_FREQUENCY_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  selected={profile.trainingFrequency === o.value}
                  onSelect={() => updateProfile({ trainingFrequency: o.value })}
                >
                  {o.label}
                </Pill>
              ))}
            </Group>
            <h3 className="mb-2.5 text-[13px] font-semibold text-ink-soft">
              Lo que Nutri debe tener en cuenta
            </h3>
            <div className="glass rounded-2xl p-1 focus-within:border-mint/40">
              <textarea
                defaultValue={profile.dietNotes}
                maxLength={200}
                rows={3}
                onChange={(e) => updateProfile({ dietNotes: e.target.value })}
                placeholder="Quiero bajar los carbohidratos en la noche…"
                className="w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
          </Section>
        </motion.div>

        {/* ── Cámara ── */}
        <motion.div variants={staggerItem}>
          <Section title="Cámara">
            {state.cameraPermission === 'concedido' ? (
              <p className="flex items-center gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <Check size={16} className="shrink-0 text-mint" strokeWidth={2.6} />
                La cámara está activa. Puedes analizar comidas al instante.
              </p>
            ) : (
              <>
                <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
                  Ahora mismo analizas subiendo fotos de tu galería. Con la cámara activa el
                  registro baja a un par de toques.
                </p>
                <Button full onClick={requestCamera} disabled={askingCamera}>
                  {askingCamera ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Esperando permiso…
                    </>
                  ) : (
                    <>
                      <Camera size={16} strokeWidth={2.3} /> Activar cámara
                    </>
                  )}
                </Button>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
                  Si ya lo bloqueaste antes, el navegador no volverá a preguntar: tendrás que
                  permitirlo desde el candado de la barra de direcciones.
                </p>
              </>
            )}
          </Section>
        </motion.div>

        {/* ── Centro de Sugerencias ── */}
        <motion.div variants={staggerItem}>
          <Section title="Centro de Sugerencias" defaultOpen>
            <p className="mb-3 text-[13px] leading-relaxed text-ink-soft">
              Estás usando una versión anticipada. Dinos qué te falta y lo tenemos en cuenta.
            </p>

            <div className="glass rounded-2xl p-1 focus-within:border-mint/40">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value.slice(0, 600))}
                rows={4}
                placeholder="Me gustaría que la app pudiera…"
                aria-label="Tu sugerencia"
                className="w-full resize-none bg-transparent px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>

            <motion.button
              type="button"
              onClick={submitFeedback}
              disabled={!feedback.trim() || sending === 'enviando'}
              whileTap={{ scale: 0.96 }}
              transition={easeSnap}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-mint py-3 text-[14px] font-semibold text-void disabled:opacity-35"
            >
              {sending === 'enviando' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando…
                </>
              ) : sending === 'ok' ? (
                <>
                  <Check size={16} strokeWidth={3} /> ¡Gracias!
                </>
              ) : (
                <>
                  <Send size={15} strokeWidth={2.4} /> Enviar sugerencia
                </>
              )}
            </motion.button>

            {sending === 'error' && (
              <p role="alert" className="mt-2 text-center text-xs text-ember">
                No pudimos enviarla. Revisa tu conexión e inténtalo otra vez.
              </p>
            )}

            {/* Decir la verdad sobre dónde acaba el mensaje. Un "¡gracias!"
                sobre algo que nunca sale del teléfono es una mentira pequeña
                que erosiona la confianza justo donde más falta hace. */}
            {!reaches && (
              <p className="mt-3 flex gap-2 rounded-2xl bg-white/4 px-3.5 py-3 text-[11px] leading-relaxed text-ink-faint">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-ember" />
                Aún no hay servidor conectado: tu sugerencia se guarda sólo en este dispositivo.
                Configura <code className="text-ink-soft">VITE_FEEDBACK_ENDPOINT</code> para
                recibirlas.
              </p>
            )}

            {state.suggestions.length > 0 && (
              <p className="tnum mt-3 text-center text-[12px] text-ink-faint">
                Has enviado {state.suggestions.length}{' '}
                {state.suggestions.length === 1 ? 'sugerencia' : 'sugerencias'}
              </p>
            )}
          </Section>
        </motion.div>

        {/* ── Roadmap ── */}
        <motion.div variants={staggerItem}>
          <Section title="Próximamente">
            <ul className="space-y-3">
              {ROADMAP.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-mint" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-faint">{item.when}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>

        {/* ── Aviso legal ── */}
        <motion.div variants={staggerItem}>
          <Section title="Precisión y aviso legal">
            <div className="space-y-3 text-[13px] leading-relaxed text-ink-soft">
              <p>
                Todas las cifras de NutriSnap son <strong className="text-ink">estimaciones</strong>.
                Las porciones se deducen de una foto o de una descripción, y los valores
                nutricionales salen de tablas de composición genéricas: dos platos idénticos a la
                vista pueden diferir bastante en realidad.
              </p>
              <p>
                Los objetivos calóricos se calculan con la ecuación de Mifflin-St Jeor, que es una
                estimación estadística, no una medición de tu metabolismo.
              </p>
              <p>
                NutriSnap no es un dispositivo médico ni sustituye a un nutricionista, un médico o
                un entrenador. Si tienes una condición de salud, estás embarazada, tomas medicación
                o tienes una relación difícil con la comida, consulta a un profesional antes de
                seguir cualquier plan.
              </p>
              <p className="text-ink-faint">
                Tus datos se guardan únicamente en este dispositivo. No hay cuentas ni servidores.
              </p>
            </div>
          </Section>
        </motion.div>

        {/* ── Reiniciar ── */}
        <motion.div variants={staggerItem}>
          <Section title="Restablecer la app">
            <p className="mb-4 text-[13px] leading-relaxed text-ink-soft">
              Borra tu perfil, tus comidas, tu peso y tus rachas de este dispositivo, y vuelve a
              empezar el onboarding. No se puede deshacer.
            </p>

            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-ember">
                  ¿Seguro? Se perderá todo tu historial.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" full onClick={() => setConfirmReset(false)}>
                    Cancelar
                  </Button>
                  <motion.button
                    type="button"
                    onClick={resetApp}
                    whileTap={{ scale: 0.96 }}
                    transition={easeSnap}
                    className="flex-1 rounded-2xl border border-ember/40 bg-ember/12 py-3.5 text-[15px] font-semibold text-ember"
                  >
                    Sí, borrar todo
                  </motion.button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" full onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} /> Restablecer datos
              </Button>
            )}
          </Section>
        </motion.div>
      </div>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-faint">
        NutriSnap {APP_VERSION}
        <br />
        Los datos son estimaciones de IA y pueden no ser 100% precisos.
      </p>
    </motion.div>
  );
}
