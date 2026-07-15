import { useState } from 'react'
import { Crown, Loader2, Sparkles, X } from 'lucide-react'
import { FREE_AI_PER_DAY } from '../lib/aiQuota'
import {
  PRO_PERIOD_LABEL,
  PRO_PRICE_LABEL,
  PRO_PRODUCT_ID,
  isNativeApp,
  purchasePro,
  restorePro,
} from '../lib/subscription'

interface Props {
  open: boolean
  onClose: () => void
  onActivated: () => void
  remainingFree: number
}

export function ProPaywall({ open, onClose, onActivated, remainingFree }: Props) {
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const native = isNativeApp()

  if (!open) return null

  const buy = async () => {
    setMsg(null)
    setBusy('buy')
    const res = await purchasePro()
    setBusy(null)
    if (res.ok) {
      onActivated()
      onClose()
      return
    }
    if (!res.cancelled) setMsg(res.message)
  }

  const restore = async () => {
    setMsg(null)
    setBusy('restore')
    const res = await restorePro()
    setBusy(null)
    if (res.ok) {
      onActivated()
      onClose()
      return
    }
    setMsg(res.message)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-5 shadow-2xl shadow-black/50 ring-1 ring-white/15">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-xl p-2 text-white/45 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/30 via-cyan-400/25 to-violet-400/30 ring-1 ring-white/15">
            <Crown size={22} className="text-amber-200" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-white">AURORA Pro</h2>
            <p className="text-xs text-white/50">Support the app · unlock unlimited AI</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/70">
          All weather features stay <span className="text-white">free forever</span>. Only Ask
          AURORA has a friendly daily limit so the AI stays sustainable.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-white/80">
          <li className="flex gap-2 rounded-2xl bg-white/5 px-3 py-2">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-cyan-300" />
            <span>
              Free plan: <strong className="text-white">{FREE_AI_PER_DAY} AI messages / day</strong>
              {remainingFree > 0 ? (
                <span className="text-white/45"> · {remainingFree} left today</span>
              ) : (
                <span className="text-amber-200/90"> · none left today</span>
              )}
            </span>
          </li>
          <li className="flex gap-2 rounded-2xl bg-white/5 px-3 py-2">
            <Crown size={16} className="mt-0.5 shrink-0 text-amber-200" />
            <span>
              Pro: <strong className="text-white">unlimited</strong> Ask AURORA · cancel anytime
            </span>
          </li>
        </ul>

        <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 px-4 py-4 text-center">
          <p className="font-display text-3xl text-white">
            {PRO_PRICE_LABEL}
            <span className="text-base text-white/50"> / {PRO_PERIOD_LABEL}</span>
          </p>
          <p className="mt-1 text-[11px] text-white/40">Auto-renewable · managed in App Store</p>
        </div>

        {msg && (
          <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {msg}
          </p>
        )}

        <button
          type="button"
          onClick={() => void buy()}
          disabled={!!busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400/90 to-violet-500/90 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:opacity-95 disabled:opacity-50"
        >
          {busy === 'buy' ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Crown size={18} />
          )}
          {native ? 'Subscribe — Unlimited AI' : 'Subscribe in the iPhone app'}
        </button>

        {native && (
          <button
            type="button"
            onClick={() => void restore()}
            disabled={!!busy}
            className="mt-2 w-full py-2 text-center text-xs font-medium text-white/50 transition hover:text-white/80 disabled:opacity-50"
          >
            {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
          </button>
        )}

        {!native && (
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/40">
            Install AURORA from the App Store to subscribe. On the web you still get{' '}
            {FREE_AI_PER_DAY} free AI messages every day.
          </p>
        )}

        <p className="mt-3 text-center text-[10px] leading-relaxed text-white/30">
          Payment is charged to your Apple ID. Subscription renews monthly unless cancelled at least
          24 hours before the period ends. Manage in Settings → Apple ID → Subscriptions.
          <br />
          Product ID: {PRO_PRODUCT_ID}
        </p>
      </div>
    </div>
  )
}
