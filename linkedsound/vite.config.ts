import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const FIREBASE_SW_PLACEHOLDERS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

function injectFirebaseSwEnv(source: string, env: Record<string, string>): string {
  let output = source
  for (const key of FIREBASE_SW_PLACEHOLDERS) {
    const value = (env[key] || process.env[key] || '').trim()
    output = output.replaceAll(`__${key}__`, value)
  }
  return output
}

function firebaseMessagingSwPlugin(env: Record<string, string>): Plugin {
  let rootDir = process.cwd()
  let outDir = 'dist'

  return {
    name: 'firebase-messaging-sw-env',
    configResolved(config) {
      rootDir = config.root
      outDir = config.build.outDir
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        if (pathname !== '/firebase-messaging-sw.js') {
          next()
          return
        }

        const swSourcePath = path.resolve(rootDir, 'public', 'firebase-messaging-sw.js')
        if (!fs.existsSync(swSourcePath)) {
          next()
          return
        }

        const raw = fs.readFileSync(swSourcePath, 'utf8')
        const rendered = injectFirebaseSwEnv(raw, env)
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.end(rendered)
      })
    },
    closeBundle() {
      const builtSwPath = path.resolve(rootDir, outDir, 'firebase-messaging-sw.js')
      if (!fs.existsSync(builtSwPath)) return
      const raw = fs.readFileSync(builtSwPath, 'utf8')
      const rendered = injectFirebaseSwEnv(raw, env)
      fs.writeFileSync(builtSwPath, rendered, 'utf8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), firebaseMessagingSwPlugin(env)],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
  }
})
