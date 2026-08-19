import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // La cámara (getUserMedia) sólo funciona en localhost o HTTPS.
    // Para probar en un móvil real usa `npm run dev -- --host` + un túnel HTTPS.
    host: true,
  },
});
