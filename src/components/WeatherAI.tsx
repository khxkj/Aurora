import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Loader2, Send, Sparkles, Trash2 } from 'lucide-react'
import {
  askWeatherAI,
  buildWeatherContext,
  isSharedAiConfigured,
  type ChatMessage,
} from '../api/ai'
import { canUseFreeAi, consumeAiCredit, getAiUsage } from '../lib/aiQuota'
import { getProStatus, initPurchases, isProUser } from '../lib/subscription'
import type { TempUnit, WeatherBundle, WindUnit } from '../types/weather'
import { ProPaywall } from './ProPaywall'

const SUGGESTIONS = [
  'What should I wear today?',
  'Is it a good day for a walk?',
  'Will it rain later?',
  'Summarize the next 3 days',
  'UV and air quality tips?',
]

interface Props {
  data: WeatherBundle
  tempUnit: TempUnit
  windUnit: WindUnit
}

export function WeatherAI({ data, tempUnit, windUnit }: Props) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [paywall, setPaywall] = useState(false)
  const [pro, setPro] = useState(() => isProUser())
  const [usage, setUsage] = useState(() => getAiUsage())
  const listRef = useRef<HTMLDivElement>(null)
  const sharedReady = isSharedAiConfigured()

  const context = useMemo(
    () => buildWeatherContext(data, tempUnit, windUnit),
    [data, tempUnit, windUnit],
  )

  useEffect(() => {
    initPurchases()
    const refresh = () => {
      setPro(isProUser())
      setUsage(getAiUsage())
    }
    window.addEventListener('aurora-pro-changed', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('aurora-pro-changed', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const remaining = pro ? Infinity : usage.remaining

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || busy) return

    // Gate free users
    if (!isProUser() && !canUseFreeAi()) {
      setPaywall(true)
      setError(null)
      return
    }

    setError(null)
    setBusy(true)
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: q }
    setMessages((m) => [...m, userMsg])

    try {
      const answer = await askWeatherAI({
        weatherContext: context,
        question: q,
        history: messages,
      })
      // Only consume after a successful answer
      if (!getProStatus().isPro) {
        consumeAiCredit()
        setUsage(getAiUsage())
      }
      setMessages((m) => [...m, { role: 'assistant', content: answer }])
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void ask(input)
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5 }}
        className="glass rounded-3xl p-4 sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/25 via-violet-400/25 to-pink-400/25 ring-1 ring-white/15">
              <Sparkles size={18} className="text-cyan-200" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white/90">
                Ask AURORA
              </h2>
              <p className="text-[11px] text-white/40">
                {pro
                  ? 'Pro · unlimited AI'
                  : `Free · ${usage.remaining}/${usage.limit} AI messages left today`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!pro && (
              <button
                type="button"
                onClick={() => setPaywall(true)}
                className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-300/25 transition hover:bg-amber-400/25"
              >
                <Crown size={12} />
                Pro · 20 SAR
              </button>
            )}
            {pro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 ring-1 ring-cyan-300/25">
                <Crown size={12} />
                Pro
              </span>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setError(null)
                }}
                className="rounded-xl bg-white/8 p-1.5 text-white/50 transition hover:bg-white/12 hover:text-white"
                aria-label="Clear chat"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {!sharedReady && (
          <p className="mb-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90">
            Shared AI is not configured on this build yet.
          </p>
        )}

        {!pro && usage.remaining === 0 && (
          <button
            type="button"
            onClick={() => setPaywall(true)}
            className="mb-3 w-full rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-left text-xs text-amber-50 transition hover:bg-amber-500/15"
          >
            You’ve used today’s free AI messages. Upgrade to{' '}
            <span className="font-semibold">AURORA Pro (20 SAR/month)</span> for unlimited Ask
            AURORA — weather stays free.
          </button>
        )}

        {messages.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void ask(s)}
                disabled={busy}
                className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white/70 transition hover:bg-white/14 hover:text-white disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          ref={listRef}
          className="mb-3 max-h-64 space-y-2.5 overflow-y-auto rounded-2xl bg-black/20 p-3"
        >
          {messages.length === 0 && (
            <p className="py-6 text-center text-xs text-white/35">
              Ask about clothes, rain, UV, or the weekend plan for{' '}
              <span className="text-white/55">{data.location.name}</span>.
              {!pro && (
                <>
                  <br />
                  <span className="text-white/30">
                    Free daily AI limit · everything else in the app is free.
                  </span>
                </>
              )}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-500/25 text-cyan-50 ring-1 ring-cyan-400/20'
                    : 'bg-white/10 text-white/90 ring-1 ring-white/10'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Loader2 size={14} className="animate-spin" />
              Thinking with live weather…
            </div>
          )}
        </div>

        {error && (
          <p className="mb-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              !pro && remaining === 0
                ? 'Upgrade for unlimited AI…'
                : 'Ask anything about this forecast…'
            }
            maxLength={280}
            disabled={busy}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-400/35 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 px-3.5 text-white ring-1 ring-white/15 transition hover:from-cyan-400/40 hover:to-violet-500/40 disabled:opacity-40"
            aria-label="Send"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </motion.section>

      <ProPaywall
        open={paywall}
        onClose={() => setPaywall(false)}
        onActivated={() => {
          setPro(true)
          setUsage(getAiUsage())
          setError(null)
        }}
        remainingFree={usage.remaining}
      />
    </>
  )
}
