import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { BottomTabBar, type Tab } from './components/layout/BottomTabBar';
import { PhoneShell } from './components/layout/PhoneShell';
import { AppProvider, useApp } from './context/AppContext';
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow';
import { Dashboard } from './screens/Dashboard';
import { Analyzer } from './screens/Analyzer';
import { Chat } from './screens/Chat';
import { Plans } from './screens/Plans';
import { Progress } from './screens/Progress';
import { Profile } from './screens/Profile';
import { easeSnap, easeSoft } from './lib/motion';

/**
 * Nutri no es una pestaña: es una hoja que se levanta sobre lo que estabas
 * haciendo y se cierra dejándote donde estabas. Convertirlo en pestaña
 * costaría un sexto ítem en una barra que ya está llena.
 */
function ChatSheet({ onClose }: { onClose: () => void }) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Una hoja modal que sólo se cierra con un botón atrapa a quien navega por
  // teclado. Escape es el gesto que todo el mundo ya conoce.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    // Guardamos dónde estaba el foco para devolverlo al cerrar: si no, el
    // usuario de teclado reaparece al principio de la página.
    const previous = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={easeSoft}
      ref={sheetRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Chat con Nutri"
      className="absolute inset-0 z-50 flex flex-col bg-void outline-none sm:rounded-[2.5rem]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-mint/14 font-display text-[13px] font-bold text-mint">
            N
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight">Nutri</span>
        </span>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.9 }}
          transition={easeSnap}
          aria-label="Cerrar chat"
          className="-mr-2 rounded-full p-2 text-ink-soft hover:text-ink"
        >
          <X size={19} />
        </motion.button>
      </div>
      <Chat />
    </motion.div>
  );
}

const VALID_TABS: Tab[] = ['inicio', 'analizar', 'planes', 'progreso', 'perfil'];

/**
 * El manifest declara un atajo a `/?tab=analizar`: mantener pulsado el icono
 * instalado y elegir "Registrar comida" debe abrir la cámara, no el
 * dashboard. Sin esto, el atajo es una promesa rota.
 */
function initialTab(): Tab {
  try {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && (VALID_TABS as string[]).includes(requested)) return requested as Tab;
  } catch {
    /* Entornos sin `location`: caemos al valor por defecto. */
  }
  return 'inicio';
}

function Shell() {
  const { state, completeOnboarding, setCameraPermission } = useApp();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [chatOpen, setChatOpen] = useState(false);

  // Limpiar el parámetro tras usarlo: si se queda, recargar devuelve siempre
  // a la misma pestaña aunque el usuario ya haya navegado a otra.
  useEffect(() => {
    if (window.location.search.includes('tab=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (!state.onboarded) {
    return (
      <PhoneShell>
        <OnboardingFlow onComplete={completeOnboarding} onCameraDecision={setCameraPermission} />
      </PhoneShell>
    );
  }

  function renderScreen() {
    switch (tab) {
      case 'inicio':
        return (
          <Dashboard
            onOpenAnalyzer={() => setTab('analizar')}
            onOpenPlans={() => setTab('planes')}
            onOpenChat={() => setChatOpen(true)}
          />
        );
      case 'analizar':
        return <Analyzer onDone={() => setTab('inicio')} />;
      case 'planes':
        return <Plans />;
      case 'progreso':
        return <Progress />;
      case 'perfil':
        return <Profile />;
    }
  }

  return (
    <PhoneShell>
      {/* El scroll vive dentro de la pantalla activa, no en la raíz: así la
          barra inferior queda fija sin position:fixed ni saltos en iOS. */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ ...easeSoft, duration: 0.28 }}
            className="flex flex-1 flex-col"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomTabBar active={tab} onChange={setTab} />

      <AnimatePresence>
        {chatOpen && <ChatSheet onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </PhoneShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
