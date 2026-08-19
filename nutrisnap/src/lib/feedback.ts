import type { UserProfile } from './types';

/* ── Envío de sugerencias ──────────────────────────────────────────────────
   El brief pedía guardar el feedback en localStorage. Eso funciona como
   demo, pero significa que las sugerencias NUNCA salen del teléfono de quien
   las escribe: el equipo no las ve jamás. Y recoger opiniones es el propósito
   declarado de esta Beta.

   Solución: mismo patrón que visión. Si existe la variable de entorno
   VITE_FEEDBACK_ENDPOINT, las sugerencias viajan de verdad. Si no, se
   guardan en local y la interfaz LO DICE, en vez de fingir que se enviaron.
   ------------------------------------------------------------------------ */

export interface FeedbackContext {
  profile: UserProfile | null;
  appVersion: string;
}

export interface FeedbackProvider {
  readonly id: string;
  /** Si es false, la UI debe avisar de que el mensaje no sale del dispositivo. */
  readonly reachesTeam: boolean;
  send(message: string, context: FeedbackContext): Promise<void>;
}

class LocalFeedbackProvider implements FeedbackProvider {
  readonly id = 'local';
  readonly reachesTeam = false;

  async send(message: string): Promise<void> {
    // En desarrollo es útil verlo; en producción sin endpoint, es lo único
    // que hay.
    console.info('[NutriSnap] Sugerencia guardada localmente:', message);
  }
}

class EndpointFeedbackProvider implements FeedbackProvider {
  readonly id = 'endpoint';
  readonly reachesTeam = true;

  constructor(private readonly url: string) {}

  async send(message: string, context: FeedbackContext): Promise<void> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        appVersion: context.appVersion,
        // Contexto mínimo para poder interpretar la sugerencia. Sin nombre,
        // sin peso, sin nada que identifique a nadie.
        objetivo: context.profile?.goal ?? null,
        modalidad: context.profile?.workoutMode ?? null,
        enviadoEn: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  }
}

const endpoint = import.meta.env?.VITE_FEEDBACK_ENDPOINT;

let provider: FeedbackProvider = endpoint
  ? new EndpointFeedbackProvider(endpoint)
  : new LocalFeedbackProvider();

export function setFeedbackProvider(next: FeedbackProvider): void {
  provider = next;
}

/** ¿Las sugerencias llegan al equipo, o se quedan en el dispositivo? */
export function feedbackReachesTeam(): boolean {
  return provider.reachesTeam;
}

export async function sendFeedback(
  message: string,
  context: FeedbackContext,
): Promise<void> {
  await provider.send(message.trim(), context);
}
