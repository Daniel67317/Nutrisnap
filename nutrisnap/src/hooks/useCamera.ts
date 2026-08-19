import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'inactiva' | 'iniciando' | 'activa' | 'error';

/* ── Cámara en vivo ────────────────────────────────────────────────────────
   Tres cosas que rompen esto en móvil y que aquí están cubiertas:

   1. iOS abre el vídeo a pantalla completa si falta `playsInline`. El
      atributo se pone en el <video> del componente, no aquí, pero sin él
      todo lo demás da igual.
   2. Si no se paran las pistas al desmontar, el LED de la cámara se queda
      encendido y el usuario asume que la app lo está grabando. Es la clase
      de detalle que hace que alguien desinstale.
   3. `getUserMedia` sólo existe bajo HTTPS o en localhost.
   ------------------------------------------------------------------------ */

/** Traduce los errores del navegador a algo que una persona pueda accionar. */
function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Bloqueaste el acceso a la cámara. Puedes activarlo en los ajustes del navegador, o subir una foto de tu galería.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No encontramos una cámara en este dispositivo. Sube una foto de tu galería.';
    case 'NotReadableError':
      return 'Otra aplicación está usando la cámara. Ciérrala e inténtalo de nuevo.';
    default:
      return 'No pudimos abrir la cámara. Sube una foto de tu galería y sigue igual.';
  }
}

export function useCamera(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('inactiva');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      setStatus('inactiva');
      return;
    }

    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite abrir la cámara. Necesita HTTPS.');
        setStatus('error');
        return;
      }

      setStatus('iniciando');
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false,
        });

        // El usuario pudo salir de la pantalla mientras se concedía el
        // permiso: si no comprobamos esto, dejamos un stream huérfano.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Safari no arranca solo aunque el elemento tenga autoPlay.
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus('activa');
      } catch (err) {
        if (cancelled) return;
        setError(describeError(err));
        setStatus('error');
      }
    }

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, stop]);

  /** Congela el fotograma actual como JPEG. */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9),
    );
  }, []);

  return { videoRef, status, error, capture, stop };
}
