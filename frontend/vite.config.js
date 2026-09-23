import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Captured once when this config runs (`vite build`/`vite dev` startup), then
// inlined as a static string everywhere `__APP_BUILD_TIME__` is referenced
// (see src/components/VersionBadge.jsx) — a real build timestamp, not a
// runtime "now" recomputed on every page load.
const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
})
