import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project sites live at https://USER.github.io/REPO/
// Set BASE_PATH=/REPO/ in CI. Locally it stays "/".
const base = process.env.BASE_PATH || '/'

const AI_MODEL = 'grok-4-1-fast-non-reasoning'
const FALLBACK_MODEL = 'grok-4.5'
const SYSTEM = `You are AURORA, a brief weather helper.
Rules: use ONLY the weather data block; answer the user's question; max ~55 words; plain language; no markdown tables; if data is missing say so.`

/** Local dev proxy so `npm run dev` can use XAI_API_KEY from .env without a Worker */
function auroraAiDevProxy(): Plugin {
  return {
    name: 'aurora-ai-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (!url.endsWith('/api/ask') && url !== '/api/ask') {
          next()
          return
        }
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'POST only' }))
          return
        }

        const env = loadEnv(server.config.mode, process.cwd(), '')
        const apiKey = env.XAI_API_KEY || process.env.XAI_API_KEY
        if (!apiKey) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Add XAI_API_KEY to .env for local AI, or set VITE_AI_PROXY_URL to your Worker',
            }),
          )
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        let body: {
          question?: string
          weatherContext?: string
          history?: Array<{ role: string; content: string }>
        }
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
          return
        }

        const question = String(body.question || '').trim().slice(0, 280)
        const weatherContext = String(body.weatherContext || '').trim().slice(0, 1200)
        const history = Array.isArray(body.history) ? body.history.slice(-4) : []
        if (!question || !weatherContext) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'question and weatherContext required' }))
          return
        }

        const prior = history
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
          .map((m) => ({
            role: m.role,
            content: String(m.content).slice(0, 400),
          }))

        const messages = [
          { role: 'system', content: SYSTEM },
          ...prior,
          {
            role: 'user',
            content: `WEATHER DATA:\n${weatherContext}\n\nQuestion: ${question}`,
          },
        ]

        async function call(model: string) {
          const r = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.35,
              max_tokens: 140,
            }),
          })
          const text = await r.text()
          if (!r.ok) {
            const err = new Error(text.slice(0, 200))
            ;(err as Error & { status: number }).status = r.status
            throw err
          }
          const data = JSON.parse(text) as {
            choices?: Array<{ message?: { content?: string } }>
          }
          const answer = data.choices?.[0]?.message?.content?.trim()
          if (!answer) throw new Error('Empty AI response')
          return answer
        }

        try {
          let answer: string
          try {
            answer = await call(AI_MODEL)
          } catch (e) {
            const msg = e instanceof Error ? e.message : ''
            if (/model|not found|invalid|404|400/i.test(msg)) {
              answer = await call(FALLBACK_MODEL)
            } else {
              throw e
            }
          }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ answer }))
        } catch (e) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: e instanceof Error ? e.message.slice(0, 200) : 'AI failed',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    auroraAiDevProxy(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-512x512.png',
      ],
      manifest: {
        name: 'AURORA — Global Weather',
        short_name: 'AURORA',
        description:
          'A cinematic global weather experience. Search any city, feel the atmosphere, explore forecasts worldwide.',
        theme_color: '#0a0e1a',
        background_color: '#05070f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: './',
        start_url: './',
        categories: ['weather', 'lifestyle', 'utilities'],
        lang: 'en',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Near me',
            short_name: 'Near me',
            description: 'Open weather for your current location',
            url: './?near=1',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-forecast',
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 60 * 30,
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-geo',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/air-quality-api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-aqi',
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 60 * 30,
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Always hit network for AI proxy
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/api/ask') || url.hostname.endsWith('.workers.dev'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
