/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Endpoint donde se envían las sugerencias del Centro de Sugerencias.
   * Sin esta variable, el feedback se queda en el dispositivo y la interfaz
   * lo advierte. Sirve cualquier receptor de POST con JSON: Formspree, un
   * Google Apps Script, una función de Supabase.
   */
  readonly VITE_FEEDBACK_ENDPOINT?: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
