import type { ReactNode } from 'react';

/**
 * En móvil: ocupa toda la pantalla.
 * En escritorio: un "teléfono" de 480 px centrado sobre el degradado ambiental
 * del body, con un halo suave que lo despega del fondo.
 *
 * `dvh` en vez de `vh`: en Safari iOS la barra de direcciones se contrae y
 * `100vh` deja un hueco bajo la barra de navegación.
 */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center">
      <div
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        className={[
          'relative flex w-full max-w-[480px] flex-col',
          // Instalada en iOS no hay barra de Safari: sin el inset superior,
          // el contenido queda debajo del notch y de la hora del sistema.
          'sm:pt-0',
          'min-h-dvh bg-void',
          // El marco sólo se dibuja cuando hay espacio a los lados.
          'sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2.5rem]',
          'sm:border sm:border-white/8 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]',
          'sm:overflow-hidden',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
