/**
 * AURORA AI proxy — holds XAI_API_KEY server-side.
 * Clients only send weather context + question; never see the key.
 */

const AI_MODEL = 'grok-4-1-fast-non-reasoning'
const FALLBACK_MODEL = 'grok-4.5'
const MAX_OUTPUT_TOKENS = 140
const XAI_URL = 'https://api.x.ai/v1/chat/completions'

const SYSTEM = `You are AURORA, a brief weather helper.
Rules: use ONLY the weather data block; answer the user's question; max ~55 words; plain language; no markdown tables; if data is missing say so.`

// Simple in-memory rate limit (per isolate)
const hits = new Map()
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 30

function corsHeaders(origin, allowed) {
  const allow =
    !allowed || allowed.length === 0 || (origin && allowed.includes(origin))
      ? origin || '*'
      : allowed[0]
  return {
    'Access-Control-Allow-Origin': allow || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function rateLimit(ip) {
  const now = Date.now()
  const row = hits.get(ip) || { n: 0, t: now }
  if (now - row.t > RATE_WINDOW_MS) {
    row.n = 0
    row.t = now
  }
  row.n += 1
  hits.set(ip, row)
  return row.n <= RATE_MAX
}

async function callXai(apiKey, messages, model) {
  const res = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      max_tokens: MAX_OUTPUT_TOKENS,
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    const err = new Error(text.slice(0, 200) || `xAI ${res.status}`)
    err.status = res.status
    err.body = text
    throw err
  }
  const data = JSON.parse(text)
  const answer = data.choices?.[0]?.message?.content?.trim()
  if (!answer) throw new Error('Empty AI response')
  return answer
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const origin = request.headers.get('Origin') || ''
    const headers = {
      ...corsHeaders(origin, allowed),
      'Content-Type': 'application/json',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers,
      })
    }

    if (!env.XAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server missing XAI_API_KEY secret' }),
        { status: 503, headers },
      )
    }

    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('x-forwarded-for') ||
      'unknown'
    if (!rateLimit(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests — try again in a minute' }), {
        status: 429,
        headers,
      })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers,
      })
    }

    const question = String(body.question || '').trim().slice(0, 280)
    const weatherContext = String(body.weatherContext || '').trim().slice(0, 1200)
    const history = Array.isArray(body.history) ? body.history.slice(-4) : []

    if (!question || !weatherContext) {
      return new Response(
        JSON.stringify({ error: 'question and weatherContext required' }),
        { status: 400, headers },
      )
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

    try {
      let answer
      try {
        answer = await callXai(env.XAI_API_KEY, messages, AI_MODEL)
      } catch (e) {
        const msg = String(e?.body || e?.message || '')
        if (/model|not found|invalid|404|400/i.test(msg)) {
          answer = await callXai(env.XAI_API_KEY, messages, FALLBACK_MODEL)
        } else {
          throw e
        }
      }
      return new Response(JSON.stringify({ answer }), { status: 200, headers })
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e?.message?.slice?.(0, 200) || 'AI failed' }),
        { status: e?.status && e.status < 500 ? e.status : 502, headers },
      )
    }
  },
}
