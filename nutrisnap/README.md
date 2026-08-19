# NutriSnap · Beta 0.1

Registra tu comida en 5 segundos con IA. React + Vite + Tailwind v4 + Framer Motion.

## Arrancar

```bash
npm install
npm run dev
```

La cámara (`getUserMedia`) sólo funciona en `localhost` o bajo HTTPS. Para probar
en un móvil real: `npm run dev -- --host` más un túnel HTTPS (ngrok, cloudflared).

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Arquitectura, tokens, contexto, persistencia | ✅ |
| Barra de navegación inferior | ✅ |
| Onboarding (5 pasos + permiso de cámara) | ✅ |
| Dashboard (anillo, macros, entrenador, diario) | ✅ |
| Analizador (cámara, escaneo, cajas, edición) | ✅ |
| Chat con Nutri (parser + motor de respuestas) | ✅ |
| Planes (split, ejercicios, RPE, check) | ✅ |
| Progreso (gráficas, racha, insignias, peso) | ✅ |
| Perfil, Sugerencias, roadmap, legal, reinicio | ✅ |
| PWA instalable + modo sin conexión | ✅ |
| Error boundary | ✅ |

## Comprobar tipos sin instalar nada

```bash
npx tsc -p tools/tsconfig.typecheck.json
```

Ver `tools/README.md`. No sustituye a `npm run build`.

## Dónde tocar qué

- `src/lib/data.ts` — base de alimentos (valores por 100 g) y catálogos de opciones.
- `src/lib/nutrition.ts` — BMR, TDEE, objetivos y suma de macros.
- `src/lib/storage.ts` — persistencia en localStorage (clave `nutrisnap:state`).
- `src/lib/training.ts` — split semanal y nota del entrenador.
- `src/lib/vision.ts` — adaptador de visión. Cambiar `activeProvider` conecta la API real.
- `src/lib/image.ts` — reduce y recomprime las fotos antes de guardarlas.
- `src/lib/chat.ts` — parser de texto a alimentos y motor de respuestas.
- `src/lib/exercises.ts` — base de ejercicios de gimnasio y calistenia.
- `src/lib/feedback.ts` — envío de sugerencias. Sin `VITE_FEEDBACK_ENDPOINT` no salen del dispositivo.
- `src/hooks/useCamera.ts` — ciclo de vida del stream de cámara.
- `src/lib/access.ts` — puerta única de acceso a las funciones de IA.
- `src/lib/motion.ts` — las tres curvas de animación de toda la app.
- `src/index.css` — tokens de color y tipografía (`@theme` de Tailwind v4).

Para reiniciar el onboarding durante desarrollo:
`localStorage.removeItem('nutrisnap:state')` en la consola.

## Presupuesto de almacenamiento

Cada foto pesa ~85 KB como data URL tras `prepareImage` (720 px, JPEG q0.72).
localStorage da ~5 MB en total, así que sólo las **20 comidas más recientes**
conservan su imagen; las anteriores sueltan la foto y mantienen intactos sus
macros e historial. Sin el redimensionado, una sola foto de móvil (~4 MB)
habría llenado la cuota entera.

## Antes de abrir la Beta

1. `npm install && npm run build` — nunca se ha ejecutado (se desarrolló sin red).
2. Desplegar con HTTPS (Vercel, Netlify): sin él no hay cámara en vivo
   ni service worker.
3. Configurar `VITE_FEEDBACK_ENDPOINT` — ver `.env.example`. Sin esto, las
   sugerencias se quedan en el dispositivo del usuario y nunca las verás.
4. Probar en un móvil real: instalar desde "Añadir a pantalla de inicio",
   tomar una foto **en vertical** y comprobar que no sale girada.

### Al publicar una versión nueva

Sube `CACHE` en `public/sw.js` (`nutrisnap-v1` → `v2`). Si no, los usuarios
que ya tengan la app instalada seguirán viendo la versión antigua desde caché.

## Aviso

Las cifras son estimaciones y no sustituyen el criterio de un profesional de
la salud.
