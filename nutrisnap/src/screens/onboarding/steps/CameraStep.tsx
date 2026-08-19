import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, ImageUp, MessageSquareText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { easeSoft, staggerItem, staggerList } from '../../../lib/motion';
import type { AppState } from '../../../lib/types';

interface Props {
  onDecision: (permission: AppState['cameraPermission']) => void;
}

/**
 * Antes de pedir el permiso, explicamos qué gana el usuario y qué pasa si
 * dice que no. Un `getUserMedia()` a quemarropa se deniega mucho más.
 */
export function CameraStep({ onDecision }: Props) {
  const reduce = useReducedMotion();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCamera() {
    setError(null);

    // getUserMedia sólo existe en contexto seguro (https o localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite acceder a la cámara. Puedes subir fotos desde la galería.');
      onDecision('denegado');
      return;
    }

    setRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      // Sólo queríamos el permiso: liberamos la cámara hasta que se use de verdad.
      stream.getTracks().forEach((t) => t.stop());
      onDecision('concedido');
    } catch {
      setError('No pudimos activar la cámara. Puedes seguir con fotos de galería o describiendo tu comida por chat.');
      onDecision('denegado');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="show"
      className="flex min-h-dvh flex-col justify-end px-6 pt-16 pb-10"
    >
      {/* Marco de encuadre animado: muestra el gesto de la app en vez de describirlo */}
      <motion.div variants={staggerItem} className="mb-10 flex justify-center">
        <div className="relative grid h-40 w-40 place-items-center">
          <motion.div
            className="absolute inset-0 rounded-[2rem] border-2 border-mint/30"
            animate={reduce ? { opacity: 0.5 } : { scale: [1, 1.06, 1], opacity: [0.35, 0.8, 0.35] }}
            transition={reduce ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-mint/12 text-mint">
            <Camera size={34} strokeWidth={1.8} />
          </div>
          {/* Esquinas de encuadre, como un visor real */}
          {[
            'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
          ].map((pos) => (
            <span key={pos} className={`absolute h-7 w-7 border-mint ${pos}`} />
          ))}
        </div>
      </motion.div>

      <motion.h1
        variants={staggerItem}
        className="font-display text-[28px] leading-[1.15] font-bold tracking-tight text-balance"
      >
        Deja que la cámara haga el trabajo
      </motion.h1>

      <motion.p variants={staggerItem} className="mt-3 text-[15px] leading-relaxed text-ink-soft text-pretty">
        NutriSnap necesita acceso a tu cámara para analizar tus comidas al instante. Una foto y listo: calorías y macros estimados en segundos.
      </motion.p>

      <motion.ul variants={staggerItem} className="mt-6 space-y-3 text-sm text-ink-soft">
        <li className="flex items-center gap-3">
          <ImageUp size={17} className="shrink-0 text-ink-faint" />
          Sin cámara también funciona: sube fotos desde tu galería.
        </li>
        <li className="flex items-center gap-3">
          <MessageSquareText size={17} className="shrink-0 text-ink-faint" />
          O escríbele a Nutri lo que comiste y él calcula.
        </li>
      </motion.ul>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeSoft}
          role="status"
          className="mt-5 rounded-2xl border border-ember/25 bg-ember/8 px-4 py-3 text-sm text-ember"
        >
          {error}
        </motion.p>
      )}

      <motion.div variants={staggerItem} className="mt-8 space-y-2">
        <Button full onClick={requestCamera} disabled={requesting}>
          {requesting ? 'Esperando permiso…' : 'Permitir acceso'}
        </Button>
        <Button full variant="quiet" onClick={() => onDecision('denegado')}>
          Ahora no
        </Button>
      </motion.div>

      <motion.p variants={staggerItem} className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
        Las fotos se procesan en tu dispositivo durante la Beta. Puedes cambiar esto luego en Perfil.
      </motion.p>
    </motion.div>
  );
}
