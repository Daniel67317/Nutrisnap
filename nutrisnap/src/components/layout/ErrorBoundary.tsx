import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/* ── Red de seguridad ──────────────────────────────────────────────────────
   Sin esto, una excepción en cualquier pantalla deja la pantalla en blanco.
   El usuario asume que perdió su historial y borra la app — cuando en
   realidad sus datos siguen intactos en localStorage.

   Lo importante aquí no es el diseño: es decirle que sus datos están a
   salvo ANTES de que saque conclusiones, y darle una salida que no sea
   desinstalar.
   ------------------------------------------------------------------------ */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En la Beta esto va a la consola. Al conectar telemetría, este es el
    // único punto que hay que tocar.
    console.error('[NutriSnap] Error no controlado:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-ember/12 text-2xl">
          😵‍💫
        </div>

        <h1 className="mt-5 font-display text-xl font-bold tracking-tight">
          Algo se rompió por nuestro lado
        </h1>

        <p className="mt-3 max-w-[19rem] text-sm leading-relaxed text-ink-soft">
          Tu perfil y tus comidas siguen guardados en este dispositivo. No has perdido nada.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-7 rounded-2xl bg-mint px-7 py-3.5 text-[15px] font-semibold text-void"
        >
          Recargar la app
        </button>

        <details className="mt-8 w-full max-w-[20rem] text-left">
          <summary className="cursor-pointer text-center text-[12px] text-ink-faint">
            Detalles técnicos
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-white/4 p-3 text-[11px] leading-relaxed text-ink-faint">
            {this.state.error.message}
          </pre>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
            Si puedes, cópialo y mándanoslo desde el Centro de Sugerencias.
          </p>
        </details>
      </div>
    );
  }
}
