/* ── Modelo de acceso de la Beta ───────────────────────────────────────────
   Decisión: durante la Beta Temprana NO hay límites, ni muros de pago, ni
   anuncios. El brief lo dice tres veces de forma explícita ("análisis
   ilimitado", "acceso total a todas las funciones", "no incluir muros de
   pago"), así que la mención aislada a un uso "limitado" se trató como
   errata.

   Ahora bien: cuando el análisis deje de ser simulado y pase a una API de
   visión real, cada escaneo cuesta dinero. Por eso el acceso NO se decide
   en cada pantalla, sino aquí. Toda función de IA pregunta primero a
   `checkAccess()`. El día que haga falta una cuota, se cambia este archivo
   y ni un solo componente se toca.
   ------------------------------------------------------------------------ */

export const BETA = {
  /** Análisis de foto y chat sin tope de uso. */
  unlimitedAI: true,
  /** Sin precios, planes ni pasarelas de pago. */
  paywall: false,
  /** Sin anuncios ni "mira un video para desbloquear". */
  ads: false,
} as const;

export type AIFeature = 'analisis-foto' | 'chat-nutri' | 'plan-entrenamiento';

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAt?: Date };

/**
 * Única fuente de verdad sobre si una función de IA puede ejecutarse.
 *
 * Llámala SIEMPRE antes de disparar un análisis, nunca después:
 *
 *   const access = checkAccess('analisis-foto');
 *   if (!access.allowed) return showNotice(access.reason);
 *   await analyzePhoto(file);
 */
export function checkAccess(_feature: AIFeature): AccessResult {
  if (BETA.unlimitedAI) return { allowed: true };

  // Punto de extensión para la fase post-Beta. Hoy es código muerto a
  // propósito: existe para que añadir una cuota sea editar aquí y nada más.
  return { allowed: true };
}
