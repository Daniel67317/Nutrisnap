import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookmarkPlus, Check, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { processChatMessage, starterPrompts, type ChatReply } from '../lib/chat';
import { createId } from '../lib/storage';
import { easeSnap, easeSoft } from '../lib/motion';
import type { Macros, MealItem } from '../lib/types';

interface Message {
  id: string;
  from: 'yo' | 'nutri';
  text: string;
  meal?: { items: MealItem[]; totals: Macros };
  saved?: boolean;
}

/** Puntos de "escribiendo…". Sin él, la respuesta instantánea se siente falsa. */
function Typing() {
  const reduce = useReducedMotion();
  return (
    <div className="glass flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-faint"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

/** El motor devuelve **negritas** en markdown mínimo. Nada más. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
        chunk.startsWith('**') && chunk.endsWith('**') ? (
          <strong key={i} className="font-semibold text-mint">
            {chunk.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </>
  );
}

export function Chat() {
  const { state, targets, consumedToday, addMeal } = useApp();
  const profile = state.profile;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'saludo',
      from: 'nutri',
      text: profile?.name
        ? `Hola ${profile.name}. Cuéntame qué comiste y te doy los números, o pídeme ideas.`
        : 'Hola. Cuéntame qué comiste y te doy los números, o pídeme ideas.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const starters = useMemo(() => starterPrompts(new Date().getHours()), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !profile || !targets || thinking) return;

      setMessages((m) => [...m, { id: createId(), from: 'yo', text }]);
      setDraft('');
      setThinking(true);

      // Pausa deliberada: una respuesta en 0 ms se lee como un formulario,
      // no como una conversación.
      await new Promise((r) => setTimeout(r, 550 + Math.random() * 450));

      let reply: ChatReply;
      try {
        reply = await processChatMessage(text, profile, targets, consumedToday);
      } catch {
        reply = { text: 'Se me cruzaron los cables. ¿Puedes repetirlo?' };
      }

      setMessages((m) => [...m, { id: createId(), from: 'nutri', ...reply }]);
      setThinking(false);
    },
    [profile, targets, consumedToday, thinking],
  );

  function saveMeal(messageId: string, meal: NonNullable<Message['meal']>) {
    addMeal({ source: 'chat', items: meal.items, totals: meal.totals });
    setMessages((m) => m.map((msg) => (msg.id === messageId ? { ...msg, saved: true } : msg)));
  }

  if (!profile || !targets) return null;

  return (
    <div className="flex flex-1 flex-col">
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversación con Nutri"
        className="flex-1 space-y-3 overflow-y-auto px-5 pt-5 pb-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const mine = msg.from === 'yo';
            return (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={easeSoft}
                className={`flex gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                {!mine && (
                  <span className="mt-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/14 font-display text-[13px] font-bold text-mint">
                    N
                  </span>
                )}

                <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={[
                      'rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-line',
                      mine
                        ? 'rounded-br-md bg-mint text-void font-medium'
                        : 'glass rounded-bl-md text-ink',
                    ].join(' ')}
                  >
                    <RichText text={msg.text} />
                  </div>

                  {msg.meal && (
                    <motion.button
                      type="button"
                      onClick={() => !msg.saved && saveMeal(msg.id, msg.meal!)}
                      disabled={msg.saved}
                      whileTap={msg.saved ? undefined : { scale: 0.95 }}
                      transition={easeSnap}
                      className={[
                        'mt-2 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold',
                        msg.saved
                          ? 'bg-mint/14 text-mint'
                          : 'glass text-ink hover:border-white/20',
                      ].join(' ')}
                    >
                      {msg.saved ? (
                        <>
                          <Check size={14} strokeWidth={3} /> Guardado
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={14} /> Guardar en mi diario
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <span className="mt-auto grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/14 font-display text-[13px] font-bold text-mint">
              N
            </span>
            <Typing />
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Los atajos sólo aparecen antes del primer mensaje: después estorban. */}
      {messages.length === 1 && !thinking && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeSoft, delay: 0.2 }}
          className="flex gap-2 overflow-x-auto px-5 pb-3"
        >
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="glass shrink-0 rounded-full px-3.5 py-2 text-[13px] text-ink-soft hover:text-ink"
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}

      <div
        className="shrink-0 border-t border-white/8 px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="glass flex items-end gap-2 rounded-3xl py-1.5 pr-1.5 pl-4 focus-within:border-mint/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter envía; Shift+Enter salta línea. En móvil el teclado
              // manda su propio salto, por eso comprobamos shiftKey.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Cuéntame qué comiste…"
            aria-label="Mensaje para Nutri"
            className="max-h-28 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-snug text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <motion.button
            type="button"
            onClick={() => send(draft)}
            disabled={!draft.trim() || thinking}
            whileTap={{ scale: 0.9 }}
            transition={easeSnap}
            aria-label="Enviar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-void transition-opacity disabled:opacity-30"
          >
            <Send size={17} strokeWidth={2.4} />
          </motion.button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Estimaciones a partir de porciones típicas. No son consejo médico.
        </p>
      </div>
    </div>
  );
}
