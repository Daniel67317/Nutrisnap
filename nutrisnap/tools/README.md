# Comprobación de tipos sin dependencias

Verifica `src/` con `strict`, `noUnusedLocals` y `noUnusedParameters` sin
necesidad de `npm install`. Los stubs sustituyen a react, framer-motion y
lucide-react: no validan esas librerías, pero permiten que el compilador
revise de verdad nuestro propio código.

```bash
npx tsc -p tools/tsconfig.typecheck.json
```

Dos avisos esperables y sin importancia, causados por los stubs:

- `TS2345: 'null' is not assignable` en `useRef<T>(null)` — los tipos reales
  de React tienen la sobrecarga correcta.
- `noImplicitAny` va desactivado aquí porque sin `@types/react` los
  parámetros de los manejadores de eventos salen implícitos.

Esto **no sustituye** a `npm run build`. Es la red de seguridad para cuando
no hay red.
