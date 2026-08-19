declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export type CSSProperties = any;
  export type ComponentPropsWithoutRef<T> = any;
  export type FC<P = any> = (props: P) => any;
  export function useState<S>(init: S | (() => S)): [S, (v: S | ((p: S) => S)) => void];
  export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(fn: () => T, deps: any[]): T;
  export function useCallback<T>(fn: T, deps: any[]): T;
  export function useRef<T>(init: T): { current: T };
  export interface Context<T> { Provider: any; Consumer: any }
  export function createContext<T>(v: T): Context<T>;
  export function useContext<T>(c: Context<T>): T;
  const React: any;
  export default React;
}
declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare module 'react-dom/client' { export function createRoot(el: any): any; }
declare namespace JSX { interface IntrinsicElements { [k: string]: any } type Element = any; }
declare module 'react' { export const StrictMode: any; }
declare module '*.css';
declare namespace JSX { interface IntrinsicAttributes { key?: any } }
