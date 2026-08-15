import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only: the site uses clean folder URLs (/trainproof/). Vite's dev server would
// look for a matching file and 404, so rewrite the known page routes to "/" and let
// the SPA entry load; main.tsx picks the page from window.location.pathname, which
// this rewrite deliberately leaves untouched.
function cleanRoutesDev(): Plugin {
  return {
    name: 'clean-routes-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && /^\/(articles|ttsproof|trainproof)\/?(\?.*)?$/.test(req.url)) {
          req.url = '/'
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cleanRoutesDev()],
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
