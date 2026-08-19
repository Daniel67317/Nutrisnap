import { useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Camera, ImageUp, Loader2 } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { easeSnap, easeSoft } from '../../lib/motion';

interface Props {
  /** Sólo intentamos abrir la cámara si el usuario ya dijo que sí. */
  cameraAllowed: boolean;
  onCaptured: (blob: Blob) => void;
}

/** Esquinas de encuadre: el lenguaje visual de "aquí se apunta". */
function Frame() {
  return (
    <div className="pointer-events-none absolute inset-6" aria-hidden>
      {[
        'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
        'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
        'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
        'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
      ].map((pos) => (
        <span key={pos} className={`absolute h-9 w-9 border-white/50 ${pos}`} />
      ))}
    </div>
  );
}

export function CameraStage({ cameraAllowed, onCaptured }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { videoRef, status, error, capture } = useCamera(cameraAllowed);

  const live = status === 'activa';

  async function shoot() {
    const blob = await capture();
    if (blob) onCaptured(blob);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 overflow-hidden bg-black">
        {/* playsInline es obligatorio: sin él iOS abre el vídeo a pantalla
            completa y se lleva por delante toda la interfaz. */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            live ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {live && <Frame />}

        {status === 'iniciando' && (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 size={26} className="animate-spin text-ink-faint" />
          </div>
        )}

        {!cameraAllowed && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center">
            <div>
              <ImageUp size={30} className="mx-auto text-ink-faint" strokeWidth={1.6} />
              <p className="mt-4 text-[15px] font-medium text-ink-soft">
                Sube una foto de tu comida
              </p>
              <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-ink-faint">
                Funciona igual de bien. También puedes activar la cámara desde Perfil.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={easeSoft}
            role="alert"
            className="absolute inset-x-5 bottom-5 flex gap-3 rounded-2xl border border-ember/25 bg-void/90 px-4 py-3.5 backdrop-blur"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-ember" />
            <p className="text-[13px] leading-relaxed text-ink-soft">{error}</p>
          </motion.div>
        )}
      </div>

      <div className="shrink-0 px-6 pt-6 pb-4">
        {live ? (
          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Subir foto de la galería"
              className="grid h-12 w-12 place-items-center rounded-2xl text-ink-soft hover:text-ink"
            >
              <ImageUp size={22} />
            </button>

            {/* Obturador: aro exterior fijo, disco interior que reacciona.
                Es el gesto de cámara que todo el mundo ya conoce. */}
            <motion.button
              type="button"
              onClick={shoot}
              whileTap={{ scale: 0.9 }}
              transition={easeSnap}
              aria-label="Tomar foto"
              className="grid h-[74px] w-[74px] place-items-center rounded-full border-[3px] border-white/80"
            >
              <motion.span
                whileTap={{ scale: 0.82 }}
                className="block h-[58px] w-[58px] rounded-full bg-white"
              />
            </motion.button>

            <span className="h-12 w-12" aria-hidden />
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => fileRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={easeSnap}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mint px-6 py-4 font-semibold text-void shadow-[0_14px_40px_-14px_rgba(16,185,129,0.7)]"
          >
            <Camera size={19} strokeWidth={2.3} />
            Elegir foto
          </motion.button>
        )}

        {/* `capture` hace que el móvil abra la cámara nativa directamente.
            Es el plan B cuando getUserMedia no está disponible: no necesita
            HTTPS ni permisos web. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCaptured(file);
            e.target.value = '';
          }}
        />

        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Las porciones son estimaciones. Podrás ajustarlas antes de guardar.
        </p>
      </div>
    </div>
  );
}
