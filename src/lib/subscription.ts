import { Capacitor } from '@capacitor/core'

/**
 * App Store Connect product (create this before real charges work):
 * Type: Auto-Renewable Subscription
 * Product ID: com.khxkj.aurora.pro.monthly
 * Price: 20 SAR / month (Saudi Arabia)
 */
export const PRO_PRODUCT_ID = 'com.khxkj.aurora.pro.monthly'
export const PRO_PRICE_LABEL = '20 SAR'
export const PRO_PERIOD_LABEL = 'month'

const PRO_KEY = 'aurora.pro.until'

export type ProStatus = {
  isPro: boolean
  until: number | null
  source: 'none' | 'store' | 'cache'
}

function readUntil(): number | null {
  try {
    const v = localStorage.getItem(PRO_KEY)
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function setProUntil(timestampMs: number | null) {
  try {
    if (timestampMs == null) localStorage.removeItem(PRO_KEY)
    else localStorage.setItem(PRO_KEY, String(timestampMs))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('aurora-pro-changed'))
}

export function getProStatus(): ProStatus {
  const until = readUntil()
  if (until && until > Date.now()) {
    return { isPro: true, until, source: 'cache' }
  }
  if (until && until <= Date.now()) {
    setProUntil(null)
  }
  return { isPro: false, until: null, source: 'none' }
}

export function isProUser(): boolean {
  return getProStatus().isPro
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message: string }

/** Extend Pro by ~31 days (store will re-validate on restore / next launch when IAP is live) */
function grantProMonth() {
  const base = Math.max(Date.now(), readUntil() || 0)
  setProUntil(base + 31 * 24 * 60 * 60 * 1000)
}

/**
 * Subscribe via App Store when running in the iOS app.
 * Requires the subscription product in App Store Connect.
 */
export async function purchasePro(): Promise<PurchaseResult> {
  if (!isNativeApp()) {
    return {
      ok: false,
      message:
        'Subscriptions are available in the AURORA iPhone app (App Store). On the website you still get free daily AI messages.',
    }
  }

  // cordova-plugin-purchase (CdvPurchase) when available after cap sync
  const store = (window as unknown as { CdvPurchase?: CdvPurchaseNamespace }).CdvPurchase
  if (!store?.store) {
    return {
      ok: false,
      message:
        'In-app purchases are not ready yet. In App Store Connect, create subscription “com.khxkj.aurora.pro.monthly” at 20 SAR/month, then rebuild the app.',
    }
  }

  try {
    await ensureStoreReady(store)
    const product = store.store.get(PRO_PRODUCT_ID)
    if (!product) {
      return {
        ok: false,
        message: `Product ${PRO_PRODUCT_ID} not found. Create it in App Store Connect (20 SAR monthly).`,
      }
    }

    return await new Promise<PurchaseResult>((resolve) => {
      const onApproved = (transaction: { finish: () => void }) => {
        grantProMonth()
        try {
          transaction.finish()
        } catch {
          /* ignore */
        }
        cleanup()
        resolve({ ok: true })
      }
      const onError = (err: { code?: number; message?: string }) => {
        cleanup()
        // User cancelled
        if (err?.code === 6777001 || /cancel/i.test(err?.message || '')) {
          resolve({ ok: false, cancelled: true, message: 'Purchase cancelled' })
          return
        }
        resolve({
          ok: false,
          message: err?.message || 'Purchase failed. Try again later.',
        })
      }
      const cleanup = () => {
        store.store.off(store.store.APPROVED, onApproved)
        // error handler is per-call in v13 via when()
      }

      store.store.when().approved(onApproved)
      store.store.error(onError)

      product.getOffer()?.order().then((err: unknown) => {
        if (err) {
          cleanup()
          const msg =
            typeof err === 'object' && err && 'message' in err
              ? String((err as { message: string }).message)
              : 'Could not start purchase'
          if (/cancel/i.test(msg)) {
            resolve({ ok: false, cancelled: true, message: 'Purchase cancelled' })
          } else {
            resolve({ ok: false, message: msg })
          }
        }
      })
    })
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Purchase failed',
    }
  }
}

export async function restorePro(): Promise<PurchaseResult> {
  if (!isNativeApp()) {
    return {
      ok: false,
      message: 'Restore is available in the iPhone app.',
    }
  }

  const store = (window as unknown as { CdvPurchase?: CdvPurchaseNamespace }).CdvPurchase
  if (!store?.store) {
    return {
      ok: false,
      message: 'Purchases not available in this build yet.',
    }
  }

  try {
    await ensureStoreReady(store)
    await store.store.restorePurchases()
    // If any active entitlement, grant
    const owned = store.store.owned(PRO_PRODUCT_ID)
    if (owned) {
      grantProMonth()
      return { ok: true }
    }
    // Also check local after approved events
    if (isProUser()) return { ok: true }
    return { ok: false, message: 'No active AURORA Pro subscription found.' }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Restore failed',
    }
  }
}

type CdvPurchaseNamespace = {
  store: {
    verbosity: number
    register: (p: { id: string; type: unknown; platform?: unknown }) => void
    initialize: (platforms?: unknown[]) => Promise<void>
    update: () => Promise<void>
    get: (id: string) => {
      getOffer: () => { order: () => Promise<unknown> } | undefined
    } | null
    when: () => {
      approved: (cb: (t: { finish: () => void }) => void) => unknown
    }
    error: (cb: (err: { code?: number; message?: string }) => void) => void
    off: (event: unknown, cb: unknown) => void
    APPROVED: unknown
    restorePurchases: () => Promise<void>
    owned: (id: string) => boolean
    DEBUG: number
  }
  ProductType: { PAID_SUBSCRIPTION: unknown }
  Platform: { APPLE_APPSTORE: unknown }
}

let storeInit: Promise<void> | null = null

function ensureStoreReady(ns: CdvPurchaseNamespace): Promise<void> {
  if (!storeInit) {
    storeInit = (async () => {
      ns.store.verbosity = ns.store.DEBUG
      ns.store.register({
        id: PRO_PRODUCT_ID,
        type: ns.ProductType.PAID_SUBSCRIPTION,
        platform: ns.Platform.APPLE_APPSTORE,
      })
      await ns.store.initialize([ns.Platform.APPLE_APPSTORE])
      await ns.store.update()
    })()
  }
  return storeInit
}

/** Soft-init store on app launch (native only) */
export function initPurchases(): void {
  if (!isNativeApp()) return
  const tryInit = () => {
    const store = (window as unknown as { CdvPurchase?: CdvPurchaseNamespace }).CdvPurchase
    if (store?.store) {
      void ensureStoreReady(store).catch(() => {
        storeInit = null
      })
    }
  }
  tryInit()
  // Plugin may load slightly after WebView boot
  setTimeout(tryInit, 1500)
  setTimeout(tryInit, 4000)
}
