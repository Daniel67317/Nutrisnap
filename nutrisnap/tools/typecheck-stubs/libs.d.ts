declare module 'framer-motion' {
  export type Transition = any;
  export type Variants = any;
  export const motion: any;
  export const AnimatePresence: any;
  export function animate(from: any, to: any, opts?: any): { stop(): void };
  export function useMotionValue<T>(v: T): any;
  export function useTransform(src: any, fn: any): any;
  export function useReducedMotion(): boolean | null;
}
declare module 'lucide-react' {
  export type LucideIcon = any;
  export const Check: any, Camera: any, ImageUp: any, MessageSquareText: any,
    ArrowLeft: any, ArrowRight: any, Sparkles: any, Pencil: any, Home: any,
    Dumbbell: any, ScanLine: any, BarChart3: any, User: any, Flame: any,
    Scale: any, Clock: any, Play: any, MessageCircle: any, X: any,
    Trash2: any, UtensilsCrossed: any, MessageSquare: any, PencilLine: any,
    AlertCircle: any, Loader2: any, Minus: any, Plus: any, RotateCcw: any,
    Search: any;
}
