declare module 'recharts' {
  export const Bar: any, BarChart: any, Line: any, LineChart: any,
    XAxis: any, YAxis: any, CartesianGrid: any, Tooltip: any,
    ResponsiveContainer: any, ReferenceLine: any;
}
declare module 'lucide-react' {
  export const BookmarkPlus: any, Send: any, PersonStanding: any, Info: any,
    Award: any, Lock: any, Sunrise: any, Target: any, TrendingUp: any,
    Trophy: any, ChevronDown: any, AlertTriangle: any, RotateCcw: any;
}
declare module 'react' {
  export class Component<P = any, S = any> {
    constructor(props: P);
    props: P; state: S;
    setState(s: any): void;
    render(): any;
  }
  export type ErrorInfo = { componentStack: string };
}
