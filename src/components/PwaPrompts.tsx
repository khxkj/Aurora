import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const INSTALL_DISMISS_KEY = 'aurora.pwaInstallDismissed'

export function PwaPrompts() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.info('[AURORA PWA] SW registered:', swUrl)
      // Check for updates every hour when the tab is open
      if (registration) {
        setInterval(() => {
          void registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.warn('[AURORA PWA] SW registration failed', error)
    },
  })

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setIsStandalone(standalone)

    const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY)
    const onBip = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (!dismissed && !standalone) setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', () => {
      setShowInstall(false)
      setInstallEvent(null)
      localStorage.removeItem(INSTALL_DISMISS_KEY)
    })

    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setShowInstall(false)
      setInstallEvent(null)
    }
  }

  const dismissInstall = () => {
    setShowInstall(false)
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()))
  }

  if (needRefresh) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pointer-events-none">
        <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 ring-1 ring-cyan-400/20">
          <RefreshCw size={18} className="shrink-0 text-cyan-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Update available</p>
            <p className="text-xs text-white/50">A new version of AURORA is ready.</p>
          </div>
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="rounded-xl bg-cyan-400/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/30"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (!showInstall || isStandalone || !installEvent) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pointer-events-none">
      <div className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 ring-1 ring-white/15">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 via-violet-400/30 to-pink-400/30 ring-1 ring-white/15">
          <Download size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Install AURORA</p>
          <p className="text-xs text-white/50">Add to your home screen for a full-app experience.</p>
        </div>
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismissInstall}
          className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
